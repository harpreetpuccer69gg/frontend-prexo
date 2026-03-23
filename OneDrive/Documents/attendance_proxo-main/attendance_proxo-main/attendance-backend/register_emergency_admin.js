require("dotenv").config();
const User = require("./models/User");
const connectDB = require("./config/db");
const mongoose = require("mongoose");

async function addAdmin() {
  await connectDB();
  const email = "hs6727586@gmail.com";
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { 
        email, 
        name: "HS Admin", 
        role: "admin", 
        password: "flipkart@123", // They can use Google login though
        city: "Bengaluru",
        phone: "1234567890"
      },
      { upsert: true, new: true }
    );
    console.log("Admin registered successfully:", user.email);
  } catch (err) {
    console.error("Error registering admin:", err.message);
  }
  await mongoose.disconnect();
}

addAdmin();
