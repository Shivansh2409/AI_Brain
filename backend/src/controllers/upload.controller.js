// backend/src/controllers/upload.controller.js
const { saveUrlQueue } = require("../queues/save.queue");

const handleFileUpload = async (req, res) => {
  try {
    // 1. Check if a file was actually uploaded by Multer
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { saveReason, userNote, url } = req.body;

    // Push to the BullMQ queue
    await saveUrlQueue.add(
      "process-file",
      {
        type: "file", // We pass this flag so the worker knows to use the File logic
        filePath: req.file.path,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        saveReason: saveReason || "General Reference",
        userNote: userNote || "",
        url: url,
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
