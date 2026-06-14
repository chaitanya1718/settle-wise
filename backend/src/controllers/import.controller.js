const importService = require("../services/import.service");
const fs = require("fs");

/**
 * Handle CSV File upload and run anomaly check.
 * POST /api/import
 */
const processImport = async (req, res) => {
  try {
    const { groupId } = req.body;
    
    if (!groupId) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        error: "Group ID (groupId) is required in the body."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "CSV file upload is required."
      });
    }

    // Call import service to parse and analyze CSV
    const report = await importService.processImport(
      req.file.path,
      req.file.originalname,
      groupId
    );

    // Clean up temp file
    try {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (err) {
      console.error("Failed to delete temp CSV file:", err.message);
    }

    return res.status(200).json(report);
  } catch (error) {
    // Clean up temp file in case of failure
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error("Failed to delete temp file in error catch:", err.message);
      }
    }

    console.error("Import controller error:", error.message);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message
    });
  }
};

module.exports = {
  processImport
};
