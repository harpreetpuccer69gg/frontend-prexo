import { useEffect, useState, useRef } from "react";
import api from "../Services/api";

const IDLE_TIMEOUT = 8 * 60 * 60 * 1000;

/* ── Toast ── */
function Toast({ toasts, remove }) {
  return (
    <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, width: "90%", maxWidth: 360 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: t.type === "success" ? "#2e7d32" : "#c62828", color: "#fff", padding: "12px 16px", borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: 10, animation: "slideIn 0.3s ease" }}>
          <span>{t.type === "success" ? "✅" : "❌"}</span>
          <span style={{ flex: 1 }}>{t.msg}</span>
          <span style={{ cursor: "pointer", fontSize: 16 }} onClick={() => remove(t.id)}>✕</span>
        </div>
      ))}
    </div>
  );
}

function Dashboard() {
  const [activeTab, setActiveTab]     = useState("home");
  const [attendance, setAttendance]   = useState([]);
  const [loading, setLoading]         = useState(false);
  const [userProfile, setUserProfile] = useState({ name: "", city: "" });
  const [clock, setClock]             = useState(new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const clockStr = clock.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr2 = clock.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "short", year: "numeric" });

  // Leave state
  const [leaves, setLeaves]               = useState([]);
  const [todayLeave, setTodayLeave]       = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingLeaveType, setPendingLeaveType] = useState("");
  const [leaveReason, setLeaveReason]     = useState("");
  const [leaveLoading, setLeaveLoading]   = useState(false);

  // Toast
  const [toasts, setToasts] = useState([]);
  const addToast = (msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };
  const removeToast = (id) => setToasts(p => p.filter(t => t.id !== id));

  const todayStr = new Date().toLocaleDateString("en-GB");

  const fetchAttendance = async () => {
    const token = localStorage.getItem("token");
    const res = await api.get("/attendance/my-attendance", { headers: { Authorization: `Bearer ${token}` } });
    setAttendance(res.data);
  };

  const fetchUserProfile = async () => {
    const token = localStorage.getItem("token");
    const res = await api.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
    setUserProfile({ name: res.data.name || "", city: res.data.city || "" });
  };

  const fetchLeaves = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/attendance/my-leaves", { headers: { Authorization: `Bearer ${token}` } });
      setLeaves(res.data);
      const found = res.data.find(l => l.date === todayStr);
      setTodayLeave(found || null);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchUserProfile(); fetchAttendance(); fetchLeaves(); }, []);

  const handlePunchIn = () => {
    if (!navigator.geolocation) { addToast("Geolocation not supported", "error"); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.post("/attendance/punchin", { latitude: pos.coords.latitude, longitude: pos.coords.longitude }, { headers: { Authorization: `Bearer ${token}` } });
        addToast(`✅ ${res.data.message} — ${res.data.store}`, "success");
        await fetchAttendance();
      } catch (err) {
        addToast(err.response?.data?.message || "Punch-in failed", "error");
      }
      setLoading(false);
    }, () => { addToast("Location access denied", "error"); setLoading(false); });
  };

  const handlePunchOut = () => {
    if (!navigator.geolocation) { addToast("Geolocation not supported", "error"); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.post("/attendance/punchout", { latitude: pos.coords.latitude, longitude: pos.coords.longitude }, { headers: { Authorization: `Bearer ${token}` } });
        addToast(`✅ ${res.data.message} — ${res.data.store}`, "success");
        await fetchAttendance();
      } catch (err) {
        addToast(err.response?.data?.message || "Punch-out failed", "error");
      }
      setLoading(false);
    }, () => { addToast("Location access denied", "error"); setLoading(false); });
  };

  const handleApplyLeave = async () => {
    if (!pendingLeaveType) return;
    setLeaveLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post("/attendance/apply-leave", { leaveType: pendingLeaveType, reason: leaveReason }, { headers: { Authorization: `Bearer ${token}` } });
      addToast(res.data.message, "success");
      await fetchLeaves();
      setShowLeaveModal(false);
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to apply", "error");
    }
    setLeaveLoading(false);
  };

  const getTimeSpent = (checkIn, checkOut) => {
    if (!checkOut) return null;
    const mins = Math.round((new Date(checkOut) - new Date(checkIn)) / 60000);
    const h = Math.floor(mins / 60), m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const todayAttendance = attendance.filter(a => new Date(a.checkInTime).toLocaleDateString("en-GB") === todayStr);
  const openPunch = attendance.find(a => !a.checkOutTime);

  const idleTimer = useRef(null);
  const resetIdleTimer = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => { localStorage.removeItem("token"); window.location.href = "/login"; }, IDLE_TIMEOUT);
  };
  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    events.forEach(e => window.addEventListener(e, resetIdleTimer));
    resetIdleTimer();
    return () => { events.forEach(e => window.removeEventListener(e, resetIdleTimer)); if (idleTimer.current) clearTimeout(idleTimer.current); };
  }, []);

  const handleLogout = async () => {
    try { await api.post("/auth/logout"); } catch (err) { console.error(err); }
    finally { localStorage.removeItem("token"); window.location.href = "/login"; }
  };

  return (
    <div style={m.app}>
      <Toast toasts={toasts} remove={removeToast} />

      {/* Leave Modal */}
      {showLeaveModal && (
        <div style={m.overlay}>
          <div style={m.modal}>
            <div style={m.modalIcon}>{pendingLeaveType === "leave" ? "🏖️" : "📅"}</div>
            <h3 style={m.modalTitle}>{pendingLeaveType === "leave" ? "Apply Leave" : "Mark Week Off"}</h3>
            <p style={m.modalDate}>{todayStr}</p>
            <textarea style={m.textarea} placeholder="Reason (optional)" value={leaveReason} onChange={e => setLeaveReason(e.target.value)} rows={3} />
            <div style={m.modalBtns}>
              <button style={m.cancelBtn} onClick={() => setShowLeaveModal(false)}>Cancel</button>
              <button style={{ ...m.confirmBtn, background: pendingLeaveType === "leave" ? "#FFA000" : "#546E7A" }} onClick={handleApplyLeave} disabled={leaveLoading}>
                {leaveLoading ? "Submitting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={m.header}>
        <div style={m.headerLeft}>
          <div style={m.avatar}>{userProfile.name?.charAt(0)?.toUpperCase() || "T"}</div>
          <div>
            <div style={m.greeting}>Hello, {userProfile.name || "TL"} 👋</div>
            {userProfile.city && <div style={m.city}>📍 {userProfile.city}</div>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 22, letterSpacing: 1 }}>{clockStr}</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 }}>{dateStr2}</div>
          <button style={m.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Content */}
      <div style={m.content}>

        {/* HOME TAB */}
        {activeTab === "home" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>

            {/* Today Leave Banner */}
            {todayLeave && (
              <div style={{ ...m.banner, background: todayLeave.leaveType === "leave" ? "#fff8e1" : "#f3f3f3", borderColor: todayLeave.leaveType === "leave" ? "#ffe082" : "#bdbdbd" }}>
                <span style={{ fontSize: 22 }}>{todayLeave.leaveType === "leave" ? "🏖️" : "📅"}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{todayLeave.leaveType === "leave" ? "On Leave Today" : "Week Off Today"}</div>
                  {todayLeave.reason && <div style={{ fontSize: 12, color: "#888" }}>{todayLeave.reason}</div>}
                </div>
              </div>
            )}

            {/* Live Status Badge */}
            <div style={{ ...m.statusBadge, background: openPunch ? "#e8f5e9" : todayLeave ? "#fff8e1" : "#f5f5f5", borderColor: openPunch ? "#2e7d32" : todayLeave ? "#FFA000" : "#e0e0e0" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: openPunch ? "#2e7d32" : todayLeave ? "#FFA000" : "#bdbdbd", boxShadow: openPunch ? "0 0 0 3px rgba(46,125,50,0.2)" : "none", animation: openPunch ? "pulse 1.5s infinite" : "none" }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: openPunch ? "#2e7d32" : todayLeave ? "#e65100" : "#555" }}>
                  {openPunch ? `Currently at ${openPunch.storeName}` : todayLeave ? (todayLeave.leaveType === "leave" ? "On Leave Today" : "Week Off Today") : "Not Checked In"}
                </div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
                  {openPunch ? `Since ${new Date(openPunch.checkInTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : todayLeave ? todayLeave.reason || "" : "Tap Punch In to start"}
                </div>
              </div>
            </div>

            {/* Today Summary Card */}
            <div style={m.summaryCard}>
              <div style={m.summaryTitle}>📊 Today's Summary</div>
              <div style={m.summaryGrid}>
                <div style={m.summaryItem}>
                  <div style={m.summaryVal}>{todayAttendance.length}</div>
                  <div style={m.summaryLbl}>Stores Visited</div>
                </div>
                <div style={m.summaryItem}>
                  <div style={{ ...m.summaryVal, color: todayAttendance.length >= 2 ? "#2e7d32" : "#c62828" }}>
                    {todayAttendance.length >= 2 ? "✅" : "⚠️"}
                  </div>
                  <div style={m.summaryLbl}>{todayAttendance.length >= 2 ? "Target Met" : "Target Pending"}</div>
                </div>
                <div style={m.summaryItem}>
                  <div style={m.summaryVal}>
                    {todayAttendance.filter(a => a.checkOutTime).reduce((total, a) => {
                      return total + Math.round((new Date(a.checkOutTime) - new Date(a.checkInTime)) / 60000);
                    }, 0)}m
                  </div>
                  <div style={m.summaryLbl}>Total Time</div>
                </div>
                <div style={m.summaryItem}>
                  <div style={{ ...m.summaryVal, color: openPunch ? "#e65100" : "#878787" }}>
                    {openPunch ? "Active" : "—"}
                  </div>
                  <div style={m.summaryLbl}>Current Status</div>
                </div>
              </div>
              {/* Progress Bar */}
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#878787", marginBottom: 4 }}>
                  <span>Daily Target: 2 Stores</span>
                  <span>{Math.min(todayAttendance.length, 2)}/2</span>
                </div>
                <div style={{ background: "#f0f0f0", borderRadius: 8, height: 8, overflow: "hidden" }}>
                  <div style={{ width: Math.min((todayAttendance.length / 2) * 100, 100) + "%", background: todayAttendance.length >= 2 ? "#2e7d32" : "#2874F0", height: "100%", borderRadius: 8, transition: "width 0.6s ease" }} />
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div style={m.statsRow}>
              <div style={{ ...m.statCard, borderTop: "3px solid #2874F0" }}>
                <div style={m.statIcon}>🏪</div>
                <div style={m.statNum}>{todayAttendance.length}</div>
                <div style={m.statLabel}>Today's Visits</div>
              </div>
              <div style={{ ...m.statCard, borderTop: `3px solid ${openPunch ? "#e65100" : "#2e7d32"}` }}>
                <div style={m.statIcon}>{openPunch ? "⚡" : "✅"}</div>
                <div style={{ ...m.statNum, color: openPunch ? "#e65100" : "#2e7d32" }}>{openPunch ? "Active" : "Clear"}</div>
                <div style={m.statLabel}>Status</div>
              </div>
              <div style={{ ...m.statCard, borderTop: "3px solid #6d28d9" }}>
                <div style={m.statIcon}>📍</div>
                <div style={{ ...m.statNum, color: "#6d28d9" }}>{attendance.length}</div>
                <div style={m.statLabel}>Total Visits</div>
              </div>
            </div>

            {/* Punch Buttons */}
            <div style={m.punchRow}>
              <button style={m.punchInBtn} onClick={handlePunchIn} disabled={loading}>
                <div style={m.punchCircle}>
                  <span style={{ fontSize: 36 }}>🟢</span>
                </div>
                <span style={m.punchLabel}>{loading ? "Detecting..." : "Punch In"}</span>
                <span style={m.punchSub}>Mark store arrival</span>
              </button>
              <button style={m.punchOutBtn} onClick={handlePunchOut} disabled={loading}>
                <div style={{ ...m.punchCircle, background: "rgba(255,255,255,0.15)", boxShadow: "0 0 0 8px rgba(255,255,255,0.08)" }}>
                  <span style={{ fontSize: 36 }}>🔴</span>
                </div>
                <span style={m.punchLabel}>{loading ? "Detecting..." : "Punch Out"}</span>
                <span style={m.punchSub}>Mark store departure</span>
              </button>
            </div>

            {/* Leave / Weekoff */}
            {!todayLeave ? (
              <div style={m.leaveRow}>
                <button style={m.leaveBtn} onClick={() => { setPendingLeaveType("leave"); setLeaveReason(""); setShowLeaveModal(true); }}>
                  🏖️ Apply Leave
                </button>
                <button style={m.weekoffBtn} onClick={() => { setPendingLeaveType("weekoff"); setLeaveReason(""); setShowLeaveModal(true); }}>
                  📅 Week Off
                </button>
              </div>
            ) : (
              <div style={m.alreadyMarked}>
                ✅ {todayLeave.leaveType === "leave" ? "Leave Applied" : "Week Off Marked"} for today
              </div>
            )}

            {/* Open Punch Warning */}
            {openPunch && (
              <div style={m.openPunchCard}>
                <div style={{ fontSize: 20 }}>⚠️</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Open Punch-In</div>
                  <div style={{ fontSize: 12, color: "#888" }}>{openPunch.storeName} · {new Date(openPunch.checkInTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={m.sectionTitle}>Attendance History</div>
            {attendance.length === 0 ? (
              <div style={m.empty}><span style={{ fontSize: 48 }}>📋</span><p>No records yet</p><p style={{ fontSize: 13, color: "#aaa" }}>Punch in at a store to get started</p></div>
            ) : (
              <div style={m.timeline}>
                {attendance.map((a, i) => (
                  <div key={i} style={m.timelineItem}>
                    {/* Line */}
                    <div style={m.timelineLine}>
                      <div style={{ ...m.timelineDot, background: a.checkOutTime ? "#2e7d32" : "#e65100" }} />
                      {i < attendance.length - 1 && <div style={m.timelineConnector} />}
                    </div>
                    {/* Card */}
                    <div style={m.timelineCard}>
                      <div style={m.timelineTop}>
                        <div style={m.timelineStore}>{a.storeName}</div>
                        <span style={a.checkOutTime ? m.completedBadge : m.activeBadge}>
                          {a.checkOutTime ? "Done" : "Active"}
                        </span>
                      </div>
                      <div style={m.timelineDate}>
                        📅 {new Date(a.checkInTime).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                      <div style={m.timelineRow}>
                        <div style={m.timelineTime}>
                          <span style={m.punchInDot} />
                          <span>In: {new Date(a.checkInTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        {a.checkOutTime && (
                          <div style={m.timelineTime}>
                            <span style={m.punchOutDot} />
                            <span>Out: {new Date(a.checkOutTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        )}
                        {getTimeSpent(a.checkInTime, a.checkOutTime) && (
                          <div style={m.timelineDuration}>
                            ⏱ {getTimeSpent(a.checkInTime, a.checkOutTime)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LEAVE TAB */}
        {activeTab === "leave" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={m.sectionTitle}>Leave History</div>
            {leaves.length === 0 ? (
              <div style={m.empty}><span style={{ fontSize: 48 }}>🏖️</span><p>No leave records</p></div>
            ) : (
              leaves.map((l, i) => (
                <div key={i} style={m.historyCard}>
                  <div style={m.historyTop}>
                    <span style={l.leaveType === "leave" ? m.leaveTag : m.weekoffTag}>
                      {l.leaveType === "leave" ? "🏖️ Leave" : "📅 Week Off"}
                    </span>
                    <span style={m.dateTag}>{l.date}</span>
                  </div>
                  {l.reason && <div style={{ fontSize: 13, color: "#666", marginTop: 6 }}>{l.reason}</div>}
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>Applied: {new Date(l.appliedAt).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* Bottom Navigation */}
      <div style={m.bottomNav}>
        {[
          { key: "home",    icon: "🏠", label: "Home" },
          { key: "history", icon: "📋", label: "History" },
          { key: "leave",   icon: "🏖️", label: "Leave" },
        ].map(tab => (
          <button key={tab.key} style={{ ...m.navBtn, ...(activeTab === tab.key ? m.navBtnActive : {}) }} onClick={() => setActiveTab(tab.key)}>
            <span style={m.navIcon}>{tab.icon}</span>
            <span style={{ ...m.navLabel, ...(activeTab === tab.key ? { color: "#2874F0" } : {}) }}>{tab.label}</span>
            {activeTab === tab.key && <div style={m.navIndicator} />}
          </button>
        ))}
      </div>
    </div>
  );
}

const m = {
  app:     { minHeight: "100vh", background: "#F1F3F6", display: "flex", flexDirection: "column", fontFamily: "'Segoe UI', system-ui, sans-serif", maxWidth: 480, margin: "0 auto", position: "relative" },
  header:  { background: "linear-gradient(135deg, #1a3a6e 0%, #2874F0 100%)", padding: "20px 20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  avatar:  { width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.25)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 20, flexShrink: 0, border: "2px solid rgba(255,255,255,0.4)" },
  greeting:{ color: "#fff", fontWeight: 700, fontSize: 15 },
  city:    { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },
  logoutBtn: { background: "rgba(255,255,255,0.15)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", marginTop: 6 },

  content: { flex: 1, padding: "16px 16px 90px", overflowY: "auto" },

  banner:  { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, border: "1.5px solid", marginBottom: 16 },

  statusBadge: { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, border: "1.5px solid", marginBottom: 14, background: "#f5f5f5" },

  summaryCard:  { background: "#fff", borderRadius: 16, padding: "16px", marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  summaryTitle: { fontSize: 14, fontWeight: 700, color: "#212121", marginBottom: 12 },
  summaryGrid:  { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 4 },
  summaryItem:  { textAlign: "center" },
  summaryVal:   { fontSize: 18, fontWeight: 800, color: "#2874F0" },
  summaryLbl:   { fontSize: 10, color: "#878787", marginTop: 2, fontWeight: 500 },

  statsRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 },
  statCard: { background: "#fff", borderRadius: 12, padding: "14px 10px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statNum:  { fontSize: 20, fontWeight: 800, color: "#2874F0" },
  statLabel:{ fontSize: 10, color: "#878787", marginTop: 2, fontWeight: 500 },

  punchRow:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 },
  punchInBtn: { background: "linear-gradient(145deg, #1a5dc8, #2874F0)", color: "#fff", border: "none", borderRadius: 20, padding: "24px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, cursor: "pointer", boxShadow: "0 8px 24px rgba(40,116,240,0.45)", transition: "transform 0.15s, box-shadow 0.15s" },
  punchOutBtn:{ background: "linear-gradient(145deg, #c84b00, #FB641B)", color: "#fff", border: "none", borderRadius: 20, padding: "24px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, cursor: "pointer", boxShadow: "0 8px 24px rgba(251,100,27,0.45)", transition: "transform 0.15s, box-shadow 0.15s" },
  punchCircle: { width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 8px rgba(255,255,255,0.08)", marginBottom: 4 },
  punchLabel: { fontSize: 16, fontWeight: 800, letterSpacing: 0.5 },
  punchSub:   { fontSize: 11, opacity: 0.8 },

  leaveRow:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 },
  leaveBtn:    { background: "#fff", border: "2px solid #FFA000", color: "#FFA000", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  weekoffBtn:  { background: "#fff", border: "2px solid #546E7A", color: "#546E7A", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  alreadyMarked: { background: "#e8f5e9", color: "#2e7d32", borderRadius: 12, padding: "12px 16px", fontSize: 14, fontWeight: 600, textAlign: "center", marginBottom: 14 },

  openPunchCard: { background: "#fff3e0", border: "1.5px solid #ffcc80", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 14 },

  timeline:          { display: "flex", flexDirection: "column", gap: 0 },
  timelineItem:       { display: "flex", gap: 12 },
  timelineLine:       { display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0, paddingTop: 4 },
  timelineDot:        { width: 14, height: 14, borderRadius: "50%", flexShrink: 0, border: "2px solid #fff", boxShadow: "0 0 0 2px #e0e0e0" },
  timelineConnector:  { width: 2, flex: 1, background: "#e0e0e0", margin: "4px 0", minHeight: 20 },
  timelineCard:       { background: "#fff", borderRadius: 12, padding: "12px 14px", marginBottom: 12, flex: 1, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  timelineTop:        { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  timelineStore:      { fontWeight: 700, fontSize: 14, color: "#212121" },
  timelineDate:       { fontSize: 11, color: "#878787", marginBottom: 8 },
  timelineRow:        { display: "flex", flexWrap: "wrap", gap: 10 },
  timelineTime:       { display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#555" },
  timelineDuration:   { fontSize: 12, color: "#6d28d9", fontWeight: 600, background: "#f3e8ff", padding: "2px 8px", borderRadius: 20 },
  punchInDot:         { width: 8, height: 8, borderRadius: "50%", background: "#2e7d32", flexShrink: 0 },
  punchOutDot:        { width: 8, height: 8, borderRadius: "50%", background: "#c62828", flexShrink: 0 },

  sectionTitle: { fontSize: 16, fontWeight: 700, color: "#212121", marginBottom: 12 },

  historyCard: { background: "#fff", borderRadius: 12, padding: "14px 16px", marginBottom: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  historyTop:  { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  storeName:   { display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 14, color: "#212121" },
  storeDot:    { width: 8, height: 8, borderRadius: "50%", background: "#2874F0", flexShrink: 0 },
  historyMeta: { display: "flex", flexWrap: "wrap", gap: 10, fontSize: 12, color: "#666" },
  completedBadge: { background: "#e8f5e9", color: "#2e7d32", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  activeBadge:    { background: "#fff3e0", color: "#e65100", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  leaveTag:    { background: "#fff8e1", color: "#F57F17", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700 },
  weekoffTag:  { background: "#f3f3f3", color: "#546E7A", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700 },
  dateTag:     { fontSize: 13, color: "#878787", fontWeight: 500 },

  empty: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "48px 20px", color: "#555", fontWeight: 600, fontSize: 15 },

  bottomNav:   { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#fff", borderTop: "1px solid #e0e0e0", display: "flex", zIndex: 100, boxShadow: "0 -4px 16px rgba(0,0,0,0.08)" },
  navBtn:      { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 0 8px", background: "none", border: "none", cursor: "pointer", position: "relative", gap: 3 },
  navBtnActive:{ background: "#f0f5ff" },
  navIcon:     { fontSize: 22 },
  navLabel:    { fontSize: 11, color: "#878787", fontWeight: 500 },
  navIndicator:{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 32, height: 3, background: "#2874F0", borderRadius: "0 0 4px 4px" },

  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 9998 },
  modal:   { background: "#fff", borderRadius: "20px 20px 0 0", padding: "28px 24px 36px", width: "100%", maxWidth: 480 },
  modalIcon:  { fontSize: 36, textAlign: "center", marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: 700, color: "#212121", textAlign: "center", marginBottom: 4 },
  modalDate:  { fontSize: 13, color: "#878787", textAlign: "center", marginBottom: 16 },
  textarea:   { width: "100%", padding: "12px", border: "1.5px solid #e0e0e0", borderRadius: 10, fontSize: 14, resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 16 },
  modalBtns:  { display: "flex", gap: 10 },
  cancelBtn:  { flex: 1, padding: "13px", background: "#f5f5f5", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  confirmBtn: { flex: 1, padding: "13px", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" },
};

export default Dashboard;
