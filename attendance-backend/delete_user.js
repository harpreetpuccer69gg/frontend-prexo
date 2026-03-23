const User = require("./models/User");
const connectDB = require("./config/db");
const mongoose = require("mongoose");
require("dotenv").config();

async function deleteUserByEmail(email) {
  if (!email) {
    console.error("Please provide an email address as an argument.");
    console.log("Usage: node delete_user.js user@example.com");
    process.exit(1);
  }

  try {
    await connectDB();
    
    const result = await User.deleteOne({ email });
    
    if (result.deletedCount === 0) {
      console.log(`❌ No user found with email: ${email}`);
    } else {
      console.log(`✅ Successfully deleted user with email: ${email}`);
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error deleting user:", err.message);
    process.exit(1);
  }
}

// Get email from command line argument
const emailArg = process.argv[2];
deleteUserByEmail("ssangram111@gmail.com");
