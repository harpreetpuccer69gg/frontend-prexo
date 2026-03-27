const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const storeRoutes = require("./routes/storeRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return callback(null, true);
    // Allow all Vercel deployments and localhost
    const allowed = [
      /\.vercel\.app$/,
      /^http:\/\/localhost/
    ];
    const isAllowed = allowed.some(pattern => pattern.test(origin));
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
