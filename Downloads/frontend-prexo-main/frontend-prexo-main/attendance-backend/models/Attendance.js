// models/Attendance.js
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  tlEmail: { type: String, required: true, index: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  storeName: { type: String },                 // denormalized for quick reads
  visitNumber: { type: Number, default: 1 },   // 1,2,3... per tl+store (optional)
  checkInTime: { type: Date, default: Date.now },
  checkOutTime: { type: Date, default: null },
  checkInLocation: {
    latitude: Number,
    longitude: Number
  },
  checkOutLocation: {
    latitude: Number,
    longitude: Number
  },
  distanceMeters: Number, // distance at check-in time
  remarks: String,
  createdAt: { type: Date, default: Date.now }
});

// Optional compound index to help queries per tl+store sorted by newest
attendanceSchema.index({ tlEmail: 1, storeId: 1, checkInTime: -1 });

module.exports = mongoose.model("Attendance", attendanceSchema);