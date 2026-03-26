// src/controllers/link.controller.js
const SavedItem = require("../models/savedItems");

const manuallyLinkItems = async (req, res) => {
  try {
    const { sourceId, targetId } = req.body;

    if (!sourceId || !targetId || sourceId === targetId) {
      return res.status(400).json({ error: "Invalid item IDs provided." });
    }

    // 1. Update the Source Item to include the Target
    await SavedItem.findByIdAndUpdate(sourceId, {
      $addToSet: { linkedItems: targetId }, // $addToSet prevents duplicate links
    });

    // 2. Update the Target Item to include the Source
    await SavedItem.findByIdAndUpdate(targetId, {
      $addToSet: { linkedItems: sourceId },
    });

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
    const { sourceId, targetId } = req.body;

    if (!sourceId || !targetId || sourceId === targetId) {
      return res.status(400).json({ error: "Invalid item IDs provided." });
    }

    // 1. $pull removes the targetId from the source's linkedItems array
    await SavedItem.findByIdAndUpdate(sourceId, {
      $pull: { linkedItems: targetId },
    });

    // 2. Do the exact same thing in reverse for the target item
    await SavedItem.findByIdAndUpdate(targetId, {
      $pull: { linkedItems: sourceId },
    });

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
