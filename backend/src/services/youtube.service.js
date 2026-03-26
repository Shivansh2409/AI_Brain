// src/services/youtube.service.js
const axios = require("axios");
const { getSubtitles } = require("youtube-captions-scraper");

// Helper function to extract the 11-character Video ID
function extractVideoID(url) {
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

const scrapeYouTube = async (url) => {
  console.log(`[YouTube Service] Extracting video data for: ${url}`);

  let title = "Unknown YouTube Video";

  try {
    // 1. Get the Video Title
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const oembedRes = await axios.get(oembedUrl);
    title = oembedRes.data.title;

    // 2. Extract the Video ID
    const videoId = extractVideoID(url);
    if (!videoId) {
      throw new Error("Could not extract Video ID from URL");
    }

    // 3. Language Fallback Array (Finds English, Hindi, or Auto-generated)
    const languagesToTry = ["en", "hi", "en-IN", "a.en"];
    let captions = null;

    for (const lang of languagesToTry) {
      try {
        captions = await getSubtitles({ videoID: videoId, lang: lang });
        console.log(
          `[YouTube Service] ✅ Success! Found captions in language: ${lang}`,
        );
        break; // Stop looking once we find a valid track
      } catch (err) {
        // Silently fail and try the next language
      }
    }

    if (!captions) {
      throw new Error("No readable captions found in tested languages.");
    }

    // Combine all the spoken text blocks
    const content = captions.map((caption) => caption.text).join(" ");

    // 4. Trim it to fit inside Gemini's context window safely
    const trimmedContent = content.substring(0, 15000);

    return { title, content: trimmedContent };
  } catch (error) {
    console.error(
      `[YouTube Service] Failed to extract transcript:`,
      error.message,
    );
    return {
      title,
      content:
        "Could not extract transcript. The creator disabled captions, or the language is unsupported.",
    };
  }
};

module.exports = { scrapeYouTube };
