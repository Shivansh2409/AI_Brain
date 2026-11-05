const { Queue } = require("bullmq");

// Uses REDIS_URL when set (e.g. redis://redis:6379 inside Docker),
// otherwise falls back to local Redis.
const redisUrl = new URL(process.env.REDIS_URL || "redis://127.0.0.1:6379");
const connection = {
  host: redisUrl.hostname || "127.0.0.1",
  port: Number(redisUrl.port) || 6379,
  ...(redisUrl.password && { password: decodeURIComponent(redisUrl.password) }),
  ...(redisUrl.username && { username: decodeURIComponent(redisUrl.username) }),
};

const saveUrlQueue = new Queue("save-url-queue", { connection });

module.exports = { saveUrlQueue, connection };
