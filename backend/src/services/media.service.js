const axios = require("axios");
const pdfParse = require("pdf-parse");

// 1. Process PDFs
const scrapePdf = async (url) => {
  console.log(`[Media Service] Downloading PDF: ${url}`);
  try {
    // Download the file into computer memory as a raw buffer
    const response = await axios.get(url, { responseType: "arraybuffer" });

    // Parse the PDF buffer into readable text
    const data = await pdfParse(response.data);

    // Some PDFs have metadata titles, otherwise fallback
    const title =
      data.info?.Title || url.split("/").pop() || "Saved PDF Document";
    const content = data.text.trim();

    // Trim to fit Gemini's context window safely
    return { title, content: content.substring(0, 15000) };
  } catch (error) {
    console.error(`[Media Service] PDF Error:`, error.message);
    return {
      title: "Unknown PDF",
      content: "Failed to extract text from PDF.",
    };
  }
};

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

module.exports = { scrapePdf, fetchImageForGemini };
