const User = require("./models/User");
const connectDB = require("./config/db");
const mongoose = require("mongoose");
require("dotenv").config();

async function listAllUsers() {
  try {
    await connectDB();
    const users = await User.find({}).select("email role name");
    console.log("Total users:", users.length);
    users.forEach(u => {
      console.log(`- ${u.email} (${u.role}) : ${u.name}`);
    });
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

listAllUsers();
