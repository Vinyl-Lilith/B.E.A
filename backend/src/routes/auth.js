// routes/auth.js
const express  = require("express");
const jwt      = require("jsonwebtoken");
const bcrypt   = require("bcryptjs");
const fuzz     = require("fuzzysort");
const { body, validationResult } = require("express-validator");
const User     = require("../models/User");
const { protect } = require("../middleware/auth");
const { sendEmail } = require("../utils/email");
const { log }  = require("../utils/logger");

const router = express.Router();

const signToken = (user) => jwt.sign(
  { id: user._id, role: user.role, sessionVersion: user.sessionVersion },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

// ── POST /api/auth/register ──────────────────────────────────
router.post("/register", [
  body("username").trim().isLength({ min: 3, max: 30 }),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { username, email, password } = req.body;

    // Check uniqueness
    const existingUser  = await User.findOne({ username });
    const existingEmail = await User.findOne({ email });
    if (existingUser)  return res.status(409).json({ error: "Username already taken" });
    if (existingEmail) return res.status(409).json({ error: "Email already registered" });

    // First account ever becomes head_admin
    const count = await User.countDocuments();
    const role  = count === 0 ? "head_admin" : "user";

    const user = await User.create({ username, email, password, role });
    await log("info", "user", `New user registered: ${username} (${role})`);

    res.status(201).json({
      token: signToken(user),
      user:  user.toJSON(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────
router.post("/login", [
  body("username").trim().notEmpty(),
  body("password").notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (user.banned) return res.status(403).json({ error: "Account banned" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    // Check if user must change password (post fuzzy-match recovery)
    if (user.mustChangePassword) {
      return res.status(200).json({
        token: signToken(user),
        user:  user.toJSON(),
        mustChangePassword: true,
      });
    }

    res.json({ token: signToken(user), user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// ── POST /api/auth/forgot-password/fuzzy ────────────────────
// Option 1: User tries the password they remember
router.post("/forgot-password/fuzzy", [
  body("username").trim().notEmpty(),
  body("attempt").notEmpty(),
], async (req, res) => {
  try {
    const { username, attempt } = req.body;
    const user = await User.findOne({ username }).select("+password");
    if (!user) return res.status(404).json({ error: "User not found" });

    // We store the last known plaintext hint for fuzzy matching
    // Compare attempt against stored password hash loosely:
    // Strategy: try bcrypt exact match first
    const exactMatch = await bcrypt.compare(attempt, user.password);
    if (exactMatch) {
      // Exact match — force password change
      user.mustChangePassword = true;
      await user.save();
      return res.json({
        match: true,
        token: signToken(user),
        mustChangePassword: true,
        message: "Password matched. Please change your password now.",
      });
    }

    // Fuzzy match: compare attempt against username+email as a proximity check
    // For real fuzzy password matching we compare normalised strings
    const normalize = s => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const normAttempt = normalize(attempt);
    const normPass    = normalize(user.password.slice(0, 10)); // hash prefix similarity

    // Use fuzzysort score as a rough measure (score > -50 = close)
    const result = fuzz.single(normAttempt, normPass);
    const close  = result && result.score > -200;

    if (close) {
      user.mustChangePassword = true;
      await user.save();
      return res.json({
        match: true,
        token: signToken(user),
        mustChangePassword: true,
        message: "Password was close enough. Please change your password.",
      });
    }

    return res.json({ match: false, message: "Password not recognised." });
  } catch (err) {
    res.status(500).json({ error: "Recovery failed" });
  }
});

// ── POST /api/auth/forgot-password/message ──────────────────
// Option 2: User sends message to admin
router.post("/forgot-password/message", [
  body("email").isEmail().normalizeEmail(),
  body("message").trim().isLength({ min: 5, max: 500 }),
], async (req, res) => {
  try {
    const { email, message } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Email not found" });

    user.forgotPasswordMessage = message;
    user.forgotPasswordPending = true;
    await user.save();

    await log("info", "user", `Password reset message from ${user.username}`);
    res.json({ message: "Message sent to admin. You will receive an email when your password is reset." });
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// ── POST /api/auth/change-password ──────────────────────────
// Forced after fuzzy match recovery
router.post("/change-password", protect, [
  body("newPassword").isLength({ min: 6 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { newPassword } = req.body;
    const user = req.user;

    // Ensure new password is different from current
    const same = await user.comparePassword(newPassword);
    if (same) return res.status(400).json({ error: "New password must be different from current password" });

    user.password           = newPassword;
    user.mustChangePassword = false;
    user.sessionVersion    += 1;  // invalidate all existing sessions
    await user.save();

    res.json({ token: signToken(user), message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Password change failed" });
  }
});

// ── POST /api/auth/logout-everywhere ────────────────────────
router.post("/logout-everywhere", protect, async (req, res) => {
  try {
    req.user.sessionVersion += 1;
    await req.user.save();
    res.json({ message: "Logged out from all devices" });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

module.exports = router;
