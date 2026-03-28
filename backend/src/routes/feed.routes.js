const express = require("express");
const { getFeedController } = require("../controllers/feed.controller");
const requireAuth = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/feed", requireAuth, getFeedController);

module.exports = router;
