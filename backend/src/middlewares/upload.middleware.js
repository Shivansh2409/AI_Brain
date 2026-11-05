const multer = require("multer");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const MAX_UPLOAD_MB = 25;

// 1. Ensure the temporary 'uploads' directory exists on your server
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Configure Multer to save files to the hard drive safely
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Never put the client's file name in the path (it could contain "../"):
    // use a random name. The original name is kept in req.file.originalname.
    cb(null, `${Date.now()}-${crypto.randomUUID()}.pdf`);
  },
});

// Only PDFs are processed by the worker, so reject anything else up front.
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") return cb(null, true);
  const error = new Error("Only PDF files can be uploaded.");
  error.status = 415;
  cb(error);
};

// 3. Create the actual middleware instance
const uploader = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
});

// Wraps multer so its errors come back as JSON with a sensible status
// instead of Express's default HTML 500 page.
const uploadSingle = (fieldName) => (req, res, next) => {
  uploader.single(fieldName)(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? `File is too large (max ${MAX_UPLOAD_MB} MB).`
          : error.message;
      return res.status(status).json({ error: message });
    }
    return res
      .status(error.status || 400)
      .json({ error: error.message || "Upload failed" });
  });
};

module.exports = { uploadSingle, MAX_UPLOAD_MB };
