// utils/helpers.js
const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function generatePassword(length = 12) {
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return pass;
}

module.exports = { generatePassword };
