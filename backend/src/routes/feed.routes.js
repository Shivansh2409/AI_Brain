// src/routes/feed.routes.js
const express = require("express");
const { getFeedController } = require("../controllers/feed.controller");

const router = express.Router();

router.get("/feed", getFeedController);

module.exports = router;
