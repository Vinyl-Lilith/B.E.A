// utils/email.js — Resend (lazy init so missing API key doesn't crash server)
const { Resend } = require("resend");

let _resend = null;
function getResend() {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[EMAIL] RESEND_API_KEY not set — emails will be skipped");
    return null;
  }
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.RESEND_FROM || "BioCube <onboarding@resend.dev>";

async function sendEmail({ to, subject, html }) {
  const resend = getResend();
  if (!resend) return; // silently skip if no API key
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) console.error("[EMAIL] Resend error:", error.message);
    else console.log(`[EMAIL] Sent to ${to} (id: ${data.id})`);
  } catch (err) {
    console.error("[EMAIL] Failed:", err.message);
  }
}

module.exports = { sendEmail };
