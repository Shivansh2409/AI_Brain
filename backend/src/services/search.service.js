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
  const results = await SavedItem.aggregate(
    [
      {
        $vectorSearch: {
          index: "vector_index", // The name of the index we just made in Atlas
          path: "embedding", // The field in our schema holding the arrays
          queryVector: queryVector,
          numCandidates: 50, // How many items to analyze
          limit: 5, // How many top results to return
        },
      },
      {
        // 3. Clean up the output so we don't send massive arrays to the frontend
        $project: {
          _id: 1,
          title: 1,
          url: 1,
          summary: 1,
          tags: 1,
          itemType: 1,
          score: { $meta: "vectorSearchScore" }, // Shows us how confident the AI is (0 to 1)
        },
      },
    ],
    { userId: userId },
  ); // 4. Filter results to only include items from the logged-in user

  return results;
};

module.exports = { semanticSearch };
