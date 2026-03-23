const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

name: String,

  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },

phone: String,
city: String,
reportingManager: String,

password: String,
googleId: String,
role: { type: String, enum: ["tl", "admin"], default: "tl" },

deviceId: String

});

module.exports = mongoose.model("User", userSchema);