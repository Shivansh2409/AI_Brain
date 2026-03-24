const { Queue } = require("bullmq");

// Connect to default local Redis. In production, use process.env.REDIS_URL
const connection = {
  host: "127.0.0.1",
  port: 6379,
};

const saveUrlQueue = new Queue("save-url-queue", { connection });

module.exports = { saveUrlQueue, connection };
