const mongoose = require("mongoose");
const SavedItem = require("../models/savedItems");

// Older versions made `url` unique across ALL users, so a second user saving
// the same link silently got the first user's item. That index is replaced by
// a per-user { userId, url } index (defined in the model). Safe to run every
// startup: it does nothing once the old index is gone.
const migrateSavedItemIndexes = async () => {
  try {
    await SavedItem.collection.dropIndex("url_1");
    console.log("🛠️  Dropped legacy global unique index url_1");
  } catch (error) {
    // 27 = IndexNotFound; 26 = NamespaceNotFound (collection doesn't exist yet)
    if (error.code !== 27 && error.code !== 26) throw error;
  }
  await SavedItem.createIndexes();
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`🟢 MongoDB Connected: ${conn.connection.host}`);
    await migrateSavedItemIndexes();
  } catch (error) {
    console.error(`🔴 Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
