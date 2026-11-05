const express = require("express");
const {
  getFeedController,
  getFeedCountsController,
} = require("../controllers/feed.controller");
const requireAuth = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/feed", requireAuth, getFeedController);
router.get("/feed/counts", requireAuth, getFeedCountsController);

module.exports = router;
