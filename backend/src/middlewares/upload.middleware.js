const multer = require("multer");
const fs = require("fs");
const path = require("path");

// 1. Ensure the temporary 'uploads' directory exists on your server
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Configure Multer to save files to the hard drive safely
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Tell multer where to save the file
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Add a unique timestamp so if two users upload "document.pdf", they don't overwrite each other!
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

// 3. Create the actual middleware instance
const uploadMiddleware = multer({ storage: storage });

module.exports = uploadMiddleware;
