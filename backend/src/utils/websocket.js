// utils/websocket.js
const { WebSocketServer, WebSocket } = require("ws");
const { URL } = require("url");

let wss = null;
let piSocket = null;       // the single Pi connection
const dashboardClients = new Set(); // all browser dashboard connections

// ── Init ─────────────────────────────────────────────────────
function initWS(server) {
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    const pathname = new URL(req.url, "http://localhost").pathname;

    // ── Pi bridge connection ──────────────────────────────────
    if (pathname === "/ws/pi") {
      const secret = req.headers["x-pi-secret"];
      if (secret !== process.env.PI_API_SECRET) {
        ws.close(1008, "Unauthorized");
        return;
      }
      piSocket = ws;
      console.log("[WS] Pi connected");
      broadcast("pi_status", { online: true });

      ws.on("message", (raw) => {
        // Pi sends real-time sensor data events
        try {
          const msg = JSON.parse(raw.toString());
          // Broadcast to all dashboard clients
          broadcastRaw(JSON.stringify(msg));
        } catch (e) {
          console.error("[WS] Bad Pi message:", e.message);
        }
      });

      ws.on("close", () => {
        piSocket = null;
        console.log("[WS] Pi disconnected");
        broadcast("pi_status", { online: false });
      });

      ws.on("error", (err) => console.error("[WS] Pi error:", err.message));
    }

    // ── Dashboard (browser) connection ────────────────────────
    else if (pathname === "/ws/dashboard") {
      dashboardClients.add(ws);
      console.log(`[WS] Dashboard client connected (total: ${dashboardClients.size})`);

      ws.on("close", () => {
        dashboardClients.delete(ws);
        console.log(`[WS] Dashboard client disconnected (total: ${dashboardClients.size})`);
      });

      ws.on("error", (err) => console.error("[WS] Dashboard error:", err.message));

      // Send a welcome ping so client knows it's connected
      ws.send(JSON.stringify({ event: "connected", data: { app: "BioCube" } }));
    }

    else {
      ws.close(1008, "Unknown path");
    }
  });

  console.log("[WS] WebSocket server ready");
}

// ── Broadcast to all dashboard clients ───────────────────────
function broadcast(event, data) {
  const msg = JSON.stringify({ event, data });
  for (const client of dashboardClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

function broadcastRaw(msg) {
  for (const client of dashboardClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

// ── Send command to Pi ────────────────────────────────────────
function sendToPi(cmd) {
  if (!piSocket || piSocket.readyState !== WebSocket.OPEN) {
    console.warn("[WS] Pi not connected — cannot send command");
    return false;
  }
  piSocket.send(JSON.stringify(cmd));
  return true;
}

// ── Pi online status ──────────────────────────────────────────
function isPiConnected() {
  return piSocket && piSocket.readyState === WebSocket.OPEN;
}

module.exports = { initWS, broadcast, broadcastRaw, sendToPi, isPiConnected };
