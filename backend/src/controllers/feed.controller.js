const SavedItem = require("../models/savedItems");

const getFeedController = async (req, res) => {
  try {
    // Fetch the 50 newest items
    const feedItems = await SavedItem.find()
      .sort({ createdAt: -1 }) // -1 sorts by newest first
      .limit(50)
      .select("-embedding"); // CRITICAL: Exclude the massive vector array to keep the API blazing fast

    return res.status(200).json(feedItems);
  } catch (error) {
    console.error("Error fetching feed:", error);
    return res
      .status(500)
      .json({ error: "Internal server error fetching feed" });
  }
};

module.exports = { getFeedController };
