const mongoose = require("mongoose");
const SavedItem = require("../models/savedItems");
const { CATEGORIES, CATEGORY_IDS } = require("../constants/categories");

const ITEM_TYPES = ["article", "tweet", "youtube", "pdf", "image", "unknown"];

// Only accept a known single value; anything else (missing, "all", arrays,
// unknown ids) means "no filter".
const pick = (value, allowed) =>
  typeof value === "string" && allowed.includes(value) ? value : null;

const getFeedController = async (req, res) => {
  try {
    // 1. Optional filters: ?type=article&category=tech
    const type = pick(req.query.type, ITEM_TYPES);
    const category = pick(req.query.category, CATEGORY_IDS);

    // 2. Always limited to the logged-in user's items
    const query = { userId: req.user.id };
    if (type) query.itemType = type;
    if (category) query.category = category;

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

// GET /api/feed/counts -> how many items the user has per category and per type
const getFeedCountsController = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const [result] = await SavedItem.aggregate([
      { $match: { userId } },
      {
        $facet: {
          categories: [{ $group: { _id: "$category", count: { $sum: 1 } } }],
          types: [{ $group: { _id: "$itemType", count: { $sum: 1 } } }],
          total: [{ $count: "n" }],
        },
      },
    ]);

    const byCategory = Object.fromEntries(
      result.categories.map((c) => [c._id || "other", c.count]),
    );
    return res.status(200).json({
      total: result.total[0]?.n ?? 0,
      categories: CATEGORIES.map((c) => ({
        id: c.id,
        label: c.label,
        count: byCategory[c.id] ?? 0,
      })),
      types: Object.fromEntries(result.types.map((t) => [t._id, t.count])),
    });
  } catch (error) {
    console.error("Error counting feed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getFeedController, getFeedCountsController };
