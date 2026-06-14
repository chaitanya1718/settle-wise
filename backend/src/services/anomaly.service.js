const prisma = require("../config/prisma");

/**
 * Analyze a single CSV row for anomalies.
 * 
 * Columns:
 * - date
 * - description
 * - paid_by
 * - amount
 * - currency
 * - split_type
 * - split_with
 * - split_details
 * - notes
 * 
 * @param {object} row - The row data object
 * @param {number} rowNumber - The row number in the CSV
 * @param {string} groupId - The target group ID
 * @param {string|null} groupCurrency - The currency baseline for the group
 * @returns {Promise<Array<object>>} - List of anomalies found for this row
 */
const analyzeRow = async (row, rowNumber, groupId, groupCurrency) => {
  const anomalies = [];
  const { date, description, paid_by, amount, currency, split_type, split_with, split_details, notes } = row;

  // 1. AMBIGUOUS_ROW Checks (critical structural checks)
  if (!date && !amount && !paid_by) {
    anomalies.push({
      rowNumber,
      anomalyType: "AMBIGUOUS_ROW",
      severity: "HIGH",
      description: "Row is empty or lacks all required transaction fields.",
      actionTaken: "Row flagged for review"
    });
    return anomalies; // Stop checking further if the row is empty
  }

  const parsedAmount = parseFloat(amount);
  const isAmountValid = !isNaN(parsedAmount);
  const parsedDate = new Date(date);
  const isDateValid = date && !isNaN(parsedDate.getTime());

  if (!date || !amount || !paid_by || !isAmountValid) {
    anomalies.push({
      rowNumber,
      anomalyType: "AMBIGUOUS_ROW",
      severity: "HIGH",
      description: "Row has missing date, missing paid_by, or missing/invalid amount column values.",
      actionTaken: "Row flagged for review"
    });
    return anomalies; // Stop checks if structural baseline is broken
  }

  // 2. NEGATIVE_AMOUNT or ZERO_AMOUNT
  if (parsedAmount < 0) {
    anomalies.push({
      rowNumber,
      anomalyType: "NEGATIVE_AMOUNT",
      severity: "HIGH",
      description: `Amount is negative: ${amount}`,
      actionTaken: "Row flagged for review"
    });
  } else if (parsedAmount === 0) {
    anomalies.push({
      rowNumber,
      anomalyType: "ZERO_AMOUNT",
      severity: "HIGH",
      description: "Amount is zero.",
      actionTaken: "Row flagged for review"
    });
  }

  // 3. INVALID_DATE
  if (!isDateValid) {
    anomalies.push({
      rowNumber,
      anomalyType: "INVALID_DATE",
      severity: "HIGH",
      description: `Date field contains an invalid date string: ${date}`,
      actionTaken: "Row flagged for review"
    });
  }

  // 4. MISSING_PAYER
  if (!paid_by || paid_by.trim() === "") {
    anomalies.push({
      rowNumber,
      anomalyType: "MISSING_PAYER",
      severity: "HIGH",
      description: "Payer identity field is empty.",
      actionTaken: "Row flagged for review"
    });
  }

  const cleanSplitType = split_type ? split_type.toUpperCase().trim() : "";

  // 5. SELF_SETTLEMENT & MISSING_PARTICIPANT
  if (cleanSplitType === "SETTLEMENT") {
    if (paid_by && split_with && paid_by.toLowerCase().trim() === split_with.toLowerCase().trim()) {
      anomalies.push({
        rowNumber,
        anomalyType: "SELF_SETTLEMENT",
        severity: "HIGH",
        description: `Self-settlement detected: Payer and Receiver are the same user (${paid_by}).`,
        actionTaken: "Row flagged for review"
      });
    }
  } else {
    // Missing participant check is only for expenses
    if (!split_with || split_with.trim() === "") {
      anomalies.push({
        rowNumber,
        anomalyType: "MISSING_PARTICIPANT",
        severity: "HIGH",
        description: "Expense split_with field is empty (requires at least one participant).",
        actionTaken: "Row flagged for review"
      });
    }
  }

  // 6. UNKNOWN_SPLIT_TYPE
  const allowedTypes = ["EQUAL", "EXACT", "PERCENTAGE", "SHARES", "SETTLEMENT"];
  if (split_type && !allowedTypes.includes(cleanSplitType)) {
    anomalies.push({
      rowNumber,
      anomalyType: "UNKNOWN_SPLIT_TYPE",
      severity: "HIGH",
      description: `Split type '${split_type}' is unrecognized.`,
      actionTaken: "Row flagged for review"
    });
  }

  // Database Validations (Payer, Group Membership, Timelines, Currency, Duplicates)
  if (groupId) {
    let payerUser = null;

    // A. Validate Payer
    if (paid_by) {
      payerUser = await prisma.user.findUnique({
        where: { email: paid_by.toLowerCase().trim() }
      });

      if (!payerUser) {
        anomalies.push({
          rowNumber,
          anomalyType: "INVALID_MEMBER",
          severity: "HIGH",
          description: `Payer email '${paid_by}' is not registered.`,
          actionTaken: "Row flagged for review"
        });
      } else {
        // Validate Payer Group Membership
        const payerMembership = await prisma.groupMembership.findUnique({
          where: {
            userId_groupId: {
              userId: payerUser.id,
              groupId
            }
          }
        });

        if (!payerMembership) {
          anomalies.push({
            rowNumber,
            anomalyType: "INVALID_MEMBER",
            severity: "HIGH",
            description: `Payer '${paid_by}' is not a member of this group.`,
            actionTaken: "Row flagged for review"
          });
        } else if (isDateValid) {
          // Validate timeline bounds
          const joinedTime = new Date(payerMembership.joinedAt).setUTCHours(0, 0, 0, 0);
          const expTime = new Date(parsedDate).setUTCHours(0, 0, 0, 0);

          if (joinedTime > expTime) {
            anomalies.push({
              rowNumber,
              anomalyType: "MEMBERSHIP_VIOLATION",
              severity: "HIGH",
              description: `Payer '${paid_by}' joined after the transaction date.`,
              actionTaken: "Row flagged for review"
            });
          } else if (payerMembership.leftAt) {
            const leftTime = new Date(payerMembership.leftAt).setUTCHours(0, 0, 0, 0);
            if (expTime > leftTime) {
              anomalies.push({
                rowNumber,
                anomalyType: "MEMBERSION_VIOLATION", // Enforcing spelling alignment or standard
                anomalyType: "MEMBERSHIP_VIOLATION",
                severity: "HIGH",
                description: `Payer '${paid_by}' had already left the group on the transaction date.`,
                actionTaken: "Row flagged for review"
              });
            }
          }
        }
      }
    }

    // B. Validate Participants / Receiver
    if (split_with) {
      if (cleanSplitType === "SETTLEMENT") {
        // Settlement Receiver Validation
        const receiverEmail = split_with.toLowerCase().trim();
        const receiverUser = await prisma.user.findUnique({
          where: { email: receiverEmail }
        });

        if (!receiverUser) {
          anomalies.push({
            rowNumber,
            anomalyType: "INVALID_MEMBER",
            severity: "HIGH",
            description: `Receiver email '${split_with}' is not registered.`,
            actionTaken: "Row flagged for review"
          });
        } else {
          const receiverMembership = await prisma.groupMembership.findUnique({
            where: {
              userId_groupId: {
                userId: receiverUser.id,
                groupId
              }
            }
          });
          if (!receiverMembership) {
            anomalies.push({
              rowNumber,
              anomalyType: "INVALID_MEMBER",
              severity: "HIGH",
              description: `Receiver '${split_with}' is not a member of this group.`,
              actionTaken: "Row flagged for review"
            });
          }
        }
      } else {
        // Expense Participants Validation
        const participantEmails = split_with
          .split(/[;,]/)
          .map(e => e.trim().toLowerCase())
          .filter(e => e.length > 0);

        for (const email of participantEmails) {
          const partUser = await prisma.user.findUnique({
            where: { email }
          });

          if (!partUser) {
            anomalies.push({
              rowNumber,
              anomalyType: "INVALID_MEMBER",
              severity: "HIGH",
              description: `Participant email '${email}' is not registered.`,
              actionTaken: "Row flagged for review"
            });
          } else {
            const partMembership = await prisma.groupMembership.findUnique({
              where: {
                userId_groupId: {
                  userId: partUser.id,
                  groupId
                }
              }
            });

            if (!partMembership) {
              anomalies.push({
                rowNumber,
                anomalyType: "INVALID_MEMBER",
                severity: "HIGH",
                description: `Participant '${email}' is not a member of this group.`,
                actionTaken: "Row flagged for review"
              });
            } else if (isDateValid) {
              const joinedTime = new Date(partMembership.joinedAt).setUTCHours(0, 0, 0, 0);
              const expTime = new Date(parsedDate).setUTCHours(0, 0, 0, 0);

              if (joinedTime > expTime) {
                anomalies.push({
                  rowNumber,
                  anomalyType: "MEMBERSHIP_VIOLATION",
                  severity: "HIGH",
                  description: `Participant '${email}' joined after the expense date.`,
                  actionTaken: "Row flagged for review"
                });
              } else if (partMembership.leftAt) {
                const leftTime = new Date(partMembership.leftAt).setUTCHours(0, 0, 0, 0);
                if (expTime > leftTime) {
                  anomalies.push({
                    rowNumber,
                    anomalyType: "MEMBERSHIP_VIOLATION",
                    severity: "HIGH",
                    description: `Participant '${email}' had already left the group on the expense date.`,
                    actionTaken: "Row flagged for review"
                  });
                }
              }
            }
          }
        }
      }
    }

    // C. MIXED_CURRENCY check
    if (currency && groupCurrency) {
      const cleanCurrency = currency.toUpperCase().trim();
      if (cleanCurrency !== groupCurrency) {
        anomalies.push({
          rowNumber,
          anomalyType: "MIXED_CURRENCY",
          severity: "MEDIUM",
          description: `Mixed currency detected: row currency '${cleanCurrency}' differs from baseline '${groupCurrency}'.`,
          actionTaken: "Row flagged for review"
        });
      }
    }

    // D. DUPLICATE_EXPENSE check (only for expenses)
    if (cleanSplitType !== "SETTLEMENT" && description && isAmountValid && isDateValid && payerUser) {
      const duplicateExpense = await prisma.expense.findFirst({
        where: {
          groupId,
          payerId: payerUser.id,
          title: { equals: description.trim(), mode: "insensitive" },
          amount: parsedAmount,
          expenseDate: new Date(parsedDate)
        }
      });

      if (duplicateExpense) {
        anomalies.push({
          rowNumber,
          anomalyType: "DUPLICATE_EXPENSE",
          severity: "LOW",
          description: `Duplicate expense detected: expense '${description.trim()}' already exists.`,
          actionTaken: "Row flagged for review"
        });
      }
    }
  }

  return anomalies;
};

module.exports = {
  analyzeRow
};
