// models/User.js
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role:     { type: String, enum: ["user","admin","head_admin"], default: "user" },
  banned:             { type: Boolean, default: false },
  restricted:         { type: Boolean, default: false },
  mustChangePassword: { type: Boolean, default: false },
  theme:              { type: String,  default: "default" },
  forgotPasswordMessage: { type: String,  default: "" },
  forgotPasswordPending: { type: Boolean, default: false },
  sessionVersion:     { type: Number,  default: 0 },
}, { timestamps: true });

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", UserSchema);
