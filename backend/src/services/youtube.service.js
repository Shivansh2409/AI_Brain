const axios = require("axios");

// Notice we removed the require('youtube-transcript') from the top!

const scrapeYouTube = async (url) => {
  console.log(`[YouTube Service] Extracting video data for: ${url}`);

  let title = "Unknown YouTube Video";
  let content = "";

  try {
    // 1. Get the Video Title instantly using YouTube's official oEmbed API
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const oembedRes = await axios.get(oembedUrl);
    title = oembedRes.data.title;

    // 2. DYNAMIC IMPORT: This bridges the gap between CommonJS and ES Modules!
    const { YoutubeTranscript } = await import("youtube-transcript");

    // 3. Fetch the transcript (Closed Captions)
    const transcriptArray = await YoutubeTranscript.fetchTranscript(url);

    // Combine all the spoken text blocks into one massive paragraph
    content = transcriptArray.map((line) => line.text).join(" ");

    // 4. Trim it to fit inside Gemini's context window safely
    const trimmedContent = content.substring(0, 15000);

    return { title, content: trimmedContent };
  } catch (error) {
    console.error(
      `[YouTube Service] Failed to extract transcript:`,
      error.message,
    );
    // Fallback if the video has subtitles disabled
    return {
      title,
      content:
        "Could not extract transcript. The creator may have disabled closed captions for this video.",
    };
  }
};

module.exports = { scrapeYouTube };
