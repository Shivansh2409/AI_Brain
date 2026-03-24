const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Generate Summary and Tags using Gemini 1.5 Flash
const generateSummaryAndTags = async (text) => {
  if (!text || text.length < 50)
    return { summary: "Too short to summarize.", tags: [] };

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json", // This forces Gemini to output clean JSON!
      },
    });

    const prompt = `
      Analyze the following text. 
      1. Provide a 2-sentence summary.
      2. Provide exactly 3 to 5 relevant tags/keywords.
      Respond strictly with a JSON object using this exact schema: { "summary": "string", "tags": ["string", "string"] }
      
      Text: ${text}
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return JSON.parse(responseText);
  } catch (error) {
    console.error("[Gemini AI] Summarization Error:", error.message);
    return { summary: "Failed to generate summary.", tags: ["error"] };
  }
};

// 2. Turn the summary into a Vector Embedding for Semantic Search later
const generateEmbedding = async (text) => {
  try {
    // text-embedding-004 is Google's optimized embedding model
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

    const result = await model.embedContent(text);

    // Gemini returns the array of numbers inside result.embedding.values
    return result.embedding.values;
  } catch (error) {
    console.error("[Gemini AI] Embedding Error:", error.message);
    return [];
  }
};

module.exports = { generateSummaryAndTags, generateEmbedding };
