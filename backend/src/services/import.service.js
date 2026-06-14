const fs = require("fs");
const path = require("path");
const prisma = require("../config/prisma");
const csvParser = require("../utils/csvParser");
const anomalyService = require("./anomaly.service");

/**
 * Parses and analyzes a transaction CSV file.
 * Records anomalies in the database and returns a summary report.
 * Does not write any actual Expense or Settlement records yet.
 * 
 * @param {string} filePath - Path to the uploaded CSV file
 * @param {string} fileName - Original uploaded name of the file
 * @param {string} groupId - Target group ID
 * @returns {Promise<object>} - Import summary report
 */
const processImport = async (filePath, fileName, groupId) => {
  // Validate group exists
  const group = await prisma.group.findUnique({
    where: { id: groupId }
  });
  if (!group) {
    const error = new Error("Group not found.");
    error.statusCode = 404;
    throw error;
  }

  // Retrieve group currency baseline from existing expenses
  const groupExpenses = await prisma.expense.findMany({
    where: { groupId }
  });
  let groupCurrency = groupExpenses.length > 0 ? groupExpenses[0].currency : null;

  // Create the ImportJob record
  const importJob = await prisma.importJob.create({
    data: {
      fileName,
      status: "PENDING"
    }
  });

  // Persist the CSV file on disk for later review and execution
  const targetDir = path.dirname(filePath);
  const targetPath = path.join(targetDir, `import-${importJob.id}.csv`);
  try {
    fs.copyFileSync(filePath, targetPath);
  } catch (err) {
    console.error("Failed to copy CSV file to persistent path:", err.message);
  }

  let parsedRows = [];
  try {
    parsedRows = await csvParser.parseCSV(filePath);
  } catch (err) {
    await prisma.importJob.update({
      where: { id: importJob.id },
      data: { status: "FAILED" }
    });
    throw new Error(`Failed to parse CSV file: ${err.message}`);
  }

  let rowsProcessed = 0;
  let anomaliesFound = 0;
  const severityBreakdown = {
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0
  };
  const anomalyDetails = [];

  // Iterate over parsed rows and look for anomalies
  for (let i = 0; i < parsedRows.length; i++) {
    rowsProcessed++;
    const row = parsedRows[i];
    const rowNumber = i + 1;

    // Establish group currency from CSV if not set on the group yet
    if (!groupCurrency && row.currency) {
      groupCurrency = row.currency.toUpperCase().trim();
    }

    // Call anomaly validation service
    const rowAnomalies = await anomalyService.analyzeRow(row, rowNumber, groupId, groupCurrency);

    if (rowAnomalies.length > 0) {
      anomaliesFound += rowAnomalies.length;

      // Save ImportAnomaly records in database
      for (const anomaly of rowAnomalies) {
        severityBreakdown[anomaly.severity]++;

        const dbAnomaly = await prisma.importAnomaly.create({
          data: {
            importJobId: importJob.id,
            rowNumber: anomaly.rowNumber,
            anomalyType: anomaly.anomalyType,
            severity: anomaly.severity,
            description: anomaly.description,
            actionTaken: anomaly.actionTaken,
            reviewStatus: "PENDING"
          }
        });

        anomalyDetails.push({
          id: dbAnomaly.id,
          rowNumber: anomaly.rowNumber,
          anomalyType: anomaly.anomalyType,
          severity: anomaly.severity,
          description: anomaly.description,
          actionTaken: anomaly.actionTaken
        });
      }
    }
  }

  // Update ImportJob to PENDING (for review workflow)
  await prisma.importJob.update({
    where: { id: importJob.id },
    data: { status: "PENDING" }
  });

  return {
    jobId: importJob.id,
    rowsProcessed,
    anomaliesFound,
    severityBreakdown,
    anomalyDetails
  };
};

module.exports = {
  processImport
};
