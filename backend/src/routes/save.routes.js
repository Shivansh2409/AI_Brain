const express = require("express");
const { saveItemController } = require("../controllers/save.controller");

const router = express.Router();

router.post("/save", saveItemController);

module.exports = router;
