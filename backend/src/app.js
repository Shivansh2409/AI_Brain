const path = require("path");
const express = require("express");
const cors = require("cors");
require("./workers/save.worker");

const saveRoutes = require("./routes/save.routes");
const searchRoutes = require("./routes/search.routes");
const feedRoutes = require("./routes/feed.routes");
const linkRoutes = require("./routes/link.routes");
const uploadRoutes = require("./routes/upload.routes");
const authRoutes = require("./routes/auth.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", saveRoutes);
app.use("/api", searchRoutes);
app.use("/api", feedRoutes);
app.use("/api", linkRoutes);
app.use("/api", uploadRoutes);
app.use("/api", authRoutes);

app.get("/health", (req, res) => {
  console.log("Health check hit!");
  res.send("Server is alive!");
});

// Unknown API routes -> JSON 404 (don't fall through to the frontend)
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Serve the built Next.js frontend (static export) from backend/public.
// extensions: ["html"] lets /auth/login resolve to /auth/login.html
const publicDir = path.join(__dirname, "../public");
app.use(express.static(publicDir, { extensions: ["html"] }));

// Fallback for any other GET -> frontend's 404 page (or index.html)
app.get("/{*splat}", (req, res) => {
  const notFound = path.join(publicDir, "404.html");
  res.status(404).sendFile(notFound, (err) => {
    if (err) res.sendFile(path.join(publicDir, "index.html"), (err2) => {
      if (err2) res.status(404).send("Frontend not built");
    });
  });
});

module.exports = app;
