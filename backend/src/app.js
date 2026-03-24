// src/index.js
const express = require("express");
const cors = require("cors");
require("./workers/save.worker");

const saveRoutes = require("./routes/save.routes");
const searchRoutes = require("./routes/search.routes");
const feedRoutes = require("./routes/feed.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", saveRoutes);
app.use("/api", searchRoutes);
app.use("/api", feedRoutes);

app.get("/health", (req, res) => {
  console.log("Health check hit!");
  res.send("Server is alive!");
});

module.exports = app;
