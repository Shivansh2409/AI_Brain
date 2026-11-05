const express = require("express");
const router = express.Router();

// Import your custom middleware and controller
const { uploadSingle } = require("../middlewares/upload.middleware");
const requireAuth = require("../middlewares/auth.middleware");
const { handleFileUpload } = require("../controllers/upload.controller");

// Route: POST /api/upload
// Flow:
// 1. Request hits route.
// 2. requireAuth checks JWT token
// 3. uploadSingle('file') checks it's a PDF under the size limit, saves it, and creates req.file.
// 4. handleFileUpload takes over and sends the req.file data to BullMQ.
router.post(
  "/upload",
  requireAuth,
  uploadSingle("file"),
  handleFileUpload,
);

module.exports = router;
