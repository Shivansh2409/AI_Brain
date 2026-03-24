const { saveUrlQueue } = require("../queues/save.queue");

const saveItemController = async (req, res) => {
  try {
    console.log("ha");
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Push to the BullMQ queue
    await saveUrlQueue.add("process-url", { url });

    // 202 Accepted means "Request received and is processing in background"
    return res.status(202).json({
      message: "URL added to the processing queue",
    });
  } catch (error) {
    console.error("Error queuing item:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { saveItemController };
