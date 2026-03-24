// src/services/scraper.service.js
const axios = require("axios");
const cheerio = require("cheerio");

const scrapeWebpage = async (url) => {
  try {
    // 1. Fetch the raw HTML of the page
    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (AI Second Brain Bot)" }, // Prevents some blocks
    });

    // 2. Load it into Cheerio to parse it
    const $ = cheerio.load(response.data);

    // 3. Extract the title
    const title = $("title").text() || "No Title Found";

    // 4. Extract paragraphs and clean up the text
    let content = "";
    $("p, h1, h2, h3").each((i, element) => {
      content += $(element).text() + "\n";
    });

    // 5. Trim the content if it's massively long (to save AI API costs)
    const trimmedContent = content.substring(0, 5000);

    return { title, content: trimmedContent };
  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error.message);
    return { title: "Unknown Title", content: "Could not extract content." };
  }
};

module.exports = { scrapeWebpage };
