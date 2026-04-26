const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const Attendance = require("../models/Attendance");
const auth = require("../middleware/auth");

const IST = "Asia/Kolkata";

/* =========================
   PUNCH IN ROUTE
========================= */

router.post("/punchin", auth, async (req, res) => {

try {

const email = req.user.email;
const { latitude, longitude } = req.body;

/* VALIDATE GPS INPUT */

if (!latitude || !longitude) {
return res.status(400).json({
message: "Latitude and longitude are required"
});
}

/* FIND NEAREST STORE */

const nearestStore = await Store.findOne({
location: {
$near: {
$geometry: {
type: "Point",
coordinates: [longitude, latitude]
},
$maxDistance: 100
}
}
});

if (!nearestStore) {
return res.status(400).json({
message: "You are not near any store"
});
}

/* CHECK IF ALREADY PUNCHED IN (open punch-in exists) */

const openPunch = await Attendance.findOne({
tlEmail: email,
checkOutTime: null
});

if (openPunch) {
const hoursOpen = (new Date() - openPunch.checkInTime) / 3600000;
if (hoursOpen < 12) {
return res.status(400).json({
message: "You already have an open punch-in. Please punch out first."
});
}
// expired (>8hrs) — auto close silently, allow new punch-in
await Attendance.updateOne(
{ _id: openPunch._id },
{ $set: { checkOutTime: null } }
);
}

/* VISIT COUNT */

const visitCount = await Attendance.countDocuments({
tlEmail: email
});

/* SAVE ATTENDANCE */

const attendance = new Attendance({

tlEmail: email,
storeId: nearestStore._id,
storeName: nearestStore.name,
visitNumber: visitCount + 1,

checkInTime: new Date(),

checkInLocation: {
latitude: latitude,
longitude: longitude
}

});

await attendance.save();

/* RESPONSE */

res.json({
message: "Punch In successful",
store: nearestStore.name,
visitNumber: attendance.visitNumber
});

} catch (err) {

console.error(err);

res.status(500).json({
message: "Server error"
});

}

});

/* =========================
   PUNCH OUT ROUTE
========================= */

router.post("/punchout", auth, async (req,res)=>{

try{

const email = req.user.email;
const {latitude,longitude} = req.body;

if(!latitude || !longitude){
return res.status(400).json({
message:"Latitude and longitude are required"
});
}


/* FIND OPEN ATTENDANCE */

const openAttendance = await Attendance.findOne({
tlEmail:email,
checkOutTime:null
}).sort({checkInTime:-1});


if(!openAttendance){
return res.status(400).json({
message:"No open punch-in found"
});
}

/* BLOCK PUNCH OUT IF OLDER THAN 8 HOURS */

const hoursOpen = (new Date() - openAttendance.checkInTime) / 3600000;
if (hoursOpen > 12) {
return res.status(400).json({
message: "Punch out window expired. You can only punch out within 8 hours of punch in."
});
}


/* GET STORE */

const store = await Store.findById(openAttendance.storeId);


/* CHECK DISTANCE */

const distance = require("geolib").getDistance(
{
latitude: latitude,
longitude: longitude
},
{
latitude: store.location.coordinates[1],
longitude: store.location.coordinates[0]
}
);


if(distance > 100){
return res.status(400).json({
message:"You are too far from store to punch out",
distance:distance
});
}


/* UPDATE ATTENDANCE */

openAttendance.checkOutTime = new Date();

openAttendance.checkOutLocation = {
latitude: latitude,
longitude: longitude
};

await openAttendance.save();


res.json({
message:"Punch Out successful",
store:store.name
});

}catch(err){

console.error(err);

res.status(500).json({
message:"Server error"
});

}

});

/* =========================
   ADMIN ALL ATTENDANCE (FULL REPORT)
========================= */

router.get("/admin/all", auth, async (req, res) => {

try {

if (req.user.role !== "admin") {
return res.status(403).json({ message: "Access denied" });
}

const User = require("../models/User");

const users = await User.find({}).select("name email city phone reportingManager role");
const userMap = {};
users.forEach(u => { userMap[u.email] = u; });

const records = await Attendance.find().sort({ checkInTime: -1 });

const report = records.map(r => {
const u = userMap[r.tlEmail] || {};

let duration = null;
if (r.checkOutTime) {
const mins = Math.round((r.checkOutTime - r.checkInTime) / 60000);
const h = Math.floor(mins / 60);
const m = mins % 60;
duration = h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const checkInLat = r.checkInLocation ? r.checkInLocation.latitude : null;
const checkInLng = r.checkInLocation ? r.checkInLocation.longitude : null;
const checkOutLat = r.checkOutLocation ? r.checkOutLocation.latitude : null;
const checkOutLng = r.checkOutLocation ? r.checkOutLocation.longitude : null;

return {
_id: r._id,
date: r.checkInTime ? new Date(r.checkInTime).toLocaleDateString("en-GB", { timeZone: IST }) : "-",
userEmail: r.tlEmail,
punchIn: r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: IST }) : "-",
punchOut: r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: IST }) : "-",
location: checkInLat && checkInLng ? `${checkInLat},${checkInLng}` : "-",
fixedSite: checkOutLat && checkOutLng ? `${checkOutLat},${checkOutLng}` : "-",
distance: r.distanceMeters ? `${r.distanceMeters}m OK` : "100m OK",
duration: duration || "-",
city: u.city || "-",
storeName: r.storeName || "-",
tlName: u.name || "-",
tlNo: u.phone || "-",
reportingManager: u.reportingManager || "-"
};
});

res.json(report);

} catch (err) {
console.error(err);
res.status(500).json({ message: "Server error" });
}

});

/* =========================
   ADMIN ATTENDANCE REPORT
========================= */

router.get("/admin/report", async (req,res)=>{

try{

const records = await Attendance.find().sort({checkInTime:-1});

const report = records.map(r => {

let timeSpent = null;

if(r.checkOutTime){
timeSpent = Math.round(
(r.checkOutTime - r.checkInTime) / 60000
);
}

return {

tlEmail: r.tlEmail,
store: r.storeName,
visitNumber: r.visitNumber,
checkIn: r.checkInTime,
checkOut: r.checkOutTime,
timeSpentMinutes: timeSpent

};

});

res.json(report);

}catch(err){

console.error(err);

res.status(500).json({
message:"Server error"
});

}

});

/* =========================
   DAILY TL PERFORMANCE REPORT
========================= */

router.get("/admin/daily-report", async (req, res) => {

try {

const date = req.query.date || new Date().toISOString().split("T")[0];

const start = new Date(date);
start.setHours(0,0,0,0);

const end = new Date(date);
end.setHours(23,59,59,999);

const records = await Attendance.find({
checkInTime: { $gte: start, $lte: end }
});

const tlMap = {};

records.forEach(r => {

if(!tlMap[r.tlEmail]){
tlMap[r.tlEmail] = {
tlEmail: r.tlEmail,
totalVisits: 0,
firstPunchIn: r.checkInTime,
lastPunchOut: r.checkOutTime,
totalMinutes: 0
};
}

tlMap[r.tlEmail].totalVisits += 1;

if(r.checkOutTime){
const minutes = (r.checkOutTime - r.checkInTime) / 60000;
tlMap[r.tlEmail].totalMinutes += minutes;

if(r.checkOutTime > tlMap[r.tlEmail].lastPunchOut){
tlMap[r.tlEmail].lastPunchOut = r.checkOutTime;
}
}

});

res.json(Object.values(tlMap));

}catch(err){

console.error(err);

res.status(500).json({
message:"Server error"
});

}

});

/* =========================
   MY ATTENDANCE (TL VIEW)
========================= */

router.get("/my-attendance", auth, async (req,res)=>{

try{

const email = req.user.email;

const User = require("../models/User");
const user = await User.findOne({ email }).select("name city");
const city = user ? user.city : "";
const name = user ? user.name : "";

const records = await Attendance.find({
tlEmail: email
}).sort({checkInTime:-1});

const enriched = records.map(r => ({
  ...r.toObject(),
  city,
  name
}));

res.json(enriched);

}catch(err){

console.error(err);

res.status(500).json({
message:"Server error"
});

}

});

/* =========================
   APPLY LEAVE / WEEK OFF (TL)
========================= */

router.post("/apply-leave", auth, async (req, res) => {
  try {
    const Leave = require("../models/Leave");
    const User  = require("../models/User");

    const email = req.user.email;
    const { leaveType, reason } = req.body;

    if (!leaveType || !["leave", "weekoff"].includes(leaveType)) {
      return res.status(400).json({ message: "leaveType must be 'leave' or 'weekoff'" });
    }

    const today = new Date().toLocaleDateString("en-GB", { timeZone: IST });

    const existing = await Leave.findOne({ tlEmail: email, date: today });
    if (existing) {
      return res.status(400).json({
        message: existing.leaveType === "leave"
          ? "Leave already applied for today"
          : "Week Off already marked for today"
      });
    }

    const user = await User.findOne({ email }).select("name city phone reportingManager");

    const leave = new Leave({
      tlEmail:          email,
      tlName:           user?.name            || "",
      city:             user?.city            || "",
      phone:            user?.phone           || "",
      reportingManager: user?.reportingManager || "",
      leaveType,
      date:   today,
      reason: reason || ""
    });

    await leave.save();
    res.json({
      message: leaveType === "leave" ? "Leave applied successfully" : "Week Off marked successfully",
      date: today,
      leaveType
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   MY LEAVES (TL VIEW)
========================= */

router.get("/my-leaves", auth, async (req, res) => {
  try {
    const Leave = require("../models/Leave");
    const leaves = await Leave.find({ tlEmail: req.user.email }).sort({ appliedAt: -1 });
    res.json(leaves);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   ADMIN - ALL LEAVES
========================= */

router.get("/admin/leaves", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    const Leave = require("../models/Leave");
    const leaves = await Leave.find().sort({ appliedAt: -1 });
    res.json(leaves);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   ADMIN - DELETE ATTENDANCE
========================= */

router.delete("/admin/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    const deleted = await Attendance.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Record not found" });
    res.json({ message: "Record deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   ADMIN - DELETE LEAVE
========================= */

router.delete("/admin/leave/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    const Leave = require("../models/Leave");
    const deleted = await Leave.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Record not found" });
    res.json({ message: "Leave record deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   ADMIN - NOT REPORTED
========================= */

const TEST_EMAILS = ["hs8103536@gmail.com", "saiketramteke07@gmail.com"];

router.get("/admin/not-reported", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const User  = require("../models/User");
    const Leave = require("../models/Leave");

    // Accept ?date=YYYY-MM-DD or default to today
    let dateStr;
    if (req.query.date) {
      const [y, m, d] = req.query.date.split("-");
      dateStr = `${d}/${m}/${y}`; // convert to DD/MM/YYYY for Leave model
    } else {
      dateStr = new Date().toLocaleDateString("en-GB", { timeZone: IST });
    }

    // Build start/end for Attendance query
    const [dd, mm, yyyy] = dateStr.split("/");
    const start = new Date(`${yyyy}-${mm}-${dd}T00:00:00+05:30`);
    const end   = new Date(`${yyyy}-${mm}-${dd}T23:59:59+05:30`);

    const [allTLs, dayAttendance, dayLeaves] = await Promise.all([
      User.find({ role: "tl" }).select("name email city phone reportingManager"),
      Attendance.distinct("tlEmail", { checkInTime: { $gte: start, $lte: end } }),
      Leave.distinct("tlEmail", { date: dateStr })
    ]);

    const reportedEmails = new Set([...dayAttendance, ...dayLeaves]);

    const notReported = allTLs
      .filter(u => !reportedEmails.has(u.email) && !TEST_EMAILS.includes(u.email))
      .map(u => ({
        tlName:           u.name            || "-",
        tlEmail:          u.email           || "-",
        city:             u.city            || "-",
        phone:            u.phone           || "-",
        reportingManager: u.reportingManager || "-"
      }));

    res.json(notReported);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   EXPORT ROUTER
========================= */

module.exports = router;
