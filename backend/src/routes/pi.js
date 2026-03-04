// routes/pi.js  — endpoints called by the Raspberry Pi bridge
const express   = require("express");
const { piSecret } = require("../middleware/auth");
const { SensorData, SystemLog, StreamUrl } = require("../models/SensorData");
const { broadcast } = require("../utils/websocket");
const { log }   = require("../utils/logger");

const router = express.Router();
router.use(piSecret); // all Pi routes require x-pi-secret header

// ── POST /api/pi/ingest ──────────────────────────────────────
// Receive sensor data from Pi and store in MongoDB
router.post("/ingest", async (req, res) => {
  try {
    const { timestamp, sensors, thresholds, actuators, automation, buffered_at } = req.body;

    const record = await SensorData.create({
      timestamp:  timestamp ? new Date(timestamp) : new Date(),
      sensors, thresholds, actuators, automation, buffered_at,
    });

    // Push live update to all connected dashboard WebSocket clients
    broadcast("sensor_update", {
      timestamp:  record.timestamp,
      sensors, thresholds, actuators, automation,
    });

    res.status(201).json({ ok: true, id: record._id });
  } catch (err) {
    console.error("[ingest]", err);
    res.status(500).json({ error: "Ingest failed" });
  }
});

// ── POST /api/pi/heartbeat ───────────────────────────────────
router.post("/heartbeat", async (req, res) => {
  broadcast("arduino_status", { online: true, ts: new Date() });
  res.json({ ok: true });
});

// ── POST /api/pi/alert ───────────────────────────────────────
router.post("/alert", async (req, res) => {
  try {
    const { type, message, ts } = req.body;
    await log("warn", "arduino", message, { type, ts });
    broadcast("system_alert", { type, message, ts });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Alert failed" });
  }
});

// ── POST /api/pi/ack ─────────────────────────────────────────
router.post("/ack", async (req, res) => {
  try {
    const { command, ok } = req.body;
    await log("info", "arduino", `Arduino ack: ${command} = ${ok}`);
    broadcast("command_ack", req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Ack failed" });
  }
});

// ── POST /api/pi/stream-url ──────────────────────────────────
// Pi pushes current ngrok webcam URL whenever it changes
router.post("/stream-url", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "url required" });

    await StreamUrl.findOneAndUpdate(
      {},
      { url, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    // Broadcast new stream URL to all dashboard clients
    broadcast("stream_url_update", { url });
    await log("info", "pi", `Stream URL updated: ${url}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Stream URL update failed" });
  }
});

module.exports = router;
