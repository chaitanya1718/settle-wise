const express = require("express");
const router = express.Router();
const importReviewController = require("../controllers/importReview.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Protect all routes with auth middleware
router.use(authMiddleware);

// Review Workflow routes
router.get("/import/jobs", importReviewController.getImportJobs);
router.get("/import/jobs/:jobId", importReviewController.getImportJobById);
router.patch("/import/anomalies/:id/approve", importReviewController.approveAnomaly);
router.patch("/import/anomalies/:id/reject", importReviewController.rejectAnomaly);
router.post("/import/jobs/:jobId/execute", importReviewController.executeImportJob);

module.exports = router;
