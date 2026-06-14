const balanceService = require("../services/balance.service");

/**
 * Get balances of all members in a group.
 * GET /api/groups/:groupId/balances
 */
const getGroupBalances = async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!groupId) {
      return res.status(400).json({ error: "Group ID is required." });
    }
    const balances = await balanceService.getGroupBalances(groupId);
    return res.status(200).json(balances);
  } catch (error) {
    console.error("Get group balances controller error:", error.message);
    const statusCode = error.statusCode || 500;
    
    if (error.isMixedCurrencies) {
      return res.status(statusCode).json({ message: error.message });
    }
    
    return res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Get simplified settlements for a group.
 * GET /api/groups/:groupId/settlements
 */
const getGroupSettlements = async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!groupId) {
      return res.status(400).json({ error: "Group ID is required." });
    }
    const settlements = await balanceService.getGroupSettlements(groupId);
    return res.status(200).json(settlements);
  } catch (error) {
    console.error("Get group settlements controller error:", error.message);
    const statusCode = error.statusCode || 500;
    
    if (error.isMixedCurrencies) {
      return res.status(statusCode).json({ message: error.message });
    }
    
    return res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Get personal balance breakdown for a user.
 * GET /api/users/:userId/balance-breakdown
 */
const getUserBalanceBreakdown = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }
    const breakdown = await balanceService.getUserBalanceBreakdown(userId);
    return res.status(200).json(breakdown);
  } catch (error) {
    console.error("Get user balance breakdown controller error:", error.message);
    const statusCode = error.statusCode || 500;
    
    if (error.isMixedCurrencies) {
      return res.status(statusCode).json({ message: error.message });
    }
    
    return res.status(statusCode).json({ error: error.message });
  }
};

module.exports = {
  getGroupBalances,
  getGroupSettlements,
  getUserBalanceBreakdown
};
