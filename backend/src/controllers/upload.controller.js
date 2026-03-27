// src/controllers/upload.controller.js
const { PDFParse } = require("pdf-parse");
const SavedItem = require("../models/savedItems");
// Note: Adjust these imports based on where your AI services actually live!
const {
  generateSummaryAndTags,
  generateEmbedding,
} = require("../services/ai.service");

const handleFileUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    console.log(
      `[Upload Service] Processing uploaded file: ${req.file.originalname}`,
    );
    let title = req.file.originalname;
    let content = "";
    let itemType = "file";

    // Handle PDFs directly in memory!
    if (req.file.mimetype === "application/pdf") {
      itemType = "pdf";
      const parser = new PDFParse({ data: req.file.buffer });
      const textResult = await parser.getText();
      content = textResult.text.substring(0, 30000); // Trim for Gemini
      await parser.destroy();
    } else {
      return res
        .status(400)
        .json({ error: "Only PDFs are supported right now!" });
    }

    console.log(`[Upload Service] Generating AI Summary and Embeddings...`);

    // 1. Ask Gemini for the summary and tags
    const aiData = await generateSummaryAndTags(
      content,
      req.body.saveReason,
      req.body.userNote,
    );

    // 2. Turn the summary into a Vector
    const embedding = await generateEmbedding(aiData.summary);

    // 3. Save to MongoDB
    const newItem = new SavedItem({
      url: req.body.url, // Fake URL for local files
      title: title,
      content: content,
      summary: aiData.summary,
      tags: aiData.tags,
      embedding: embedding,
      itemType: itemType,
      saveReason: req.body.saveReason,
      userNote: req.body.userNote,
    });

    await newItem.save();
    console.log(
      `[Upload Service] ✅ Success! Saved local file to Second Brain.`,
    );

    return res.status(200).json({ success: true, item: newItem });
  } catch (error) {
    console.error("[Upload Service] Error:", error);
    return res.status(500).json({ error: "Failed to process file" });
  }
};

module.exports = { handleFileUpload };
