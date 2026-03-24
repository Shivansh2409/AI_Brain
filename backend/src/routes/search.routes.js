// src/routes/search.routes.js
const express = require("express");
const { searchItemsController } = require("../controllers/search.controller");

const router = express.Router();

router.get("/search", searchItemsController);

module.exports = router;
