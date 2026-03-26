const axios = require("axios");

const scrapeYouTube = async (url) => {
  console.log(`[YouTube Service] Extracting video data for: ${url}`);
  let title = "Unknown YouTube Video";
  let description = "";

  try {
    console.log(
      `[YouTube Service] Downloading raw YouTube HTML to find description...`,
    );

    // 1. Fetch the raw HTML exactly like a Chrome browser
    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    // 2. Extract the Title
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    if (titleMatch) title = titleMatch[1].replace(" - YouTube", "");

    // 3. Extract the Description
    // YouTube stores the full description in a hidden JSON object called "shortDescription"
    const jsonDescMatch = html.match(/"shortDescription":"(.*?)"/);

    if (jsonDescMatch && jsonDescMatch[1]) {
      // Clean up the weird formatting (like \n for newlines) YouTube adds to the code
      description = jsonDescMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
    } else {
      // Fallback: Grab the shorter meta description if the main one fails
      const metaDescMatch = html.match(
        /<meta name="description" content="(.*?)">/,
      );
      if (metaDescMatch) description = metaDescMatch[1];
    }

    console.log(`[YouTube Service] ✅ Success! Title: "${title}"`);
    console.log(
      `[YouTube Service] ✅ Success! Found a ${description.length} character description.`,
    );

    // 4. Send the context to Gemini with strict rules
    const content = `
      This is a YouTube video link. I was unable to download the spoken transcript. 
      However, I have the exact title and the creator's written description of the video.
      
      Title: "${title}"
      Description: "${description}"
      
      Please write a highly accurate 2-to-3 sentence summary of what this video is about based ONLY on the title and description provided. Do not invent or guess details outside of this context.
    `;

    return { title, content };
  } catch (error) {
    console.error(`[YouTube Service] Failed to extract data:`, error.message);
    return {
      title: "Unknown YouTube Video",
      content: "Could not extract data. The video might be private or deleted.",
    };
  }
};

module.exports = { scrapeYouTube };
