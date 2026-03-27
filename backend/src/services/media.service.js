const axios = require("axios");
const { PDFParse } = require("pdf-parse");
const puppeteer = require("puppeteer");

// 1. Process PDFs

// 2. Process Images (Prepare them for Gemini)
const fetchImageForGemini = async (url) => {
  console.log(`[Media Service] Downloading Image: ${url}`);
  try {
    // Download the image as a buffer
    const response = await axios.get(url, { responseType: "arraybuffer" });

    // Gemini requires the image to be converted into a Base64 string
    const base64Image = Buffer.from(response.data, "binary").toString("base64");

    // Get the mime type (e.g., image/jpeg or image/png)
    const mimeType = response.headers["content-type"];
    const title = url.split("/").pop() || "Saved Image";

    return { title, base64Image, mimeType };
  } catch (error) {
    console.error(`[Media Service] Image Error:`, error.message);
    throw new Error("Failed to download image");
  }
};

module.exports = { fetchImageForGemini };
