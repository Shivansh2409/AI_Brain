const SavedItem = require("../models/savedItems");
const { scrapeWebpage } = require("./scraper.service");
const { scrapeYouTube } = require("./youtube.service"); // <--- 1. Import the new service
const { generateSummaryAndTags, generateEmbedding } = require("./ai.service");

const processAndSaveUrl = async (url) => {
  console.log(`[Pipeline] Starting process for: ${url}`);

  const existingItem = await SavedItem.findOne({ url });
  if (existingItem) {
    console.log(`[Pipeline] Item already exists. Skipping.`);
    return existingItem;
  }

  // 2. DETECT THE CONTENT TYPE
  const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
  let title, content, itemType;

  // 3. ROUTE TO THE CORRECT SCRAPER
  if (isYouTube) {
    console.log(`[Pipeline] Detected YouTube URL. Bypassing Puppeteer...`);
    const ytData = await scrapeYouTube(url);
    title = ytData.title;
    content = ytData.content;
    itemType = "youtube"; // Tag it as a video in the database
  } else {
    console.log(`[Pipeline] Detected standard webpage. Launching Puppeteer...`);
    const webData = await scrapeWebpage(url);
    title = webData.title;
    content = webData.content;
    itemType = "article";
  }

  // 4. Send to Gemini (The AI doesn't care if it's reading an article or a video transcript!)
  console.log(`[Pipeline] Generating AI summary and tags...`);
  const { summary, tags } = await generateSummaryAndTags(content);

  console.log(`[Pipeline] Generating Vector Embedding...`);
  const embedding = await generateEmbedding(summary + " " + title);

  console.log(`[Pipeline] Saving to MongoDB...`);
  const newItem = await SavedItem.create({
    url,
    title,
    content,
    summary,
    tags,
    embedding,
    itemType, // Saves as 'youtube' or 'article' dynamically
  });

  console.log(`[Pipeline] ✅ Success! Item saved with ID: ${newItem._id}`);
  return newItem;
};

module.exports = { processAndSaveUrl };
