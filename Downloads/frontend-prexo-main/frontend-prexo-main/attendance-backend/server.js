const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const storeRoutes = require("./routes/storeRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed =
      /\.vercel\.app$/.test(origin) ||
      /^http:\/\/localhost/.test(origin) ||
      ALLOWED_ORIGINS.includes(origin);
    if (isAllowed) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json());

// Connection
connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req,res)=>{
    res.send("Attendance API running");
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
});
