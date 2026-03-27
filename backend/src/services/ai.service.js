const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Generate Summary and Tags using Gemini 1.5 Flash
const generateSummaryAndTags = async (text, saveReason, userNote) => {
  if (!text || text.length < 50)
    return { summary: "Too short to summarize.", tags: [] };

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        responseMimeType: "application/json", // This forces Gemini to output clean JSON!
      },
    });

    const userContext = `
    The user explicitly saved this document for the following reason: "${saveReason || "General Reference"}".
    ${userNote ? `The user also left this specific note: "${userNote}".` : ""}
    
    CRITICAL INSTRUCTION: Tailor your summary to focus heavily on the user's reason and note. Extract the key points that are most relevant to their specific goal.
  `;

    const prompt = `
      You are an expert research assistant. 
   
    
      Analyze the following text and user context. 
      1. Provide a 2-sentence summary.
      2. Provide exactly 15 to 20 highly specific relevant tags/keywords. I am going to use these tax and keywords for showing the edges in the graph so make it clear and consistent
      Respond strictly with a JSON object using this exact schema: { "summary": "string", "tags": ["string", "string"] }
      
      Text: ${text}

      user context:${userContext}
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

const generateImageSummaryAndTags = async (base64Image, mimeType) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
      Look at this image. 
      1. Extract any readable text from it.
      2. Provide a 2-sentence summary of what the image shows or means.
      3. Provide exactly 15 to 20 highly specific relevant tags/keywords.
      Respond strictly with a JSON object using this exact schema: { "summary": "string", "tags": ["string", "string"] }
    `;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    // Pass BOTH the text prompt and the image part to Gemini
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    return JSON.parse(responseText);
  } catch (error) {
    console.error("[Gemini AI] Vision Error:", error.message);
    return { summary: "Failed to analyze image.", tags: ["image-error"] };
  }
};

module.exports = {
  generateSummaryAndTags,
  generateEmbedding,
  generateImageSummaryAndTags,
};
