// src/workers/save.worker.js
const { Worker } = require("bullmq");
const { connection } = require("../queues/save.queue");
const { processAndSaveUrl } = require("../services/save.service");

// This worker listens to 'save-url-queue'
const saveWorker = new Worker(
  "save-url-queue",
  async (job) => {
    console.log(`[Worker] Picked up job ${job.id} for URL: ${job.data.url}`);

    // Call the Mongoose service we wrote in Phase 1
    await processAndSaveUrl(job.data.url);

    console.log(`[Worker] Successfully processed job ${job.id}`);
  },
  { connection },
);

saveWorker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job.id} failed with error: ${err.message}`);
});

module.exports = saveWorker;
