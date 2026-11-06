const fs = require("fs").promises; // ✅ RIGHT: This allows async/await!
const { PDFParse } = require("pdf-parse");
const SavedItem = require("../models/savedItems");
const { normalizeCategory } = require("../constants/categories");
const { scrapeWebpage } = require("./scraper.service");
const { scrapeYouTube } = require("./youtube.service");
const { fetchImageForGemini } = require("./media.service"); // <-- Import new service
const {
  generateSummaryAndTags,
  generateEmbedding,
  generateImageSummaryAndTags,
} = require("./ai.service");

// Sites where the "content" is a picture (design shots, pins, photos). For
// these, Gemini Vision looks at the page's preview image instead of reading
// the page text, which is mostly menus and buttons.
const VISUAL_SITES =
  /(^|\.)(dribbble\.com|behance\.net|pinterest\.[a-z.]+|pin\.it|artstation\.com|deviantart\.com|unsplash\.com|pexels\.com|instagram\.com|mobbin\.com|awwwards\.com)$/i;

const AI_FAILED = "The AI couldn't summarise this item";

/** A readable fallback title from the URL, e.g. "Ai Brain Logo Futuristic". */
function titleFromUrl(url) {
  try {
    const { hostname, pathname } = new URL(url);
    const slug = decodeURIComponent(pathname.split("/").filter(Boolean).pop() || "")
      .replace(/^\d+-/, "") // dribbble-style "27844289-name"
      .replace(/\.[a-z0-9]{2,5}$/i, "")
      .replace(/[-_+]+/g, " ")
      .trim();
    return slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : hostname;
  } catch {
    return url;
  }
}

/**
 * Works out what a URL is and asks Gemini about it. Returns every field a
 * saved item needs except the user-specific ones. Throws on failure so the
 * BullMQ job is retried instead of saving an empty item.
 */
const analyzeUrl = async (url, saveReason, userNote) => {
  // 1. DETECT CONTENT TYPE BY URL
  const lowerUrl = url.toLowerCase();
  const isYouTube =
    lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be");

  const isImage =
    // Check A: Does it have a standard extension? (Handles regular URLs like .png?v=123)
    /\.(jpeg|jpg|gif|png|webp|avif|svg|bmp)(\?.*|#.*)?$/i.test(lowerUrl) ||
    // Check B: Is it coming from a known Image Proxy / CDN? (Handles your Brave URL)
    /imgs\.search\.brave\.com|images\.unsplash\.com|source\.unsplash\.com|i\.imgur\.com/i.test(
      lowerUrl,
    ) ||
    // Check C: Does the URL path explicitly say it is an image API?
    /\/image\/|\/img\//i.test(lowerUrl);

  let title, content, itemType, aiData;

  // 2. ROUTE AND PROCESS
  if (isYouTube) {
    const ytData = await scrapeYouTube(url);
    title = ytData.title;
    content = ytData.content;
    itemType = "youtube";
    aiData = await generateSummaryAndTags(content, saveReason, userNote);
  } else if (isImage) {
    console.log(`[Pipeline] Detected Image. Activating Gemini Vision...`);
    const imgData = await fetchImageForGemini(url);
    title = imgData.title;
    content = "Image saved directly. See summary.";
    itemType = "image";
    aiData = await generateImageSummaryAndTags(
      imgData.base64Image,
      imgData.mimeType,
      saveReason,
      userNote,
    );
  } else {
    // Web page (throws if the page was empty / blocked / needs a login)
    const web = await scrapeWebpage(url);
    title = web.title || titleFromUrl(url);

    const host = new URL(url).hostname;
    const looksVisual =
      web.image && (VISUAL_SITES.test(host) || web.content.trim().length < 150);

    if (looksVisual) {
      try {
        console.log(`[Pipeline] Visual page — analysing its preview image with Gemini Vision...`);
        const imgData = await fetchImageForGemini(web.image);
        aiData = await generateImageSummaryAndTags(
          imgData.base64Image,
          imgData.mimeType,
          saveReason,
          userNote,
          { title: web.title, description: web.description },
        );
        itemType = "image";
        content = [web.title, web.description].filter(Boolean).join("\n\n");
      } catch (error) {
        console.log(`[Pipeline] Couldn't use the preview image (${error.message}); using page text.`);
      }
    }

    if (!aiData || aiData.failed) {
      itemType = "article";
      // The meta description is often the best one-line summary of a page
      content = [web.description, web.content].filter(Boolean).join("\n\n");
      aiData = await generateSummaryAndTags(content, saveReason, userNote);
    }
  }

  if (aiData?.failed) throw new Error(AI_FAILED);
  const summary = aiData.summary;
  const tags = Array.isArray(aiData.tags) ? aiData.tags : [];
  title = (title || "").trim() || titleFromUrl(url);

  // 3. GENERATE EMBEDDING (Same for all types!)
  console.log(`[Pipeline] Generating Vector Embedding...`);
  const embedding = await generateEmbedding(`${summary} ${title}`);
  if (!embedding?.length) throw new Error("Couldn't create the search embedding");

  return {
    title,
    content,
    summary,
    tags,
    embedding,
    itemType,
    category: normalizeCategory(aiData.category, { tags, title }),
  };
};

const processAndSaveUrl = async (url, saveReason, userNote, userId) => {
  console.log(`[Pipeline] Starting process for: ${url}`);

  // Dedupe per user: another user having saved this URL doesn't count.
  const existingItem = await SavedItem.findOne({ url, userId });
  if (existingItem) return existingItem;

  const fields = await analyzeUrl(url, saveReason, userNote);
  const newItem = await SavedItem.create({
    url,
    ...fields,
    saveReason,
    userNote,
    userId,
  });

  console.log(`[Pipeline] ✅ Success! Item saved as: ${fields.itemType}`);
  return newItem;
};

const processAndSaveFile = async (
  filePath,
  originalName,
  mimetype,
  saveReason,
  userNote,
  url,
  userId,
) => {
  console.log(
    `[Save Service] Starting AI processing for local file: ${originalName}`,
  );
  // Dedupe per user (the upload controller always provides a url)
  const existingItem = await SavedItem.findOne({ url, userId });
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
      try {
        const textResult = await parser.getText();

        // Extract and trim the text to ensure it fits safely inside Gemini's context window
        content = textResult.text.substring(0, 15000);
      } finally {
        // CRITICAL: Prevent memory leaks by destroying the V2 parser, even on a bad PDF
        await parser.destroy();
      }
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
    if (aiData.failed) throw new Error(AI_FAILED);

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
      category: normalizeCategory(aiData.category, {
        tags: aiData.tags,
        title: originalName,
      }),
      saveReason: saveReason || "General Reference",
      userNote: userNote || "",
      userId: userId,
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

module.exports = { analyzeUrl, processAndSaveUrl, processAndSaveFile };
