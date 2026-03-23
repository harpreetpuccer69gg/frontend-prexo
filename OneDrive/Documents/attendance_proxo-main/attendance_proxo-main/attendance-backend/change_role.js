const User = require("./models/User");
const connectDB = require("./config/db");
const mongoose = require("mongoose");
require("dotenv").config();

async function changeUserRole(email, newRole) {
  if (!email || !newRole) {
    console.error("Please provide both email and new role as arguments.");
    console.log("Usage: node change_role.js user@example.com admin");
    process.exit(1);
  }

  const VALID_ROLES = ["admin", "tl", "user"]; // Add more as needed
  if (!VALID_ROLES.includes(newRole)) {
    console.warn(`Warning: '${newRole}' is not in the standard role list (${VALID_ROLES.join(", ")}). Proceeding anyway...`);
  }

  try {
    await connectDB();
    
    const user = await User.findOneAndUpdate(
      { email },
      { role: newRole },
      { new: true }
    );
    
    if (!user) {
      console.log(`❌ No user found with email: ${email}`);
    } else {
      console.log(`✅ Successfully updated role for ${email} to: ${newRole}`);
      console.log("Updated User:", { name: user.name, email: user.email, role: user.role });
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error updating role:", err.message);
    process.exit(1);
  }
}

// Get arguments from command line
const emailArg = process.argv[2];
const roleArg = process.argv[3];

if (emailArg && roleArg) {
  changeUserRole(emailArg, roleArg);
} else {
  console.log("Please provide email and role: node change_role.js email role");
  process.exit(1);
}
