const SavedItem = require("../models/savedItems");

const getFeedController = async (req, res) => {
  try {
    const { type } = req.query; // 1. Check if the frontend asked for a specific type

    // 2. Build the query. If there is a type, filter by it. Otherwise, get everything.
    const query = type && type !== "all" ? { itemType: type } : {};

    const feedItems = await SavedItem.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .select("-embedding");

    return res.status(200).json(feedItems);
  } catch (error) {
    console.error("Error fetching feed:", error);
    return res
      .status(500)
      .json({ error: "Internal server error fetching feed" });
  }
};

module.exports = { getFeedController };
