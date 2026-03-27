const express = require("express");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() }); // Keep the file in RAM, not on the hard drive
const { handleFileUpload } = require("../controllers/upload.controller");

const router = express.Router();

// Add this route!
router.post("/upload", upload.single("file"), handleFileUpload);

module.exports = router;
