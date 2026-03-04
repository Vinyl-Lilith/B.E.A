// models/SensorData.js
const mongoose = require("mongoose");

const SensorDataSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  sensors: {
    temp11: Number, hum11: Number, temp22: Number, hum22: Number,
    tempAvg: Number, humAvg: Number, soil1: Number, soil2: Number,
    npk_N: Number, npk_P: Number, npk_K: Number,
  },
  thresholds: {
    tempMax: Number, tempMin: Number, humidityMax: Number,
    soilMoist1: Number, soilMoist2: Number,
    npk_N: Number, npk_P: Number, npk_K: Number,
  },
  actuators: {
    exhaustFan: Boolean, peltierOn: Boolean, peltierPWM: Number,
    fanCold: Boolean, fanHot: Boolean, pumpWater: Boolean, pumpNutrient: Boolean,
  },
  automation: Boolean,
  buffered_at: String,
}, { timestamps: false });

SensorDataSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
const SensorData = mongoose.model("SensorData", SensorDataSchema);

const SystemLogSchema = new mongoose.Schema({
  level:   { type: String, enum: ["info","warn","error"], default: "info" },
  source:  String,
  message: { type: String, required: true },
  meta:    { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });
SystemLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
const SystemLog = mongoose.model("SystemLog", SystemLogSchema);

const StreamUrlSchema = new mongoose.Schema({
  url:       { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
});
const StreamUrl = mongoose.model("StreamUrl", StreamUrlSchema);

module.exports = { SensorData, SystemLog, StreamUrl };
