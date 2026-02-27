// routes/settings.js
const express = require("express");
const { body, validationResult } = require("express-validator");
const { protect } = require("../middleware/auth");
const User = require("../models/User");
const jwt  = require("jsonwebtoken");

const router = express.Router();
router.use(protect);

const signToken = (user) => jwt.sign(
  { id: user._id, role: user.role, sessionVersion: user.sessionVersion },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

// ── PATCH /api/settings/username ─────────────────────────────
router.patch("/username", [
  body("username").trim().isLength({ min: 3, max: 30 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { username } = req.body;
    const taken = await User.findOne({ username });
    if (taken) return res.status(409).json({ error: "Username already taken" });

    req.user.username = username;
    await req.user.save();
    res.json({ ok: true, user: req.user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: "Failed to update username" });
  }
});

// ── PATCH /api/settings/password ─────────────────────────────
router.patch("/password", [
  body("currentPassword").notEmpty(),
  body("newPassword").isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { currentPassword, newPassword } = req.body;

    const ok = await req.user.comparePassword(currentPassword);
    if (!ok) return res.status(401).json({ error: "Current password is incorrect" });

    const same = await req.user.comparePassword(newPassword);
    if (same) return res.status(400).json({ error: "New password must be different from current password" });

    req.user.password       = newPassword;
    req.user.sessionVersion += 1;
    await req.user.save();

    res.json({ token: signToken(req.user), message: "Password updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update password" });
  }
});

// ── PATCH /api/settings/theme ─────────────────────────────────
router.patch("/theme", [
  body("theme").trim().notEmpty(),
], async (req, res) => {
  try {
    req.user.theme = req.body.theme;
    await req.user.save();
    res.json({ ok: true, theme: req.user.theme });
  } catch (err) {
    res.status(500).json({ error: "Failed to update theme" });
  }
});

// ── GET /api/settings/me ─────────────────────────────────────
router.get("/me", (req, res) => {
  res.json(req.user.toJSON());
});

module.exports = router;
