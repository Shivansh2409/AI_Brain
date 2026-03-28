const { Worker } = require("bullmq");
const fs = require("fs").promises; // Added to handle deleting the temp file
const { connection } = require("../queues/save.queue");

// Import your URL service and your new File service
const {
  processAndSaveUrl,
  processAndSaveFile,
} = require("../services/save.service");

// This worker listens to 'save-url-queue'
const saveWorker = new Worker(
  "save-url-queue",
  async (job) => {
    const {
      type,
      filePath,
      originalName,
      mimetype,
      saveReason,
      userNote,
      url,
    } = job.data;

    // ==========================================
    // BRANCH A: LOCAL FILE UPLOAD
    // ==========================================
    if (type === "file") {
      console.log(`[Worker] Picked up job ${job.id} for FILE: ${originalName}`);

      try {
        // Hand the file off to your service layer for AI processing
        await processAndSaveFile(
          filePath,
          originalName,
          mimetype,
          saveReason,
          userNote,
          url,
        );
        console.log(`[Worker] Successfully processed file job ${job.id}`);
      } finally {
        // CRITICAL SAFETY NET: Always delete the temp file off the hard drive,
        // even if the AI crashes or succeeds!
        if (filePath) {
          try {
            await fs.unlink(filePath);
            console.log(`[Worker] Cleaned up temporary file: ${filePath}`);
          } catch (cleanupErr) {
            console.error(
              `[Worker] Warning - Could not delete temp file: ${cleanupErr.message}`,
            );
          }
        }
      }
    }
    // ==========================================
    // BRANCH B: STANDARD WEB URL
    // ==========================================
    else {
      console.log(`[Worker] Picked up job ${job.id} for URL: ${url}`);

      // Call the Mongoose service we wrote in Phase 1
      await processAndSaveUrl(url, saveReason, userNote);

      console.log(`[Worker] Successfully processed URL job ${job.id}`);
    }
  },
  { connection },
);

saveWorker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job.id} failed with error: ${err.message}`);
});

module.exports = saveWorker;
