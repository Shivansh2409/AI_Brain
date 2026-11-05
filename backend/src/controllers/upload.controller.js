// backend/src/controllers/upload.controller.js
const { saveUrlQueue } = require("../queues/save.queue");

const handleFileUpload = async (req, res) => {
  try {
    // 1. Check if a file was actually uploaded by Multer
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { saveReason, userNote } = req.body;

    // The item's title comes from the client's file name; keep it to a sane length.
    const originalName =
      String(req.file.originalname || "document.pdf").slice(0, 200) ||
      "document.pdf";

    // url is required on saved items and used to dedupe; give direct uploads
    // (no source page) a unique placeholder instead of leaving it empty.
    const url =
      typeof req.body.url === "string" && req.body.url.trim()
        ? req.body.url.trim()
        : `upload://${req.file.filename}`;

    // Push to the BullMQ queue
    await saveUrlQueue.add(
      "process-file",
      {
        type: "file", // We pass this flag so the worker knows to use the File logic
        filePath: req.file.path,
        originalName,
        mimetype: req.file.mimetype,
        saveReason: saveReason || "General Reference",
        userNote: userNote || "",
        url,
        userId: req.user.id, // Pass the logged-in user's ID so the worker can associate the file with the correct user
      },
      {
        attempts: 3, // Automatically retry 3 times if parsing or Gemini fails!
        backoff: { type: "exponential", delay: 5000 }, // Wait 5s, 10s, 20s between retries
      },
    );

    // 202 Accepted means "Request received and is processing in background"
    return res.status(202).json({
      message: "File added to the processing queue",
    });
  } catch (error) {
    console.error("Error queuing file:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { handleFileUpload };
