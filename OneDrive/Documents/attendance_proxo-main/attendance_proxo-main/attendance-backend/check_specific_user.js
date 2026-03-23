const User = require("./models/User");
const connectDB = require("./config/db");
const mongoose = require("mongoose");
require("dotenv").config();

async function checkUser(email) {
  try {
    await connectDB();
    const user = await User.findOne({ email });
    if (user) {
      console.log(`✅ User found:`, user);
    } else {
      console.log(`❌ User NOT found with email: ${email}`);
    }
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkUser("hs6727586@gmail.com");
