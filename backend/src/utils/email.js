const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM || "BioCube <onboarding@resend.dev>";

async function sendEmail({ to, subject, html }) {
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) console.error("[EMAIL] Resend error:", error.message);
    else console.log(`[EMAIL] Sent to ${to} (id: ${data.id})`);
  } catch (err) {
    console.error("[EMAIL] Failed:", err.message);
  }
}

module.exports = { sendEmail };
