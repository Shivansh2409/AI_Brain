const SavedItem = require("../models/savedItems");
const { scrapeWebpage } = require("./scraper.service");
const { scrapeYouTube } = require("./youtube.service");
const { fetchImageForGemini } = require("./media.service"); // <-- Import new service
const {
  generateSummaryAndTags,
  generateEmbedding,
  generateImageSummaryAndTags,
} = require("./ai.service");

const processAndSaveUrl = async (url, saveReason, userNote) => {
  console.log(`[Pipeline] Starting process for: ${url}`);

  const existingItem = await SavedItem.findOne({ url });
  if (existingItem) return existingItem;

  // 1. DETECT CONTENT TYPE BY URL EXTENSION
  const lowerUrl = url.toLowerCase();
  const isYouTube =
    lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be");
  const isPdf = lowerUrl.endsWith(".pdf");
  const isImage =
    lowerUrl.endsWith(".png") ||
    lowerUrl.endsWith(".jpg") ||
    lowerUrl.endsWith(".jpeg") ||
    lowerUrl.endsWith(".webp");

  let title, content, itemType;
  let summary, tags;

  // 2. ROUTE AND PROCESS
  if (isYouTube) {
    const ytData = await scrapeYouTube(url);
    title = ytData.title;
    content = ytData.content;
    itemType = "youtube";
    const aiData = await generateSummaryAndTags(content, saveReason, userNote);
    summary = aiData.summary;
    tags = aiData.tags;
  } else if (isImage) {
    console.log(`[Pipeline] Detected Image. Activating Gemini Vision...`);
    const imgData = await fetchImageForGemini(url);
    title = imgData.title;
    content = "Image saved directly. See summary.";
    itemType = "image";
    // Use the special Image AI function!
    const aiData = await generateImageSummaryAndTags(
      imgData.base64Image,
      imgData.mimeType,
      saveReason,
      userNote,
    );
    summary = aiData.summary;
    tags = aiData.tags;
  } else {
    // Default to standard webpage
    const webData = await scrapeWebpage(url);
    title = webData.title;
    content = webData.content;
    itemType = "article";
    const aiData = await generateSummaryAndTags(content, saveReason, userNote);
    summary = aiData.summary;
    tags = aiData.tags;
  }

  // 3. GENERATE EMBEDDING & SAVE (Same for all types!)
  console.log(`[Pipeline] Generating Vector Embedding...`);
  const embedding = await generateEmbedding(summary + " " + title);

  const newItem = await SavedItem.create({
    url,
    title,
    content,
    summary,
    tags,
    embedding,
    itemType,
    saveReason,
    userNote,
  });

  console.log(`[Pipeline] ✅ Success! Item saved as: ${itemType}`);
  return newItem;
};

module.exports = { processAndSaveUrl };
