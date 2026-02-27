// utils/logger.js
const { SystemLog } = require("../models/SensorData");

async function log(level, source, message, meta = {}) {
  try {
    await SystemLog.create({ level, source, message, meta });
  } catch (err) {
    console.error("[LOGGER] Failed to write log:", err.message);
  }
}

module.exports = { log };
