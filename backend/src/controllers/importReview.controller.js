const importReviewService = require("../services/importReview.service");

/**
 * Get all import jobs.
 * GET /api/import/jobs
 */
const getImportJobs = async (req, res) => {
  try {
    const jobs = await importReviewService.getImportJobs();
    return res.status(200).json(jobs);
  } catch (error) {
    console.error("Get import jobs controller error:", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * Get details of a single import job and its anomalies.
 * GET /api/import/jobs/:jobId
 */
const getImportJobById = async (req, res) => {
  try {
    const { jobId } = req.params;
    const details = await importReviewService.getImportJobById(jobId);
    return res.status(200).json(details);
  } catch (error) {
    console.error("Get import job details controller error:", error.message);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Approve a specific anomaly.
 * PATCH /api/import/anomalies/:id/approve
 */
const approveAnomaly = async (req, res) => {
  try {
    const { id } = req.params;
    const anomaly = await importReviewService.approveAnomaly(id);
    return res.status(200).json(anomaly);
  } catch (error) {
    console.error("Approve anomaly controller error:", error.message);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Reject a specific anomaly.
 * PATCH /api/import/anomalies/:id/reject
 */
const rejectAnomaly = async (req, res) => {
  try {
    const { id } = req.params;
    const anomaly = await importReviewService.rejectAnomaly(id);
    return res.status(200).json(anomaly);
  } catch (error) {
    console.error("Reject anomaly controller error:", error.message);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Execute import job.
 * POST /api/import/jobs/:jobId/execute
 */
const executeImportJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { groupId } = req.body;

    if (!groupId) {
      return res.status(400).json({
        error: "groupId is required in request body to execute import."
      });
    }

    const result = await importReviewService.executeImportJob(jobId, groupId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Execute import job controller error:", error.message);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message });
  }
};

module.exports = {
  getImportJobs,
  getImportJobById,
  approveAnomaly,
  rejectAnomaly,
  executeImportJob
};
