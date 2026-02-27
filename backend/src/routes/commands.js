// routes/commands.js
// Frontend sends commands (thresholds, manual actuators, automation toggle)
// Backend forwards them to the Pi over WebSocket
const express = require("express");
const { body, validationResult } = require("express-validator");
const { protect, notRestricted } = require("../middleware/auth");
const { sendToPi } = require("../utils/websocket");
const { log } = require("../utils/logger");

const router = express.Router();
router.use(protect);

const VALID_THRESHOLDS = [
  "tempMax","tempMin","humidityMax",
  "soilMoist1","soilMoist2","npk_N","npk_P","npk_K"
];
const VALID_ACTUATORS = [
  "exhaustFan","peltier","pumpWater","pumpNutrient"
];

// ── POST /api/commands/threshold ─────────────────────────────
router.post("/threshold", notRestricted, [
  body("key").isIn(VALID_THRESHOLDS),
  body("value").isNumeric(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { key, value } = req.body;
  const cmd = { cmd: "setThresh", key, value: parseFloat(value) };

  const sent = sendToPi(cmd);
  if (!sent) return res.status(503).json({ error: "Pi is not connected" });

  await log("info", "user", `${req.user.username} set threshold ${key}=${value}`);
  res.json({ ok: true, cmd });
});

// ── POST /api/commands/actuator ──────────────────────────────
// Only allowed when automation is off
router.post("/actuator", notRestricted, [
  body("actuator").isIn(VALID_ACTUATORS),
  body("state").isBoolean(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { actuator, state } = req.body;
  const cmd = { cmd: "setActuator", actuator, state };

  const sent = sendToPi(cmd);
  if (!sent) return res.status(503).json({ error: "Pi is not connected" });

  await log("info", "user", `${req.user.username} manually set ${actuator}=${state}`);
  res.json({ ok: true, cmd });
});

// ── POST /api/commands/automation ───────────────────────────
router.post("/automation", notRestricted, [
  body("enabled").isBoolean(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { enabled } = req.body;
  const cmd = { cmd: "setAutomation", enabled };

  const sent = sendToPi(cmd);
  if (!sent) return res.status(503).json({ error: "Pi is not connected" });

  await log("info", "user", `${req.user.username} set automation=${enabled}`);
  res.json({ ok: true, cmd });
});

// ── POST /api/commands/shutdown ──────────────────────────────
// Admin only
router.post("/shutdown", (req, res, next) => {
  if (!["admin","head_admin"].includes(req.user.role)) {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}, async (req, res) => {
  const sent = sendToPi({ cmd: "shutdown" });
  if (!sent) return res.status(503).json({ error: "Pi is not connected" });

  await log("warn", "user", `${req.user.username} triggered system shutdown`);
  res.json({ ok: true });
});

module.exports = router;
