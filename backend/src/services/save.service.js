// src/services/save.service.js
const SavedItem = require("../models/savedItems");
const { scrapeWebpage } = require("./scraper.service");
const { generateSummaryAndTags, generateEmbedding } = require("./ai.service");

const processAndSaveUrl = async (url) => {
  console.log(`[Pipeline] Starting process for: ${url}`);

  // 1. Check if it already exists
  const existingItem = await SavedItem.findOne({ url });
  if (existingItem) {
    console.log(`[Pipeline] Item already exists. Skipping.`);
    return existingItem;
  }

  // 2. Scrape the website
  console.log(`[Pipeline] Scraping website...`);
  const { title, content } = await scrapeWebpage(url);

  // 3. Get AI Summary and Tags
  console.log(`[Pipeline] Generating AI summary and tags...`);
  const { summary, tags } = await generateSummaryAndTags(content);

  // 4. Generate Vector Embedding (We embed the summary, not the whole article, for better search results)
  console.log(`[Pipeline] Generating Vector Embedding...`);
  const embedding = await generateEmbedding(summary + " " + title);

  // 5. Save everything to MongoDB
  console.log(`[Pipeline] Saving to MongoDB...`);
  const newItem = await SavedItem.create({
    url,
    title,
    content,
    summary,
    tags,
    embedding,
    itemType: "article",
  });

  console.log(`[Pipeline] ✅ Success! Item saved with ID: ${newItem._id}`);
  return newItem;
};

module.exports = { processAndSaveUrl };
