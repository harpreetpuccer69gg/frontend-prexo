import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../Services/api";

const CITIES = ["NCR", "Kolkata", "Mumbai", "Bengaluru"];

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");

  const handleRegister = async () => {
    if (!email.endsWith("@flipkart.com")) {
      alert("Registration allowed only with @flipkart.com email address.");
      return;
    }
    if (!city) {
      alert("Please select your city.");
      return;
    }
    if (!phone || phone.trim().length < 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }
    try {
      await api.post("/auth/register", { name, email, password, city, phone });
      alert("Registration successful! Please login.");
      window.location.href = "/login";
    } catch (err) {
      alert("Registration failed: " + (err.response?.data?.message || "Unknown error"));
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Header */}
        <div style={s.cardHeader}>
          <div style={s.iconWrap}>
            <span style={s.icon}>👤</span>
          </div>
          <h2 style={s.title}>Create Account</h2>
          <p style={s.subtitle}>Register with your Flipkart email to get started</p>
        </div>

        {/* Form */}
        <div style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Full Name</label>
            <div style={s.inputWrap}>
              <span style={s.inputIcon}>👤</span>
              <input
                style={s.input}
                placeholder="Enter your full name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>Official Email</label>
            <div style={s.inputWrap}>
              <span style={s.inputIcon}>✉️</span>
              <input
                style={s.input}
                placeholder="you@flipkart.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <p style={s.hint}>Only @flipkart.com emails are accepted</p>
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <div style={s.inputWrap}>
              <span style={s.inputIcon}>🔒</span>
              <input
                style={s.input}
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>Phone Number <span style={{color:"#FB641B"}}>*</span></label>
            <div style={s.inputWrap}>
              <span style={s.inputIcon}>📞</span>
              <input
                style={s.input}
                placeholder="Enter your 10-digit mobile number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                maxLength={10}
              />
            </div>
            <p style={s.hint}>Required — will appear as TL No. in admin reports</p>
          </div>

          <div style={s.field}>
            <label style={s.label}>City</label>
            <div style={s.inputWrap}>
              <span style={s.inputIcon}>📍</span>
              <select
                style={{ ...s.input, color: city ? "#212121" : "#999", appearance: "none", cursor: "pointer" }}
                value={city}
                onChange={e => setCity(e.target.value)}
              >
                <option value="" disabled>Select your city</option>
                {CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <button style={s.btn} onClick={handleRegister}>
            Create Account
          </button>

          <div style={s.loginRow}>
            <span style={s.loginText}>Already have an account? </span>
            <Link to="/login" style={s.loginLink}>Login here</Link>
          </div>
        </div>

        <p style={s.footer}>Powered by <strong>PREXO</strong></p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #1a3a6e 0%, #2874F0 100%)",
    padding: "24px",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
    overflow: "hidden",
  },
  cardHeader: {
    background: "linear-gradient(135deg, #2874F0, #1a5dc8)",
    padding: "32px 36px 28px",
    textAlign: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },
  icon: { fontSize: 24 },
  title: { fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 },

  form: { padding: "28px 36px 8px" },
  field: { marginBottom: 20 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 7 },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: 12, fontSize: 15, pointerEvents: "none", zIndex: 1 },
  input: {
    width: "100%",
    padding: "12px 14px 12px 38px",
    border: "1.5px solid #e0e0e0",
    borderRadius: 6,
    fontSize: 14,
    color: "#212121",
    background: "#fafafa",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "inherit",
  },
  hint: { fontSize: 11, color: "#FB641B", marginTop: 5, fontWeight: 500 },

  btn: {
    width: "100%",
    padding: "13px",
    background: "#FB641B",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 4,
    marginBottom: 20,
    letterSpacing: 0.3,
    boxShadow: "0 2px 8px rgba(251,100,27,0.3)",
    transition: "background 0.2s",
    fontFamily: "inherit",
  },
  loginRow: { textAlign: "center", marginBottom: 8, fontSize: 14 },
  loginText: { color: "#555" },
  loginLink: { color: "#2874F0", fontWeight: 600, marginLeft: 4 },
  footer: { textAlign: "center", fontSize: 12, color: "#aaa", padding: "16px 36px 24px" },
};

export default Register;
