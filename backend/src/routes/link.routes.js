const express = require("express");
const {
  manuallyLinkItems,
  manuallyUnlinkItems,
} = require("../controllers/link.controller");
const requireAuth = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/link", requireAuth, manuallyLinkItems);
router.post("/unlink", requireAuth, manuallyUnlinkItems);

module.exports = router;
