// Gives existing saved items a topic category (items saved from now on get one
// automatically). Asks Gemini in batches; falls back to tag keywords.
//
//   npm run backfill:categories            # only items without a category
//   npm run backfill:categories -- --all   # re-categorise everything
//   npm run backfill:categories -- --dry   # show what would change, write nothing
//
// In Docker:  docker compose exec app npm run backfill:categories

require("dotenv").config();
const mongoose = require("mongoose");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const SavedItem = require("../src/models/savedItems");
const {
  CATEGORY_IDS,
  CATEGORY_PROMPT_LIST,
  normalizeCategory,
} = require("../src/constants/categories");

const BATCH = 8;
const args = new Set(process.argv.slice(2));
const ALL = args.has("--all");
const DRY = args.has("--dry");

async function classifyWithGemini(model, items) {
  // Short numeric ids: the model mixes up long ObjectIds far more often.
  const list = items
    .map((it, n) =>
      JSON.stringify({
        id: String(n + 1),
        title: it.title,
        summary: (it.summary || "").slice(0, 300),
        tags: (it.tags || []).slice(0, 10),
      }),
    )
    .join("\n");

  const prompt = `
Assign each saved item exactly ONE category id from this list:
${CATEGORY_PROMPT_LIST}

Items (one JSON object per line):
${list}

Judge each item only by its own title, summary and tags.
Respond strictly with a JSON object mapping each item id to its category id, e.g. {"1": "tech", "2": "news"}.`;

  const result = await model.generateContent(prompt);
  const byNumber = JSON.parse(result.response.text());
  // map "1", "2", ... back to the real ids
  return Object.fromEntries(
    items.map((it, n) => [String(it._id), byNumber[String(n + 1)]]),
  );
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const filter = ALL ? {} : { category: { $exists: false } };
  const items = await SavedItem.find(filter)
    .select("_id title summary tags category")
    .lean();
  console.log(`${items.length} item(s) to categorise${DRY ? " (dry run)" : ""}`);

  const model = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        generationConfig: { responseMimeType: "application/json" },
      })
    : null;

  const tally = {};
  let viaAi = 0;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    let answers = {};
    if (model) {
      try {
        answers = await classifyWithGemini(model, batch);
      } catch (error) {
        console.warn(`Gemini failed for batch ${i / BATCH + 1}, using keywords:`, error.message);
      }
    }

    for (const item of batch) {
      const ai = answers[String(item._id)];
      const category = normalizeCategory(ai, item);
      if (CATEGORY_IDS.includes(ai) && ai === category) viaAi++;
      tally[category] = (tally[category] || 0) + 1;
      console.log(`  ${category.padEnd(13)} ${item.title}`);
      if (!DRY) {
        await SavedItem.updateOne({ _id: item._id }, { $set: { category } });
      }
    }
  }

  console.log("\nSummary:", tally);
  console.log(`${viaAi}/${items.length} chosen by Gemini, the rest by keywords.`);
  await mongoose.disconnect();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
