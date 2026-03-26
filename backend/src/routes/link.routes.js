const express = require("express");
const {
  manuallyLinkItems,
  manuallyUnlinkItems,
} = require("../controllers/link.controller");

const router = express.Router();

router.post("/link", manuallyLinkItems);
router.post("/unlink", manuallyUnlinkItems);

module.exports = router;
