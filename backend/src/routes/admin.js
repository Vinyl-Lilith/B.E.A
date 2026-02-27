// routes/admin.js
const express  = require("express");
const { body, validationResult } = require("express-validator");
const { protect, requireAdmin, requireHeadAdmin } = require("../middleware/auth");
const User     = require("../models/User");
const { sendEmail } = require("../utils/email");
const { log }  = require("../utils/logger");
const { generatePassword } = require("../utils/helpers");

const router = express.Router();
router.use(protect, requireAdmin);

// ── GET /api/admin/users ─────────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ── GET /api/admin/password-requests ─────────────────────────
// Get users with pending forgot-password messages
router.get("/password-requests", async (req, res) => {
  try {
    const users = await User.find({ forgotPasswordPending: true })
      .select("username email forgotPasswordMessage createdAt")
      .lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// ── POST /api/admin/reset-password/:userId ───────────────────
// Admin approves and resets user password — sends email with new password
router.post("/reset-password/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const newPassword = generatePassword(); // random 12-char password
    user.password              = newPassword; // will be hashed by pre-save hook
    user.forgotPasswordPending = false;
    user.forgotPasswordMessage = "";
    user.mustChangePassword    = true;
    user.sessionVersion       += 1;
    await user.save();

    // Send email with new password
    await sendEmail({
      to:      user.email,
      subject: "BioCube — Your password has been reset",
      html: `
        <h2>BioCube Password Reset</h2>
        <p>Hi <strong>${user.username}</strong>,</p>
        <p>An admin has reset your password. Your new temporary password is:</p>
        <p style="font-size:20px;font-weight:bold;letter-spacing:2px;">${newPassword}</p>
        <p>You will be prompted to change this password on your next login.</p>
        <p>If you did not request this, please contact an admin immediately.</p>
      `,
    });

    await log("info", "admin", `${req.user.username} reset password for ${user.username}`);
    res.json({ ok: true, message: `Password reset and emailed to ${user.email}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Password reset failed" });
  }
});

// ── POST /api/admin/ban/:userId ──────────────────────────────
router.post("/ban/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === "head_admin") return res.status(403).json({ error: "Cannot ban head admin" });

    user.banned = true;
    await user.save();
    await log("warn", "admin", `${req.user.username} banned ${user.username}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Ban failed" });
  }
});

// ── POST /api/admin/unban/:userId ────────────────────────────
router.post("/unban/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.banned = false;
    await user.save();
    await log("info", "admin", `${req.user.username} unbanned ${user.username}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Unban failed" });
  }
});

// ── POST /api/admin/restrict/:userId ─────────────────────────
router.post("/restrict/:userId", async (req, res) => {
  try {
    const { restricted } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === "head_admin") return res.status(403).json({ error: "Cannot restrict head admin" });

    user.restricted = restricted;
    await user.save();
    await log("info", "admin", `${req.user.username} ${restricted ? "restricted" : "unrestricted"} ${user.username}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Restrict failed" });
  }
});

// ── DELETE /api/admin/users/:userId ──────────────────────────
router.delete("/users/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === "head_admin") return res.status(403).json({ error: "Cannot delete head admin" });

    await User.findByIdAndDelete(req.params.userId);
    await log("warn", "admin", `${req.user.username} deleted user ${user.username}`);
    res.json({ ok: true, message: `User ${user.username} deleted` });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// ── POST /api/admin/promote/:userId ──────────────────────────
// Only head_admin can promote/demote
router.post("/promote/:userId", requireHeadAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "Role must be 'user' or 'admin'" });
    }
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === "head_admin") return res.status(403).json({ error: "Cannot change head admin role" });

    user.role = role;
    await user.save();
    await log("info", "admin", `${req.user.username} set ${user.username} role to ${role}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Promote/demote failed" });
  }
});

module.exports = router;
