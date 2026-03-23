const bcrypt = require("bcryptjs");
require("dotenv").config();
const User = require("./models/User");
const connectDB = require("./config/db");

const seedAdmin = async () => {
  try {
    await connectDB();
    const existing = await User.findOne({ email: "ssangram111@gmail.com" });
    if (existing) {
      console.log("Admin already exists:", existing.email);
      process.exit(0);
    }
    const hashed = await bcrypt.hash("Admin@1234", 10);
    await User.create({
      name: "Admin",
      email: "ssangram111@gmail.com",
      password: hashed,
      role: "admin",
      city: "Bengaluru"
    });
    console.log("✅ Admin seeded — email: ssangram111@gmail.com | password: Admin@1234");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedAdmin();
