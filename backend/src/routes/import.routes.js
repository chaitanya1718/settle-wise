const express = require("express");
const router = express.Router();
const multer = require("multer");
const importController = require("../controllers/import.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Configure multer to write files temporarily to the uploads folder
const upload = multer({ dest: "uploads/" });

// Protect all routes with auth middleware
router.use(authMiddleware);

// Route for CSV import analysis
router.post("/", upload.single("file"), importController.processImport);

module.exports = router;
