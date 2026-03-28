const fs = require("fs").promises; // ✅ RIGHT: This allows async/await!
const { PDFParse } = require("pdf-parse");
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

const processAndSaveFile = async (
  filePath,
  originalName,
  mimetype,
  saveReason,
  userNote,
  url,
) => {
  console.log(
    `[Save Service] Starting AI processing for local file: ${originalName}`,
  );
  const existingItem = await SavedItem.findOne({ url });
  if (existingItem) return existingItem;
  let content = "";
  let itemType = "file";

  try {
    // 1. Validate File Type
    if (mimetype === "application/pdf") {
      itemType = "pdf";

      // Read the file off the local hard drive into a Node Buffer
      const fileBuffer = await fs.readFile(filePath);

      // Parse it using the V2 pdf-parse class
      const parser = new PDFParse({ data: fileBuffer });
      const textResult = await parser.getText();

      // Extract and trim the text to ensure it fits safely inside Gemini's context window
      content = textResult.text.substring(0, 15000);

      // CRITICAL: Prevent memory leaks by destroying the V2 parser
      await parser.destroy();
    } else {
      throw new Error(
        `Unsupported file type: ${mimetype}. Only PDFs are currently supported.`,
      );
    }

    if (!content.trim()) {
      throw new Error("PDF parsing succeeded, but no readable text was found.");
    }

    console.log(
      `[Save Service] File parsed successfully. Generating AI Summary...`,
    );

    // 2. Pass the parsed text and the user's opinions directly into Gemini
    const aiData = await generateSummaryAndTags(content, saveReason, userNote);

    console.log(`[Save Service] Generating Vector Embeddings...`);

    // 3. Turn the summary into mathematical vectors for semantic search
    const embedding = await generateEmbedding(aiData.summary);

    console.log(`[Save Service] Saving to MongoDB...`);

    // 4. Save the fully processed item to your Second Brain database
    const newItem = new SavedItem({
      url: url, // Give it a pseudo-URL so the frontend renders it nicely
      title: originalName,
      content: content,
      summary: aiData.summary,
      tags: aiData.tags,
      embedding: embedding,
      itemType: itemType,
      saveReason: saveReason || "General Reference",
      userNote: userNote || "",
    });

    await newItem.save();
    console.log(
      `[Save Service] ✅ Success! "${originalName}" is now in your Second Brain.`,
    );

    return newItem;
  } catch (error) {
    console.error(
      `[Save Service] Error processing file ${originalName}:`,
      error.message,
    );
    throw error; // Throw the error so the BullMQ Worker knows it failed!
  }
};

module.exports = { processAndSaveUrl, processAndSaveFile };
