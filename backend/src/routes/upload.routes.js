const express = require("express");
const router = express.Router();

// Import your custom middleware and controller
const uploadMiddleware = require("../middlewares/upload.middleware");
const requireAuth = require("../middlewares/auth.middleware");
const { handleFileUpload } = require("../controllers/upload.controller");

// Route: POST /api/upload
// Flow:
// 1. Request hits route.
// 2. requireAuth checks JWT token
// 3. uploadMiddleware.single('file') intercepts it, saves the PDF, and creates req.file.
// 4. handleFileUpload takes over and sends the req.file data to BullMQ.
router.post(
  "/upload",
  requireAuth,
  uploadMiddleware.single("file"),
  handleFileUpload,
);

module.exports = router;
