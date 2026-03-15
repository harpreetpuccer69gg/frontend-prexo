import { Link } from "react-router-dom";

function Landing() {
  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.brand}>
            <div style={s.brandIcon}>TL</div>
            <span style={s.brandName}>TL Attendance</span>
          </div>
          <div style={s.headerActions}>
            <Link to="/login" style={s.btnPrimary}>Login</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.heroBg} />
        <div style={s.heroContent}>
          <div style={s.badge}>Powered by PREXO</div>
          <h1 style={s.heroTitle}>Smart Attendance<br />for Team Leaders</h1>
          <p style={s.heroSubtitle}>
            GPS-based punch-in/out system built for Flipkart field teams.
            Track visits, manage attendance, and stay on top of your schedule.
          </p>
          <div style={s.heroCta}>
            <Link to="/login" style={s.ctaPrimary}>Get Started</Link>
          </div>
        </div>
        <div style={s.heroVisual}>
          <div style={s.visualCard}>
            <div style={s.visualRow}>
              <div style={s.dot} />
              <span style={s.visualLabel}>Live Location Tracking</span>
            </div>
            <div style={s.visualRow}>
              <div style={{ ...s.dot, background: "#FB641B" }} />
              <span style={s.visualLabel}>Instant Punch In/Out</span>
            </div>
            <div style={s.visualRow}>
              <div style={{ ...s.dot, background: "#26a541" }} />
              <span style={s.visualLabel}>Attendance History</span>
            </div>
            <div style={s.visualDivider} />
            <div style={s.visualStat}>
              <span style={s.statNum}>100%</span>
              <span style={s.statLabel}>GPS Accuracy</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={s.features}>
        <div style={s.featuresGrid}>
          {[
            { icon: "📍", title: "GPS Punch-In", desc: "Mark attendance automatically based on your real-time location." },
            { icon: "📋", title: "Visit Tracking", desc: "Log every store visit with check-in and check-out timestamps." },
            { icon: "📊", title: "Attendance History", desc: "View your complete attendance log in a clean, sortable table." },
            { icon: "🔒", title: "Secure Access", desc: "Flipkart email-only registration with JWT-secured sessions." },
          ].map((f) => (
            <div key={f.title} style={s.featureCard}>
              <div style={s.featureIcon}>{f.icon}</div>
              <h3 style={s.featureTitle}>{f.title}</h3>
              <p style={s.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={s.footer}>
        <p>© 2024 TL Attendance · Powered by <strong>PREXO</strong></p>
      </footer>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", display: "flex", flexDirection: "column", background: "#F1F3F6" },

  header: { background: "#2874F0", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" },
  headerInner: { maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" },
  brand: { display: "flex", alignItems: "center", gap: 10 },
  brandIcon: { width: 36, height: 36, borderRadius: 8, background: "#fff", color: "#2874F0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 },
  brandName: { color: "#fff", fontWeight: 700, fontSize: 18, letterSpacing: 0.3 },
  headerActions: { display: "flex", gap: 12 },
  btnOutline: { padding: "8px 20px", borderRadius: 4, border: "2px solid #fff", color: "#fff", fontWeight: 600, fontSize: 14, transition: "background 0.2s", background: "transparent" },
  btnPrimary: { padding: "8px 20px", borderRadius: 4, background: "#FB641B", color: "#fff", fontWeight: 600, fontSize: 14, transition: "background 0.2s" },

  hero: { position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #1a3a6e 0%, #2874F0 60%, #1565c0 100%)", padding: "80px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 60, flexWrap: "wrap", minHeight: 480 },
  heroBg: { position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 50%, rgba(255,255,255,0.06) 0%, transparent 60%)", pointerEvents: "none" },
  heroContent: { position: "relative", zIndex: 1, maxWidth: 520, textAlign: "left" },
  badge: { display: "inline-block", background: "rgba(255,255,255,0.15)", color: "#fff", padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, marginBottom: 20, letterSpacing: 0.5, backdropFilter: "blur(4px)" },
  heroTitle: { fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 700, color: "#fff", lineHeight: 1.15, marginBottom: 20 },
  heroSubtitle: { fontSize: 16, color: "rgba(255,255,255,0.82)", lineHeight: 1.7, marginBottom: 36 },
  heroCta: { display: "flex", gap: 16, flexWrap: "wrap" },
  ctaPrimary: { padding: "14px 32px", background: "#FB641B", color: "#fff", borderRadius: 4, fontWeight: 700, fontSize: 15, boxShadow: "0 4px 16px rgba(251,100,27,0.4)", transition: "background 0.2s, transform 0.1s" },
  ctaSecondary: { padding: "14px 32px", background: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 4, fontWeight: 600, fontSize: 15, border: "2px solid rgba(255,255,255,0.4)", backdropFilter: "blur(4px)" },

  heroVisual: { position: "relative", zIndex: 1 },
  visualCard: { background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 16, padding: "28px 32px", minWidth: 240 },
  visualRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  dot: { width: 10, height: 10, borderRadius: "50%", background: "#2874F0", flexShrink: 0 },
  visualLabel: { color: "#fff", fontSize: 14, fontWeight: 500 },
  visualDivider: { height: 1, background: "rgba(255,255,255,0.2)", margin: "16px 0" },
  visualStat: { textAlign: "center" },
  statNum: { display: "block", fontSize: 32, fontWeight: 700, color: "#fff" },
  statLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 500 },

  features: { maxWidth: 1100, margin: "0 auto", padding: "64px 24px" },
  featuresGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 },
  featureCard: { background: "#fff", borderRadius: 12, padding: "28px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", transition: "box-shadow 0.2s, transform 0.2s", cursor: "default" },
  featureIcon: { fontSize: 32, marginBottom: 16 },
  featureTitle: { fontSize: 16, fontWeight: 700, color: "#212121", marginBottom: 8 },
  featureDesc: { fontSize: 14, color: "#666", lineHeight: 1.6 },

  footer: { marginTop: "auto", background: "#2874F0", color: "rgba(255,255,255,0.8)", textAlign: "center", padding: "20px 24px", fontSize: 13 },
};

export default Landing;
