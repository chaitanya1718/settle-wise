const prisma = require("../config/prisma");

/**
 * Calculate Equal Split
 * Divides the total amount equally among the participants.
 * Distributes the rounding remainder to the first participant.
 */
const calculateEqualSplit = (amount, participants) => {
  const total = parseFloat(amount);
  const count = participants.length;
  const baseShare = Math.floor((total / count) * 100) / 100;
  const remainder = Math.round((total - baseShare * count) * 100) / 100;

  return participants.map((p, index) => ({
    userId: p.userId,
    shareAmount: index === 0 ? baseShare + remainder : baseShare
  }));
};

/**
 * Placeholder split calculations (to be extended in Phase 5)
 */
const calculateExactSplit = (amount, participants) => {
  throw new Error("EXACT split type calculation is not yet implemented.");
};

const calculatePercentageSplit = (amount, participants) => {
  throw new Error("PERCENTAGE split type calculation is not yet implemented.");
};

const calculateSharesSplit = (amount, participants) => {
  throw new Error("SHARES split type calculation is not yet implemented.");
};

const stripTime = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
};

/**
 * Validate that the payer and all participants were active members of the group on the expense date.
 */
const validateGroupMemberships = async (tx, groupId, payerId, participants, expenseDate) => {
  const userIds = [payerId, ...participants.map(p => p.userId)];
  const uniqueUserIds = [...new Set(userIds)];
  const expDateTime = stripTime(expenseDate);

  // Fetch all group membership records for these users
  const memberships = await tx.groupMembership.findMany({
    where: {
      groupId,
      userId: { in: uniqueUserIds }
    }
  });

  if (memberships.length !== uniqueUserIds.length) {
    throw new Error("One or more users (payer or participants) are not members of the group.");
  }

  for (const membership of memberships) {
    const joinedAtTime = stripTime(membership.joinedAt);
    if (joinedAtTime > expDateTime) {
      throw new Error(`User ${membership.userId} was not a member of the group on the expense date (joined on ${new Date(membership.joinedAt).toISOString().slice(0, 10)} which is after expense date ${new Date(expenseDate).toISOString().slice(0, 10)}).`);
    }
    if (membership.leftAt) {
      const leftAtTime = stripTime(membership.leftAt);
      if (expDateTime > leftAtTime) {
        throw new Error(`User ${membership.userId} had already left the group on the expense date (left on ${new Date(membership.leftAt).toISOString().slice(0, 10)} which is before expense date ${new Date(expenseDate).toISOString().slice(0, 10)}).`);
      }
    }
  }
};

/**
 * Create a new expense with participants and calculated splits.
 */
const createExpense = async (data, tx) => {
  const { title, description, amount, currency, splitType, expenseDate, payerId, groupId, participants } = data;

  // Basic validations
  if (!title || !amount || !currency || !splitType || !expenseDate || !payerId || !groupId || !participants) {
    throw new Error("Missing required fields for creating an expense.");
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error("Amount must be a positive number greater than 0.");
  }

  if (!Array.isArray(participants) || participants.length === 0) {
    throw new Error("At least one participant is required.");
  }

  const execute = async (client) => {
    // 1. Verify group exists
    const groupExists = await client.group.findUnique({ where: { id: groupId } });
    if (!groupExists) {
      throw new Error("The specified group does not exist.");
    }

    // 2. Validate membership timelines (payer and participants must be active on the expenseDate)
    await validateGroupMemberships(client, groupId, payerId, participants, expenseDate);

    // 3. Compute shares based on split type
    let participantShares = [];
    const upperSplitType = splitType.toUpperCase();

    if (upperSplitType === "EQUAL") {
      participantShares = calculateEqualSplit(numericAmount, participants);
    } else if (upperSplitType === "EXACT") {
      participantShares = calculateExactSplit(numericAmount, participants);
    } else if (upperSplitType === "PERCENTAGE") {
      participantShares = calculatePercentageSplit(numericAmount, participants);
    } else if (upperSplitType === "SHARES") {
      participantShares = calculateSharesSplit(numericAmount, participants);
    } else {
      throw new Error(`Unsupported split type: ${splitType}`);
    }

    // 4. Create main Expense record
    const expense = await client.expense.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        amount: numericAmount,
        currency: currency.toUpperCase().trim(),
        splitType: upperSplitType,
        expenseDate: new Date(expenseDate),
        payerId,
        groupId
      }
    });

    // 5. Create ExpenseParticipant records
    await client.expenseParticipant.createMany({
      data: participantShares.map(share => ({
        expenseId: expense.id,
        userId: share.userId,
        shareAmount: share.shareAmount
      }))
    });

    // Return the complete expense including participants
    return await client.expense.findUnique({
      where: { id: expense.id },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });
  };

  if (tx) {
    return await execute(tx);
  } else {
    return await prisma.$transaction(async (t) => {
      return await execute(t);
    });
  }
};

/**
 * Get an expense by ID.
 */
const getExpenseById = async (id) => {
  return await prisma.expense.findUnique({
    where: { id },
    include: {
      payer: {
        select: { id: true, name: true, email: true }
      },
      group: {
        select: { id: true, name: true }
      },
      participants: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    }
  });
};

/**
 * Get all expenses.
 */
const getAllExpenses = async () => {
  return await prisma.expense.findMany({
    include: {
      payer: {
        select: { id: true, name: true, email: true }
      },
      group: {
        select: { id: true, name: true }
      },
      participants: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
};

/**
 * Get all expenses in a group.
 */
const getExpensesByGroupId = async (groupId) => {
  return await prisma.expense.findMany({
    where: { groupId },
    include: {
      payer: {
        select: { id: true, name: true, email: true }
      },
      participants: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    },
    orderBy: { expenseDate: "desc" }
  });
};

/**
 * Update an expense.
 */
const updateExpense = async (id, data) => {
  const { title, description, amount, currency, splitType, expenseDate, payerId, groupId, participants } = data;

  // Validate the inputs
  if (!title || !amount || !currency || !splitType || !expenseDate || !payerId || !groupId || !participants) {
    throw new Error("Missing required fields for updating an expense.");
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error("Amount must be a positive number greater than 0.");
  }

  if (!Array.isArray(participants) || participants.length === 0) {
    throw new Error("At least one participant is required.");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Verify expense exists
    const existingExpense = await tx.expense.findUnique({ where: { id } });
    if (!existingExpense) {
      throw new Error("The specified expense does not exist.");
    }

    // 2. Verify group exists
    const groupExists = await tx.group.findUnique({ where: { id: groupId } });
    if (!groupExists) {
      throw new Error("The specified group does not exist.");
    }

    // 3. Validate membership timelines (payer and participants must be active on the expenseDate)
    await validateGroupMemberships(tx, groupId, payerId, participants, expenseDate);

    // 4. Compute shares based on split type
    let participantShares = [];
    const upperSplitType = splitType.toUpperCase();

    if (upperSplitType === "EQUAL") {
      participantShares = calculateEqualSplit(numericAmount, participants);
    } else if (upperSplitType === "EXACT") {
      participantShares = calculateExactSplit(numericAmount, participants);
    } else if (upperSplitType === "PERCENTAGE") {
      participantShares = calculatePercentageSplit(numericAmount, participants);
    } else if (upperSplitType === "SHARES") {
      participantShares = calculateSharesSplit(numericAmount, participants);
    } else {
      throw new Error(`Unsupported split type: ${splitType}`);
    }

    // 5. Update main Expense record
    await tx.expense.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        amount: numericAmount,
        currency: currency.toUpperCase().trim(),
        splitType: upperSplitType,
        expenseDate: new Date(expenseDate),
        payerId,
        groupId
      }
    });

    // 6. Delete old ExpenseParticipants
    await tx.expenseParticipant.deleteMany({
      where: { expenseId: id }
    });

    // 7. Insert new ExpenseParticipants
    await tx.expenseParticipant.createMany({
      data: participantShares.map(share => ({
        expenseId: id,
        userId: share.userId,
        shareAmount: share.shareAmount
      }))
    });

    // Return updated details
    return await tx.expense.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });
  });
};

/**
 * Delete an expense.
 */
const deleteExpense = async (id) => {
  return await prisma.$transaction(async (tx) => {
    const existingExpense = await tx.expense.findUnique({ where: { id } });
    if (!existingExpense) {
      throw new Error("The specified expense does not exist.");
    }

    // 1. Delete associated ExpenseParticipant records
    await tx.expenseParticipant.deleteMany({
      where: { expenseId: id }
    });

    // 2. Delete main Expense record
    await tx.expense.delete({
      where: { id }
    });

    return { success: true, message: "Expense deleted successfully." };
  });
};

module.exports = {
  createExpense,
  getExpenseById,
  getAllExpenses,
  getExpensesByGroupId,
  updateExpense,
  deleteExpense
};
