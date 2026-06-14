const fs = require("fs");
const path = require("path");
const prisma = require("../config/prisma");
const csvParser = require("../utils/csvParser");
const expenseService = require("./expense.service");
const settlementService = require("./settlement.service");

/**
 * Retrieve all import jobs ordered by newest first.
 */
const getImportJobs = async () => {
  return await prisma.importJob.findMany({
    orderBy: { createdAt: "desc" }
  });
};

/**
 * Retrieve import job details along with all its anomalies.
 */
const getImportJobById = async (jobId) => {
  const job = await prisma.importJob.findUnique({
    where: { id: jobId }
  });
  if (!job) {
    const error = new Error("Import job not found.");
    error.statusCode = 404;
    throw error;
  }

  const anomalies = await prisma.importAnomaly.findMany({
    where: { importJobId: jobId },
    orderBy: { rowNumber: "asc" }
  });

  return { job, anomalies };
};

/**
 * Approve a specific anomaly.
 */
const approveAnomaly = async (id) => {
  const anomaly = await prisma.importAnomaly.findUnique({
    where: { id }
  });
  if (!anomaly) {
    const error = new Error("Import anomaly not found.");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.importAnomaly.update({
    where: { id },
    data: { reviewStatus: "APPROVED" }
  });
};

/**
 * Reject a specific anomaly.
 */
const rejectAnomaly = async (id) => {
  const anomaly = await prisma.importAnomaly.findUnique({
    where: { id }
  });
  if (!anomaly) {
    const error = new Error("Import anomaly not found.");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.importAnomaly.update({
    where: { id },
    data: { reviewStatus: "REJECTED" }
  });
};

/**
 * Execute import job: process approved rows, skip rejected ones, and delete the persisted file on success.
 */
const executeImportJob = async (jobId, groupId) => {
  if (!groupId) {
    const error = new Error("Group ID is required for execution.");
    error.statusCode = 400;
    throw error;
  }

  const csvPath = path.join("uploads", `import-${jobId}.csv`);

  try {
    return await prisma.$transaction(
      async (tx) => {
      // 1. Validate Group
      const group = await tx.group.findUnique({
        where: { id: groupId }
      });
      if (!group) {
        const error = new Error("Group not found.");
        error.statusCode = 404;
        throw error;
      }

      // 2. Validate ImportJob
      const job = await tx.importJob.findUnique({
        where: { id: jobId }
      });
      if (!job) {
        const error = new Error("Import job not found.");
        error.statusCode = 404;
        throw error;
      }

      if (job.status === "COMPLETED" || job.status === "FAILED") {
        const error = new Error(`Import job has already been executed with status: ${job.status}`);
        error.statusCode = 400;
        throw error;
      }

      // 3. Load all anomalies
      const anomalies = await tx.importAnomaly.findMany({
        where: { importJobId: jobId }
      });

      // 4. Validate anomaly statuses (HIGH/MEDIUM cannot be PENDING)
      const pendingHighMedium = anomalies.filter(
        a => (a.severity === "HIGH" || a.severity === "MEDIUM") && a.reviewStatus === "PENDING"
      );
      if (pendingHighMedium.length > 0) {
        const error = new Error(`Cannot execute import. ${pendingHighMedium.length} HIGH or MEDIUM severity anomaly/anomalies are still PENDING review.`);
        error.statusCode = 400;
        throw error;
      }

      // 5. Load CSV
      if (!fs.existsSync(csvPath)) {
        const error = new Error("Persisted CSV file not found on disk. Job cannot be executed.");
        error.statusCode = 400;
        throw error;
      }

      const parsedRows = await csvParser.parseCSV(csvPath);

      let importedRows = 0;
      let ignoredRows = 0;
      let importedExpenses = 0;
      let importedSettlements = 0;

      // 6. Iterate through CSV rows
      for (let i = 0; i < parsedRows.length; i++) {
        const row = parsedRows[i];
        const rowNumber = i + 1;

        const rowAnomalies = anomalies.filter(a => a.rowNumber === rowNumber);
        const hasRejected = rowAnomalies.some(a => a.reviewStatus === "REJECTED");

        if (hasRejected) {
          ignoredRows++;
          continue;
        }

        // Import row
        const { date, description, paid_by, amount, currency, split_type, split_with, split_details, notes } = row;
        const cleanSplitType = split_type ? split_type.toUpperCase().trim() : "";

        // Resolve Payer User
        const payerUser = await tx.user.findUnique({
          where: { email: paid_by.toLowerCase().trim() }
        });
        if (!payerUser) {
          throw new Error(`Payer ${paid_by} not found in database for row ${rowNumber}.`);
        }

        if (cleanSplitType === "SETTLEMENT") {
          // Resolve Receiver User
          const receiverEmail = split_with.toLowerCase().trim();
          const receiverUser = await tx.user.findUnique({
            where: { email: receiverEmail }
          });
          if (!receiverUser) {
            throw new Error(`Receiver ${split_with} not found in database for row ${rowNumber}.`);
          }

          // Import as Settlement
          await settlementService.createSettlement(
            {
              payerId: payerUser.id,
              receiverId: receiverUser.id,
              amount: parseFloat(amount),
              currency: currency.toUpperCase().trim()
            },
            tx
          );

          importedSettlements++;
          importedRows++;
        } else {
          // Resolve Participant Users
          const participantEmails = split_with
            .split(/[;,]/)
            .map(e => e.trim().toLowerCase())
            .filter(e => e.length > 0);

          const participants = [];
          for (const email of participantEmails) {
            const partUser = await tx.user.findUnique({
              where: { email }
            });
            if (!partUser) {
              throw new Error(`Participant ${email} not found in database for row ${rowNumber}.`);
            }
            participants.push({ userId: partUser.id });
          }

          // Import as Expense
          await expenseService.createExpense(
            {
              title: description ? description.trim() : "Imported Expense",
              description: notes ? notes.trim() : null,
              amount: parseFloat(amount),
              currency: currency.toUpperCase().trim(),
              splitType: cleanSplitType || "EQUAL",
              expenseDate: new Date(date),
              payerId: payerUser.id,
              groupId,
              participants
            },
            tx
          );

          importedExpenses++;
          importedRows++;
        }
      }

      // 7. Update job status to COMPLETED
      await tx.importJob.update({
        where: { id: jobId },
        data: { status: "COMPLETED" }
      });

      return {
        importedRows,
        ignoredRows,
        importedExpenses,
        importedSettlements
      };
    }, {
      maxWait: 15000,
      timeout: 30000
    });
  } catch (error) {
    // Set status to FAILED in database on execution failure (excluding validation blocks)
    if (error.statusCode !== 400) {
      try {
        await prisma.importJob.update({
          where: { id: jobId },
          data: { status: "FAILED" }
        });
      } catch (dbErr) {
        console.error("Failed to update job status to FAILED on error:", dbErr.message);
      }
    }
    throw error;
  } finally {
    // Delete file from disk if transaction was successful (and status is COMPLETED)
    try {
      const finalJob = await prisma.importJob.findUnique({ where: { id: jobId } });
      if (finalJob && finalJob.status === "COMPLETED" && fs.existsSync(csvPath)) {
        fs.unlinkSync(csvPath);
      }
    } catch (cleanErr) {
      console.error("Failed to clean up CSV file on import completion:", cleanErr.message);
    }
  }
};

module.exports = {
  getImportJobs,
  getImportJobById,
  approveAnomaly,
  rejectAnomaly,
  executeImportJob
};
