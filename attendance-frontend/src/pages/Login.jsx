import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import api from "../Services/api";

function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    flow: "implicit",
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const userInfo = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        }).then(r => r.json());

        const res = await api.post("/auth/google", {
          googleEmail: userInfo.email.toLowerCase().trim(),
          googleName: userInfo.name,
          googleId: userInfo.sub
        });

        localStorage.setItem("token", res.data.token);
        
        // Use navigate for client-side routing instead of window.location.href
        const targetPath = res.data.role === "admin" ? "/admin" : "/dashboard";
        navigate(targetPath, { replace: true });
        
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || "Google login failed. Your account may not be registered.";
        alert(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    onError: () => alert("Google sign-in was cancelled or failed")
  });

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.leftContent}>
          <div style={styles.brandRow}>
            <div style={styles.brandIcon}>TL</div>
            <span style={styles.brandName}>TL Attendance</span>
          </div>
          <h2 style={styles.leftTitle}>Track. Manage. Succeed.</h2>
          <p style={styles.leftDesc}>GPS-powered attendance for Flipkart Team Leaders. Punch in from the field, track every visit, and stay accountable.</p>
          <div style={styles.featureList}>
            {["📍 Real-time GPS punch-in", "📋 Visit history tracking", "🔒 Secure Flipkart login"].map(f => (
              <div key={f} style={styles.featureItem}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.card}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Flipkart_logo.svg/200px-Flipkart_logo.svg.png" style={styles.logo} alt="Flipkart" />
          <h1 style={styles.title}>Welcome back</h1>
          <p style={styles.subtitle}>Sign in with your Flipkart Google account</p>

          <button
            style={styles.googleButton}
            onClick={() => handleGoogleLogin()}
            disabled={loading}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style={styles.googleIcon} alt="G" />
            {loading ? "Signing in..." : "Sign in with Google"}
          </button>

          <p style={styles.footer}>Powered by <strong>PREXO</strong></p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "flex", flexWrap: "wrap" },
  left: { flex: "1 1 380px", background: "linear-gradient(145deg,#1a3a6e 0%,#2874F0 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 40px" },
  leftContent: { maxWidth: 360 },
  brandRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 32 },
  brandIcon: { width: 40, height: 40, borderRadius: 8, background: "rgba(255,255,255,0.2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15 },
  brandName: { color: "#fff", fontWeight: 700, fontSize: 20 },
  leftTitle: { fontSize: "clamp(22px,3vw,30px)", fontWeight: 700, color: "#fff", marginBottom: 16, lineHeight: 1.3 },
  leftDesc: { fontSize: 15, color: "rgba(255,255,255,0.78)", lineHeight: 1.7, marginBottom: 32 },
  featureList: { display: "flex", flexDirection: "column", gap: 12 },
  featureItem: { color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 500, background: "rgba(255,255,255,0.1)", padding: "10px 16px", borderRadius: 8 },
  right: { flex: "1 1 380px", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px", background: "#F1F3F6" },
  card: { width: "100%", maxWidth: 400, background: "#fff", borderRadius: 16, padding: "40px 36px", boxShadow: "0 4px 24px rgba(0,0,0,0.1)", textAlign: "center" },
  logo: { width: 110, marginBottom: 16, objectFit: "contain" },
  title: { fontSize: 24, fontWeight: 700, color: "#212121", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#878787", marginBottom: 32 },
  googleButton: { width: "100%", padding: "13px 16px", background: "#fff", color: "#3c4043", border: "1.5px solid #dadce0", borderRadius: 6, cursor: "pointer", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 24, fontFamily: "inherit" },
  googleIcon: { width: 20, height: 20 },
  footer: { marginTop: 8, fontSize: 12, color: "#aaa" },
};

export default Login;
