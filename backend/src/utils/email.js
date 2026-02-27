// utils/email.js
const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password (not account password)
    },
  });
  return transporter;
}

async function sendEmail({ to, subject, html }) {
  try {
    const t = getTransporter();
    await t.sendMail({
      from: `"BioCube" <${process.env.GMAIL_USER}>`,
      to, subject, html,
    });
    console.log(`[EMAIL] Sent to ${to}: ${subject}`);
  } catch (err) {
    console.error("[EMAIL] Failed:", err.message);
    // Don't throw — email failure should not break the API response
  }
}

module.exports = { sendEmail };
