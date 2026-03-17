// src/controllers/save.controller.js
const { processAndSaveUrl } = require("../services/save.service");

const saveItemController = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const result = await processAndSaveUrl(url);

    return res.status(result.isNew ? 201 : 200).json({
      message: result.isNew ? "Item saved successfully" : "Item already exists",
      data: result.item,
    });
  } catch (error) {
    console.error("Error in saveItemController:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { saveItemController };
