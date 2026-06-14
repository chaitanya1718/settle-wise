const express = require("express");
const router = express.Router();
const groupController = require("../controllers/group.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Apply authentication middleware to all group management routes
router.use(authMiddleware);

// Group Routing
router.post("/", groupController.createGroup);
router.get("/:id", groupController.getGroup);
router.post("/:id/members", groupController.addMember);
router.patch("/:id/members/:membershipId/leave", groupController.removeMember);

module.exports = router;
