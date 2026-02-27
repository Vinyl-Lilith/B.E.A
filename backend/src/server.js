// ============================================================
//  BioCube — Main Server  (Phase 3)
// ============================================================
require("dotenv").config();
const express    = require("express");
const http       = require("http");
const helmet     = require("helmet");
const cors       = require("cors");
const mongoose   = require("mongoose");
const { initWS } = require("./utils/websocket");

// ── Routes ───────────────────────────────────────────────────
const authRoutes      = require("./routes/auth");
const piRoutes        = require("./routes/pi");
const dataRoutes      = require("./routes/data");
const adminRoutes     = require("./routes/admin");
const settingsRoutes  = require("./routes/settings");
const commandRoutes   = require("./routes/commands");

const app    = express();
const server = http.createServer(app);

// ── Security & parsing ───────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));
app.use(express.json());

// ── Rate limiting ────────────────────────────────────────────
const rateLimit = require("express-rate-limit");
app.use("/api/auth", rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,
  message: { error: "Too many requests, please try again later." },
}));
app.use("/api", rateLimit({
  windowMs: 1 * 60 * 1000,   // 1 minute
  max: 120,
}));

// ── Mount routes ─────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/pi",       piRoutes);       // Pi → backend endpoints
app.use("/api/data",     dataRoutes);     // frontend data queries
app.use("/api/admin",    adminRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/commands", commandRoutes);  // frontend → Arduino commands

// Health check
app.get("/health", (_, res) => res.json({ status: "ok", app: "BioCube" }));

// 404 handler
app.use((_, res) => res.status(404).json({ error: "Not found" }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

// ── WebSocket ────────────────────────────────────────────────
initWS(server);

// ── MongoDB ──────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("[FATAL] MONGO_URI not set in environment");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("[DB] MongoDB connected");
    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () =>
      console.log(`[SERVER] BioCube backend running on port ${PORT}`)
    );
  })
  .catch(err => {
    console.error("[FATAL] MongoDB connection failed:", err.message);
    process.exit(1);
  });

module.exports = { app, server };
