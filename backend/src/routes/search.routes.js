const express = require("express");
const { searchItemsController } = require("../controllers/search.controller");
const requireAuth = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/search", requireAuth, searchItemsController);

module.exports = router;
