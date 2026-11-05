// src/controllers/link.controller.js
const mongoose = require("mongoose");
const SavedItem = require("../models/savedItems");

// Validates both IDs and checks that the logged-in user owns both items.
// Returns an error response object, or null when the request is OK.
const checkLinkRequest = async (req) => {
  const { sourceId, targetId } = req.body;
  const isId = (id) =>
    typeof id === "string" && mongoose.Types.ObjectId.isValid(id);

  if (!isId(sourceId) || !isId(targetId) || sourceId === targetId) {
    return { status: 400, error: "Invalid item IDs provided." };
  }

  const owned = await SavedItem.countDocuments({
    _id: { $in: [sourceId, targetId] },
    userId: req.user.id,
  });
  if (owned !== 2) {
    return { status: 404, error: "Item not found." };
  }
  return null;
};

const manuallyLinkItems = async (req, res) => {
  try {
    const problem = await checkLinkRequest(req);
    if (problem) {
      return res.status(problem.status).json({ error: problem.error });
    }
    const { sourceId, targetId } = req.body;

    // $addToSet prevents duplicate links; update both sides of the link
    await SavedItem.updateOne(
      { _id: sourceId, userId: req.user.id },
      { $addToSet: { linkedItems: targetId } },
    );
    await SavedItem.updateOne(
      { _id: targetId, userId: req.user.id },
      { $addToSet: { linkedItems: sourceId } },
    );

    console.log(`[Linker] 🔗 Manually linked ${sourceId} to ${targetId}`);
    return res
      .status(200)
      .json({ success: true, message: "Items linked successfully!" });
  } catch (error) {
    console.error("[Linker] Error:", error);
    return res.status(500).json({ error: "Failed to link items" });
  }
};

const manuallyUnlinkItems = async (req, res) => {
  try {
    const problem = await checkLinkRequest(req);
    if (problem) {
      return res.status(problem.status).json({ error: problem.error });
    }
    const { sourceId, targetId } = req.body;

    // $pull removes the link from both sides
    await SavedItem.updateOne(
      { _id: sourceId, userId: req.user.id },
      { $pull: { linkedItems: targetId } },
    );
    await SavedItem.updateOne(
      { _id: targetId, userId: req.user.id },
      { $pull: { linkedItems: sourceId } },
    );

    console.log(`[Linker] ✂️ Manually unlinked ${sourceId} from ${targetId}`);
    return res
      .status(200)
      .json({ success: true, message: "Items unlinked successfully!" });
  } catch (error) {
    console.error("[Linker] Error:", error);
    return res.status(500).json({ error: "Failed to unlink items" });
  }
};

module.exports = { manuallyLinkItems, manuallyUnlinkItems };
