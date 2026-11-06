const axios = require("axios");

// 1. Process PDFs

// 2. Process Images (Prepare them for Gemini)
const fetchImageForGemini = async (url) => {
  console.log(`[Media Service] Downloading Image: ${url}`);
  try {
    // Download the image as a buffer
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 20000,
      maxContentLength: 15 * 1024 * 1024, // Gemini inline images must stay small
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AIBrain/1.0)" },
    });

    // Gemini needs a real image mime type (e.g. image/jpeg)
    const mimeType = String(response.headers["content-type"] || "").split(";")[0].trim();
    if (!mimeType.startsWith("image/")) {
      throw new Error(`not an image (content-type: ${mimeType || "none"})`);
    }

    // Gemini requires the image to be converted into a Base64 string
    const base64Image = Buffer.from(response.data, "binary").toString("base64");

    // Use the file name only if it looks like one (CDN/proxy URLs are often
    // random ids like "aG9uZS5wbmc"); otherwise "Image from example.com".
    const { hostname, pathname } = new URL(url);
    const lastSegment = decodeURIComponent(pathname.split("/").pop() || "");
    const looksLikeFileName = /^[\w\s().,-]{2,80}\.(jpe?g|png|gif|webp|avif|svg|bmp)$/i.test(lastSegment);
    const title = looksLikeFileName
      ? lastSegment
      : `Image from ${hostname.replace(/^www\./, "")}`;

    return { title, base64Image, mimeType };
  } catch (error) {
    console.error(`[Media Service] Image Error:`, error.message);
    throw new Error("Failed to download image");
  }
};

module.exports = { fetchImageForGemini };
