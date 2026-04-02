const SavedItem = require("../models/savedItems");
const { generateEmbedding } = require("./ai.service");

const semanticSearch = async (userQuery, userId) => {
  console.log(`[Search] Embedding user query: "${userQuery}"`);

  // 1. Turn the user's search text into a vector using Gemini
  const queryVector = await generateEmbedding(userQuery);

  if (!queryVector || queryVector.length === 0) {
    throw new Error("Failed to generate embedding for query");
  }

  console.log(`[Search] Query embedded. Searching MongoDB...`);

  // 2. Use MongoDB's $vectorSearch aggregation to find the closest matches
  const results = await SavedItem.aggregate([
    {
      $match: {
        userId: userId, // Filter by userId first
      },
    },
    {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding",
        queryVector: queryVector,
        numCandidates: 50,
        limit: 5,
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        url: 1,
        summary: 1,
        tags: 1,
        itemType: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  return results;
};

module.exports = { semanticSearch };
