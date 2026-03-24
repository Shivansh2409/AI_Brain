const mongoose = require("mongoose");

const savedItemSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      default: "Pending Title...",
    },
    content: {
      type: String, // The scraped raw text
    },
    summary: {
      type: String, // The AI-generated summary
    },
    tags: {
      type: [String], // Array of AI-generated tags
      default: [],
    },
    itemType: {
      type: String,
      enum: ["article", "tweet", "youtube", "pdf", "image", "unknown"],
      default: "unknown",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // Perfect for flexible, unstructured data
      default: {},
    },
    embedding: {
      type: [Number], // This stores the vector array (e.g., [0.012, -0.045, ...])
      default: [],
    },
  },
  { timestamps: true }, // Automatically adds createdAt and updatedAt
);

module.exports = mongoose.model("SavedItem", savedItemSchema);
