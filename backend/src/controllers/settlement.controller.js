const settlementService = require("../services/settlement.service");

/**
 * Record a new settlement.
 * POST /api/settlements
 */
const createSettlement = async (req, res) => {
  try {
    const settlement = await settlementService.createSettlement(req.body);
    return res.status(201).json({
      message: "Settlement recorded successfully.",
      settlement
    });
  } catch (error) {
    console.error("Create settlement controller error:", error.message);
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({
      error: error.message
    });
  }
};

/**
 * Get all settlements.
 * GET /api/settlements
 */
const getAllSettlements = async (req, res) => {
  try {
    const settlements = await settlementService.getAllSettlements();
    return res.status(200).json(settlements);
  } catch (error) {
    console.error("Get all settlements controller error:", error.message);
    return res.status(500).json({
      error: "Internal server error."
    });
  }
};

module.exports = {
  createSettlement,
  getAllSettlements
};
