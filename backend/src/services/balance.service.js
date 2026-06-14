const prisma = require("../config/prisma");

/**
 * Calculate balances for all members of a group.
 * netBalance = (paid) - (owed) + (settlementsSent) - (settlementsReceived)
 */
const getGroupBalances = async (groupId) => {
  // Validate group exists
  const group = await prisma.group.findUnique({
    where: { id: groupId }
  });
  if (!group) {
    const error = new Error("Group not found.");
    error.statusCode = 404;
    throw error;
  }

  // Get group expenses
  const expenses = await prisma.expense.findMany({
    where: { groupId }
  });

  // Get group memberships (active and historic)
  const memberships = await prisma.groupMembership.findMany({
    where: { groupId },
    include: { user: true }
  });
  const memberIds = memberships.map(m => m.userId);

  // Get settlements where both payer and receiver are members of the group
  const settlements = await prisma.settlement.findMany({
    where: {
      payerId: { in: memberIds },
      receiverId: { in: memberIds }
    }
  });

  // Check currencies used in group expenses and settlements
  const currencies = [...new Set([
    ...expenses.map(e => e.currency),
    ...settlements.map(s => s.currency)
  ])];

  if (currencies.length > 1) {
    const error = new Error("Mixed currencies detected. Currency normalization required before balance calculation.");
    error.isMixedCurrencies = true;
    error.statusCode = 400;
    throw error;
  }

  // Fetch all participant shares for expenses in this group
  const shares = await prisma.expenseParticipant.findMany({
    where: {
      userId: { in: memberIds },
      expense: { groupId }
    }
  });

  // Initialize mapping for all members
  const balances = {};
  memberships.forEach(m => {
    balances[m.userId] = {
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      paid: 0,
      owed: 0,
      settlementsSent: 0,
      settlementsReceived: 0,
      net: 0
    };
  });

  // Accumulate paid expenses
  expenses.forEach(e => {
    if (balances[e.payerId]) {
      balances[e.payerId].paid += parseFloat(e.amount.toString());
    }
  });

  // Accumulate owed shares
  shares.forEach(s => {
    if (balances[s.userId]) {
      balances[s.userId].owed += parseFloat(s.shareAmount.toString());
    }
  });

  // Accumulate settlements sent/received
  settlements.forEach(s => {
    const amount = parseFloat(s.amount.toString());
    if (balances[s.payerId]) {
      balances[s.payerId].settlementsSent += amount;
    }
    if (balances[s.receiverId]) {
      balances[s.receiverId].settlementsReceived += amount;
    }
  });

  // Compute net balance and round to 2 decimals
  const members = Object.values(balances).map(m => {
    const net = m.paid - m.owed + m.settlementsSent - m.settlementsReceived;
    return {
      userId: m.userId,
      name: m.name,
      email: m.email,
      paid: Math.round(m.paid * 100) / 100,
      owed: Math.round(m.owed * 100) / 100,
      settlementsSent: Math.round(m.settlementsSent * 100) / 100,
      settlementsReceived: Math.round(m.settlementsReceived * 100) / 100,
      net: Math.round(net * 100) / 100
    };
  });

  return { members };
};

/**
 * Greedy debt simplification algorithm.
 * Generates minimal debtor -> creditor transfers.
 */
const getGroupSettlements = async (groupId) => {
  const { members } = await getGroupBalances(groupId);

  // Filter into debtors and creditors
  const debtors = members
    .filter(m => m.net < -0.005)
    .map(m => ({ ...m }));
  const creditors = members
    .filter(m => m.net > 0.005)
    .map(m => ({ ...m }));

  // Sort debtors ascending (most negative first)
  debtors.sort((a, b) => a.net - b.net);
  // Sort creditors descending (most positive first)
  creditors.sort((a, b) => b.net - a.net);

  const transfers = [];

  while (debtors.length > 0 && creditors.length > 0) {
    const debtor = debtors[0];
    const creditor = creditors[0];

    const amount = Math.min(-debtor.net, creditor.net);
    const roundedAmount = Math.round(amount * 100) / 100;

    if (roundedAmount > 0) {
      transfers.push({
        from: debtor.userId,
        fromName: debtor.name,
        to: creditor.userId,
        toName: creditor.name,
        amount: roundedAmount
      });
    }

    debtor.net += roundedAmount;
    creditor.net -= roundedAmount;

    // Remove if settled, else re-sort
    if (Math.abs(debtor.net) < 0.005) {
      debtors.shift();
    } else {
      debtors.sort((a, b) => a.net - b.net);
    }

    if (Math.abs(creditor.net) < 0.005) {
      creditors.shift();
    } else {
      creditors.sort((a, b) => b.net - a.net);
    }
  }

  return transfers;
};

/**
 * Retrieve user's expense and settlement breakdown.
 * Traces exactly why a balance exists.
 */
const getUserBalanceBreakdown = async (userId) => {
  // Validate user exists
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  // Fetch expenses paid by user
  const paidExpensesRaw = await prisma.expense.findMany({
    where: { payerId: userId },
    include: {
      group: { select: { name: true } }
    }
  });

  // Fetch participant shares owed by user
  const sharesRaw = await prisma.expenseParticipant.findMany({
    where: { userId },
    include: {
      expense: {
        include: {
          payer: { select: { name: true } },
          group: { select: { name: true } }
        }
      }
    }
  });

  // Fetch settlements sent/received by user
  const settlementsSentRaw = await prisma.settlement.findMany({
    where: { payerId: userId }
  });

  const settlementsReceivedRaw = await prisma.settlement.findMany({
    where: { receiverId: userId }
  });

  // Format paid expenses list
  const paidExpenses = paidExpensesRaw.map(e => ({
    id: e.id,
    title: e.title,
    description: e.description,
    amount: parseFloat(e.amount.toString()),
    currency: e.currency,
    groupName: e.group.name,
    expenseDate: e.expenseDate
  }));

  // Format owed shares list
  const participantExpenses = sharesRaw.map(s => ({
    id: s.id,
    expenseId: s.expenseId,
    title: s.expense.title,
    shareAmount: parseFloat(s.shareAmount.toString()),
    currency: s.expense.currency,
    payerName: s.expense.payer.name,
    groupName: s.expense.group.name,
    expenseDate: s.expense.expenseDate
  }));

  // Extract all currencies involved to perform safety checks
  const currencies = [...new Set([
    ...paidExpenses.map(e => e.currency),
    ...participantExpenses.map(s => s.currency),
    ...settlementsSentRaw.map(s => s.currency),
    ...settlementsReceivedRaw.map(s => s.currency)
  ])];

  if (currencies.length > 1) {
    const error = new Error("Mixed currencies detected. Currency normalization required before balance calculation.");
    error.isMixedCurrencies = true;
    error.statusCode = 400;
    throw error;
  }

  // Sum up balances (since we verified single currency or empty)
  let totalPaid = 0;
  let totalOwed = 0;
  let settlementsSent = 0;
  let settlementsReceived = 0;

  paidExpenses.forEach(e => { totalPaid += e.amount; });
  participantExpenses.forEach(s => { totalOwed += s.shareAmount; });
  settlementsSentRaw.forEach(s => { settlementsSent += parseFloat(s.amount.toString()); });
  settlementsReceivedRaw.forEach(s => { settlementsReceived += parseFloat(s.amount.toString()); });

  const netBalance = totalPaid - totalOwed + settlementsSent - settlementsReceived;

  return {
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalOwed: Math.round(totalOwed * 100) / 100,
    settlementsSent: Math.round(settlementsSent * 100) / 100,
    settlementsReceived: Math.round(settlementsReceived * 100) / 100,
    netBalance: Math.round(netBalance * 100) / 100,
    paidExpenses,
    participantExpenses
  };
};

module.exports = {
  getGroupBalances,
  getGroupSettlements,
  getUserBalanceBreakdown
};
