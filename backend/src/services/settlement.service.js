const prisma = require("../config/prisma");

/**
 * Record a new settlement.
 * 
 * Body:
 * {
 *   "payerId": "...",
 *   "receiverId": "...",
 *   "amount": 500,
 *   "currency": "INR"
 * }
 */
const createSettlement = async (data, tx) => {
  const client = tx || prisma;
  const { payerId, receiverId, amount, currency } = data;

  if (!payerId || !receiverId || !amount || !currency) {
    throw new Error("Missing required fields for recording a settlement.");
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error("Settlement amount must be a positive number greater than 0.");
  }

  // Verify users exist
  const payerExists = await client.user.findUnique({ where: { id: payerId } });
  if (!payerExists) {
    const error = new Error("Payer user not found.");
    error.statusCode = 404;
    throw error;
  }

  const receiverExists = await client.user.findUnique({ where: { id: receiverId } });
  if (!receiverExists) {
    const error = new Error("Receiver user not found.");
    error.statusCode = 404;
    throw error;
  }

  // Create settlement record
  return await client.settlement.create({
    data: {
      payerId,
      receiverId,
      amount: numericAmount,
      currency: currency.toUpperCase().trim(),
      status: "COMPLETED" // Set default status to COMPLETED as required
    },
    include: {
      payer: {
        select: { id: true, name: true, email: true }
      },
      receiver: {
        select: { id: true, name: true, email: true }
      }
    }
  });
};

/**
 * Retrieve all settlements.
 */
const getAllSettlements = async () => {
  return await prisma.settlement.findMany({
    include: {
      payer: {
        select: { id: true, name: true, email: true }
      },
      receiver: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
};

module.exports = {
  createSettlement,
  getAllSettlements
};
