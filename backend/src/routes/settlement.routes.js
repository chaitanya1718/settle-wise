const express = require("express");
const router = express.Router();
const settlementController = require("../controllers/settlement.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Protect all routes with authentication middleware
router.use(authMiddleware);

// Settlement Routes
router.post("/", settlementController.createSettlement);
router.get("/", settlementController.getAllSettlements);

module.exports = router;
