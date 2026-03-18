// src/index.js
const express = require("express");
const cors = require("cors");
require("./workers/save.worker");

const saveRoutes = require("./routes/save.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", saveRoutes);

module.exports = app;
