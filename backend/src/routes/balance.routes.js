const express = require("express");
const router = express.Router();
const balanceController = require("../controllers/balance.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Protect all routes with authentication middleware
router.use(authMiddleware);

// Balance and Settlement Simplification Routes
router.get("/groups/:groupId/balances", balanceController.getGroupBalances);
router.get("/groups/:groupId/settlements", balanceController.getGroupSettlements);
router.get("/users/:userId/balance-breakdown", balanceController.getUserBalanceBreakdown);

module.exports = router;
