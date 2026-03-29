const { semanticSearch } = require("../services/search.service");

const searchItemsController = async (req, res) => {
  try {
    const { q } = req.query; // e.g., /api/search?q=crypto

    if (!q) {
      return res.status(400).json({ error: "Search query (q) is required" });
    }

    const results = await semanticSearch(q, req.user.id); // Pass the logged-in user's ID to only search their items

    return res.status(200).json({
      message: "Search successful",
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error("Error during search:", error);
    return res
      .status(500)
      .json({ error: "Internal server error during search" });
  }
};

module.exports = { searchItemsController };
