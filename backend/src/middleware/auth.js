// middleware/auth.js
const jwt  = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET;

// ── Verify JWT ───────────────────────────────────────────────
exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token   = header.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user)   return res.status(401).json({ error: "User not found" });
    if (user.banned) return res.status(403).json({ error: "Account banned" });

    // Logout-everywhere: check sessionVersion matches
    if (decoded.sessionVersion !== user.sessionVersion) {
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// ── Role guards ──────────────────────────────────────────────
exports.requireAdmin = (req, res, next) => {
  if (!["admin", "head_admin"].includes(req.user.role)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

exports.requireHeadAdmin = (req, res, next) => {
  if (req.user.role !== "head_admin") {
    return res.status(403).json({ error: "Head admin access required" });
  }
  next();
};

// ── Restriction check (blocks manual + automation pages) ────
exports.notRestricted = (req, res, next) => {
  if (req.user.restricted) {
    return res.status(403).json({ error: "Your account is restricted from this action" });
  }
  next();
};

// ── Pi secret middleware (for Pi → backend endpoints) ───────
exports.piSecret = (req, res, next) => {
  const secret = req.headers["x-pi-secret"];
  if (!secret || secret !== process.env.PI_API_SECRET) {
    return res.status(401).json({ error: "Unauthorized Pi request" });
  }
  next();
};
