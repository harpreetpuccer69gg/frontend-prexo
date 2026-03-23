const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({
  tlEmail:          { type: String, required: true, index: true },
  tlName:           { type: String, default: "" },
  city:             { type: String, default: "" },
  phone:            { type: String, default: "" },
  reportingManager: { type: String, default: "" },
  leaveType:        { type: String, enum: ["leave", "weekoff"], required: true },
  date:             { type: String, required: true }, // "DD/MM/YYYY"
  reason:           { type: String, default: "" },
  appliedAt:        { type: Date, default: Date.now }
});

// Prevent duplicate leave/weekoff for same TL on same day
leaveSchema.index({ tlEmail: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Leave", leaveSchema);
