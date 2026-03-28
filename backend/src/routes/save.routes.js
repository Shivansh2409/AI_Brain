const express = require("express");
const { saveItemController } = require("../controllers/save.controller");
const requireAuth = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/save", requireAuth, saveItemController);

module.exports = router;
