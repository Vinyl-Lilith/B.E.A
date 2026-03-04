// routes/data.js — sensor data queries for the frontend
const express    = require("express");
const XLSX       = require("xlsx");
const { protect, notRestricted } = require("../middleware/auth");
const { SensorData, StreamUrl, SystemLog } = require("../models/SensorData");

const router = express.Router();
router.use(protect); // all data routes require login

// ── GET /api/data/latest ─────────────────────────────────────
// Most recent sensor reading
router.get("/latest", async (req, res) => {
  try {
    const record = await SensorData.findOne().sort({ timestamp: -1 });
    res.json(record || {});
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch latest data" });
  }
});

// ── GET /api/data/history ────────────────────────────────────
// Query: ?date=2026-02-24   → full day (24h) of data
// Query: ?from=ISO&to=ISO   → custom range
// Query: ?limit=200         → limit records (default 500)
router.get("/history", async (req, res) => {
  try {
    const { date, from, to, limit = 500 } = req.query;
    let filter = {};

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.timestamp = { $gte: start, $lte: end };
    } else if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to)   filter.timestamp.$lte = new Date(to);
    }

    const records = await SensorData
      .find(filter)
      .sort({ timestamp: 1 })
      .limit(parseInt(limit))
      .lean();

    res.json(records);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// ── GET /api/data/stream-url ─────────────────────────────────
// Frontend fetches current ngrok webcam URL
router.get("/stream-url", async (req, res) => {
  try {
    const doc = await StreamUrl.findOne();
    res.json({ url: doc ? doc.url : null });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stream URL" });
  }
});

// ── GET /api/data/export ─────────────────────────────────────
// Download Excel sheet for a given date
// Query: ?date=2026-02-24
router.get("/export", async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "date param required (YYYY-MM-DD)" });

    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end   = new Date(date); end.setHours(23, 59, 59, 999);

    const records = await SensorData
      .find({ timestamp: { $gte: start, $lte: end } })
      .sort({ timestamp: 1 })
      .lean();

    if (!records.length) {
      return res.status(404).json({ error: "No data found for this date" });
    }

    // Build rows in the required format:
    // TIME | HUMIDITY | SOIL MOISTURE | TEMPERATURE | N | P | K
    const rows = records.map(r => {
      const ts = new Date(r.timestamp);
      const timeStr = ts.toLocaleString("en-US", {
        month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit", hour12: true,
      });
      return {
        "TIME":          timeStr,
        "HUMIDITY (%)":       r.sensors?.humAvg?.toFixed(1)  ?? "",
        "SOIL MOISTURE (%)":  ((r.sensors?.soil1 + r.sensors?.soil2) / 2)?.toFixed(1) ?? "",
        "TEMPERATURE (°C)":   r.sensors?.tempAvg?.toFixed(1) ?? "",
        "N (mg/kg)":          r.sensors?.npk_N ?? "",
        "P (mg/kg)":          r.sensors?.npk_P ?? "",
        "K (mg/kg)":          r.sensors?.npk_K ?? "",
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths
    ws["!cols"] = [
      { wch: 20 }, { wch: 14 }, { wch: 18 },
      { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, `Data ${date}`);
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", `attachment; filename="BioCube_${date}.xlsx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buf);
  } catch (err) {
    console.error("[export]", err);
    res.status(500).json({ error: "Export failed" });
  }
});

// ── GET /api/data/system-log ─────────────────────────────────
router.get("/system-log", async (req, res) => {
  try {
    const logs = await SystemLog.find().sort({ createdAt: -1 }).limit(200).lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

module.exports = router;
