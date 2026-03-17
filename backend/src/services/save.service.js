// src/services/save.service.js
const SavedItem = require("../models/savedItems");

const processAndSaveUrl = async (url) => {
  // 1. Check if the item already exists
  const existingItem = await SavedItem.findOne({ url });

  if (existingItem) {
    return { item: existingItem, isNew: false };
  }

  // 2. Create a new entry in MongoDB
  // In Phase 3, this is where we will trigger the AI scraping
  const newItem = await SavedItem.create({
    url: url,
  });

  return { item: newItem, isNew: true };
};

module.exports = { processAndSaveUrl };
