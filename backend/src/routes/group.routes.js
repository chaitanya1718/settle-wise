const express = require("express");
const router = express.Router();
const groupController = require("../controllers/group.controller");
const expenseController = require("../controllers/expense.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Apply authentication middleware to all group management routes
router.use(authMiddleware);

// Group Routing
router.post("/", groupController.createGroup);
router.get("/", groupController.getGroups);
router.get("/:id", groupController.getGroup);
router.get("/:id/dashboard", groupController.getGroupDashboard);
router.post("/:id/members", groupController.addMember);
router.patch("/:id/members/:membershipId/leave", groupController.removeMember);

// Group Expense Routing
router.get("/:groupId/expenses", expenseController.getExpensesByGroup);

module.exports = router;
