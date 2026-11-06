// Re-runs saved web items through the save pipeline and updates them in place
// (same id, links, note, save reason and date). Use it to repair items that
// were saved without real content.
//
//   npm run reprocess                         # items that look broken
//   npm run reprocess -- --url dribbble.com   # items whose URL contains this text
//   npm run reprocess -- --dry                # list what would be reprocessed
//
// In Docker:  docker compose exec app npm run reprocess

require("dotenv").config();
const mongoose = require("mongoose");
const SavedItem = require("../src/models/savedItems");
const { analyzeUrl } = require("../src/services/save.service");

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const urlIndex = args.indexOf("--url");
const urlFilter = urlIndex >= 0 ? args[urlIndex + 1] : null;

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// What a broken item looks like (saved before the pipeline refused empty pages)
const BROKEN = {
  $or: [
    { summary: { $in: ["Too short to summarize.", "Failed to generate summary.", "Failed to analyze image."] } },
    { title: { $in: ["", "Unknown Title"] } },
    { tags: { $in: ["error", "image-error"] } },
    { embedding: { $size: 0 } },
  ],
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const filter = {
    url: urlFilter ? new RegExp(escapeRegex(urlFilter), "i") : /^https?:\/\//i,
    ...(urlFilter ? {} : BROKEN),
  };
  const items = await SavedItem.find(filter).select("url title saveReason userNote").lean();
  console.log(`${items.length} item(s) to reprocess${DRY ? " (dry run)" : ""}`);

  let fixed = 0;
  for (const item of items) {
    console.log(`\n→ ${item.url}`);
    if (DRY) continue;
    try {
      const fields = await analyzeUrl(item.url, item.saveReason, item.userNote);
      await SavedItem.updateOne({ _id: item._id }, { $set: fields });
      fixed++;
      console.log(`  ✅ "${fields.title}" — ${fields.itemType}, ${fields.category}`);
      console.log(`     ${fields.summary}`);
    } catch (error) {
      console.log(`  ❌ ${error.message}`);
    }
  }

  if (!DRY) console.log(`\nRepaired ${fixed}/${items.length}.`);
  await mongoose.disconnect();
  // the scraper/queue modules can keep handles open
  process.exit(0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
