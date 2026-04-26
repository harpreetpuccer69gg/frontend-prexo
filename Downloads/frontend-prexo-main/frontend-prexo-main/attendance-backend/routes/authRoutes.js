const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const SECRET = process.env.JWT_SECRET || "attendance_secret";


/* =========================
   REGISTER USER
========================= */

router.post("/register", async (req,res)=>{

try{

const {name,email,password,city,phone} = req.body;

const ALLOWED_CITIES = ["NCR","Kolkata","Mumbai","Bengaluru","Hyderabad"];

if(!city || !ALLOWED_CITIES.includes(city)){
return res.status(400).json({
message:"Invalid city. Allowed: NCR, Kolkata, Mumbai, Bengaluru"
});
}

const existingUser = await User.findOne({email});

if(existingUser){
return res.status(400).json({
message:"User already exists"
});
}

const hashedPassword = await bcrypt.hash(password,10);

const user = new User({
name,
email,
password:hashedPassword,
city,
phone: phone || "",
role:"tl"
});

await user.save();

res.json({
message:"User registered successfully"
});

}catch(err){

res.status(500).json({
message:"Server error"
});

}

});


/* =========================
   LOGIN USER
========================= */

router.post("/login", async (req,res)=>{

try{

    const { email, password } = req.body;
    const user = await User.findOne({ email: email.trim() }).collation({ locale: 'en', strength: 2 });

if(!user){
return res.status(404).json({
message:"User not found"
});
}

const validPassword = await bcrypt.compare(password,user.password);

if(!validPassword){
return res.status(401).json({
message:"Invalid password"
});
}

const token = jwt.sign(
{ email: user.email, role: user.role },
SECRET,
{expiresIn:"1d"}
);

    res.json({
      message: "Login successful",
      token,
      role: user.role // Trust the user object from DB
    });

}catch(err){

res.status(500).json({
message:"Server error"
});

}

});


/* =========================
   GET CURRENT USER PROFILE
========================= */

router.get("/me", async (req,res)=>{

try{

const authHeader = req.headers.authorization;
if(!authHeader) return res.status(401).json({ message:"Token required" });

const token = authHeader.replace("Bearer ","");
const decoded = jwt.verify(token, SECRET);

const user = await User.findOne({ email: decoded.email.trim() }).collation({ locale: 'en', strength: 2 }).select("name email city role");

if (!user) return res.status(404).json({ message: "User not found" });

res.json({
  name: user.name,
  email: user.email,
  city: user.city,
  role: user.role
});

}catch(err){

res.status(500).json({
message:"Server error"
});

}

});


/* =========================
   GOOGLE OAUTH LOGIN
========================= */

router.post("/google", async (req, res) => {
  try {
    const email = req.body.googleEmail;

    console.log(email,"---------","googleEmail")
 
    const user = await User.findOne({ email});
    console.log(user,"email------")

    if (!user) {
      return res.status(403).json({
        message: "Access denied. Your Google account (" + email + ") is not registered. Please contact your admin."
      });
    }

    // 4. Generate local JWT with roles from DB
    const token = jwt.sign(
      { email: user.email, role: user.role },
      SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Google login successful",
      token,
      role: user.role,
      name: user.name,
      email: user.email
    });

  } catch (err) {
    console.error("Google auth error:", err.message);
    res.status(401).json({ message: "Login failed" });
  }
});

/* =========================
   LOGOUT USER
========================= */

router.post("/logout", (req, res) => {
  res.json({ message: "Logout successful" });
});


module.exports = router;
