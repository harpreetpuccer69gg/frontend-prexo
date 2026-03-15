import { useEffect, useState } from "react";
import api from "../services/api";

const CITIES = ["All", "NCR", "Kolkata", "Mumbai", "Bengaluru"];

const COLS = [
  { key: "date",             label: "Date" },
  { key: "userEmail",        label: "User Email" },
  { key: "punchIn",          label: "Punch IN" },
  { key: "punchOut",         label: "Punch OUT" },
  { key: "location",         label: "Location" },
  { key: "fixedSite",        label: "Fixed Site" },
  { key: "distance",         label: "Distance" },
  { key: "duration",         label: "Duration" },
  { key: "city",             label: "City" },
  { key: "storeName",        label: "Store Name" },
  { key: "tlName",           label: "TL Name" },
  { key: "tlNo",             label: "TL No." },
  { key: "reportingManager", label: "Reporting Manager" },
];

function AdminDashboard() {
  const [records, setRecords]       = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  const token = localStorage.getItem("token");

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/attendance/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(res.data);
      setFiltered(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // Re-filter whenever any filter changes
  useEffect(() => {
    let data = [...records];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(r =>
        r.userEmail?.toLowerCase().includes(q) ||
        r.tlName?.toLowerCase().includes(q) ||
        r.storeName?.toLowerCase().includes(q) ||
        r.reportingManager?.toLowerCase().includes(q)
      );
    }
    if (cityFilter !== "All") {
      data = data.filter(r => r.city === cityFilter);
    }
    if (dateFilter) {
      const [y, m, d] = dateFilter.split("-");
      const fmt = `${d}/${m}/${y}`;
      data = data.filter(r => r.date === fmt);
    }
    setFiltered(data);
  }, [search, cityFilter, dateFilter, records]);

  const todayStr    = new Date().toLocaleDateString("en-GB");
  const totalTLs    = [...new Set(records.map(r => r.userEmail))].length;
  const todayVisits = records.filter(r => r.date === todayStr).length;
  const activeNow   = records.filter(r => r.punchOut === "-").length;

  const clearFilters = () => { setSearch(""); setCityFilter("All"); setDateFilter(""); };
  const hasFilter    = search || cityFilter !== "All" || dateFilter;

  return (
    <div style={s.page}>

      {/* ── Navbar ── */}
      <header style={s.navbar}>
        <div style={s.navInner}>
          <div style={s.navBrand}>
            <div style={s.navIcon}>A</div>
            <div>
              <span style={s.navTitle}>Admin Dashboard</span>
              <span style={s.navSub}>PREXO · TL Attendance System</span>
            </div>
          </div>
          <div style={s.navRight}>
            <span style={s.adminBadge}>🔐 Admin</span>
            <button
              style={s.logoutBtn}
              onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main style={s.main}>

        {/* ── Stats ── */}
        <div style={s.statsRow}>
          {[
            { label: "Total Records",  value: records.length, icon: "📋", color: "#2874F0", bg: "#e8f0fe" },
            { label: "Active TLs",     value: totalTLs,       icon: "👥", color: "#26a541", bg: "#e8f5e9" },
            { label: "Today's Visits", value: todayVisits,    icon: "📅", color: "#FB641B", bg: "#fff3e0" },
            { label: "Currently In",   value: activeNow,      icon: "📍", color: "#6d28d9", bg: "#f3e8ff" },
          ].map(st => (
            <div key={st.label} style={{ ...s.statCard, borderTop: `3px solid ${st.color}` }}>
              <div style={{ ...s.statIcon, background: st.bg }}>{st.icon}</div>
              <div>
                <div style={{ ...s.statVal, color: st.color }}>{st.value}</div>
                <div style={s.statLbl}>{st.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div style={s.filterBar}>
          <input
            style={s.searchInput}
            placeholder="🔍  Search by email, TL name, store or manager..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select style={s.select} value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
            {CITIES.map(c => <option key={c} value={c}>{c === "All" ? "All Cities" : c}</option>)}
          </select>
          <input
            style={s.dateInput}
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            title="Filter by date"
          />
          {hasFilter && (
            <button style={s.clearBtn} onClick={clearFilters}>✕ Clear</button>
          )}
          <button style={s.refreshBtn} onClick={fetchAll}>↻ Refresh</button>
        </div>

        {/* ── Table Card ── */}
        <div style={s.tableCard}>
          <div style={s.tableTop}>
            <div>
              <h3 style={s.tableTitle}>Attendance Records</h3>
              <p style={s.tableSubtitle}>All TL punch-in/out data from the field</p>
            </div>
            <span style={s.tableCount}>{filtered.length} / {records.length} records</span>
          </div>

          {loading ? (
            <div style={s.centerMsg}>
              <div style={s.spinner} />
              <p style={s.msgTxt}>Loading attendance data...</p>
            </div>
          ) : error ? (
            <div style={s.centerMsg}>
              <p style={s.errTxt}>⚠️ {error}</p>
              <button style={s.retryBtn} onClick={fetchAll}>Retry</button>
            </div>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.thIdx}>#</th>
                    {COLS.map(c => <th key={c.key} style={s.th}>{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={COLS.length + 1} style={s.emptyCell}>
                        <div style={s.emptyState}>
                          <span style={{ fontSize: 40 }}>📭</span>
                          <p style={s.emptyTxt}>No records found</p>
                          <p style={s.emptyHint}>Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row, i) => (
                      <tr
                        key={i}
                        style={i % 2 === 0 ? s.trEven : s.trOdd}
                      >
                        <td style={s.tdIdx}>{i + 1}</td>

                        {/* Date */}
                        <td style={s.td}><span style={s.dateTxt}>{row.date}</span></td>

                        {/* User Email */}
                        <td style={s.td}>
                          <div style={s.emailCell}>
                            <div style={s.avatar}>{row.userEmail?.charAt(0).toUpperCase()}</div>
                            <span style={s.emailTxt}>{row.userEmail}</span>
                          </div>
                        </td>

                        {/* Punch IN */}
                        <td style={s.td}>
                          <span style={s.punchInTag}>{row.punchIn}</span>
                        </td>

                        {/* Punch OUT */}
                        <td style={s.td}>
                          {row.punchOut !== "-"
                            ? <span style={s.punchOutTag}>{row.punchOut}</span>
                            : <span style={s.dash}>—</span>}
                        </td>

                        {/* Location */}
                        <td style={s.td}>
                          <span style={s.coordTxt}>{row.location}</span>
                        </td>

                        {/* Fixed Site */}
                        <td style={s.td}>
                          <span style={s.coordTxt}>{row.fixedSite}</span>
                        </td>

                        {/* Distance */}
                        <td style={s.td}>
                          <span style={s.distBadge}>{row.distance}</span>
                        </td>

                        {/* Duration */}
                        <td style={s.td}>
                          {row.duration !== "-"
                            ? <span style={s.durBadge}>{row.duration}</span>
                            : <span style={s.dash}>—</span>}
                        </td>

                        {/* City */}
                        <td style={s.td}>
                          {row.city !== "-"
                            ? <span style={s.cityBadge}>{row.city}</span>
                            : <span style={s.dash}>—</span>}
                        </td>

                        {/* Store Name */}
                        <td style={s.td}>
                          <div style={s.storeCell}>
                            <span style={s.storeDot} />
                            <span>{row.storeName}</span>
                          </div>
                        </td>

                        {/* TL Name */}
                        <td style={s.td}>
                          <span style={s.tlName}>{row.tlName !== "-" ? row.tlName : <span style={s.dash}>—</span>}</span>
                        </td>

                        {/* TL No */}
                        <td style={s.td}>
                          {row.tlNo !== "-" ? row.tlNo : <span style={s.dash}>—</span>}
                        </td>

                        {/* Reporting Manager */}
                        <td style={s.td}>
                          {row.reportingManager !== "-"
                            ? <span style={s.managerTxt}>{row.reportingManager}</span>
                            : <span style={s.dash}>—</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#F1F3F6", display: "flex", flexDirection: "column", fontFamily: "'Segoe UI', system-ui, sans-serif" },

  /* navbar */
  navbar: { background: "#2874F0", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", position: "sticky", top: 0, zIndex: 100 },
  navInner: { padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" },
  navBrand: { display: "flex", alignItems: "center", gap: 12 },
  navIcon: { width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18 },
  navTitle: { color: "#fff", fontWeight: 700, fontSize: 17, display: "block" },
  navSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, display: "block" },
  navRight: { display: "flex", alignItems: "center", gap: 14 },
  adminBadge: { background: "rgba(255,255,255,0.15)", color: "#fff", padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  logoutBtn: { background: "rgba(255,255,255,0.15)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.35)", borderRadius: 6, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },

  /* main */
  main: { padding: "28px 28px 40px", flex: 1 },

  /* stats */
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16, marginBottom: 24 },
  statCard: { background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 14 },
  statIcon: { width: 46, height: 46, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 },
  statVal: { fontSize: 26, fontWeight: 800, lineHeight: 1 },
  statLbl: { fontSize: 12, color: "#878787", marginTop: 4, fontWeight: 500 },

  /* filters */
  filterBar: { display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" },
  searchInput: { flex: "1 1 260px", padding: "10px 16px", border: "1.5px solid #e0e0e0", borderRadius: 8, fontSize: 14, outline: "none", background: "#fff", fontFamily: "inherit" },
  select: { padding: "10px 14px", border: "1.5px solid #e0e0e0", borderRadius: 8, fontSize: 14, outline: "none", background: "#fff", cursor: "pointer", fontFamily: "inherit" },
  dateInput: { padding: "10px 12px", border: "1.5px solid #e0e0e0", borderRadius: 8, fontSize: 14, outline: "none", background: "#fff", fontFamily: "inherit" },
  clearBtn: { padding: "10px 16px", background: "#fdecea", color: "#c62828", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" },
  refreshBtn: { padding: "10px 18px", background: "#2874F0", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" },

  /* table card */
  tableCard: { background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" },
  tableTop: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #f0f0f0", flexWrap: "wrap", gap: 8 },
  tableTitle: { fontSize: 16, fontWeight: 700, color: "#212121", marginBottom: 2 },
  tableSubtitle: { fontSize: 12, color: "#aaa" },
  tableCount: { fontSize: 13, color: "#878787", background: "#F1F3F6", padding: "5px 14px", borderRadius: 20, fontWeight: 500 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 1500 },
  thIdx: { padding: "11px 12px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#bbb", background: "#fafafa", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" },
  th: { padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#878787", textTransform: "uppercase", letterSpacing: 0.5, background: "#fafafa", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" },
  tdIdx: { padding: "11px 12px", textAlign: "center", fontSize: 12, color: "#ccc", borderBottom: "1px solid #f5f5f5", verticalAlign: "middle" },
  td: { padding: "11px 14px", fontSize: 13, color: "#212121", borderBottom: "1px solid #f5f5f5", verticalAlign: "middle", whiteSpace: "nowrap" },
  trEven: { background: "#fff" },
  trOdd: { background: "#fafafa" },

  /* center states */
  centerMsg: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", gap: 12 },
  spinner: { width: 36, height: 36, border: "3px solid #e0e0e0", borderTop: "3px solid #2874F0", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  msgTxt: { fontSize: 14, color: "#878787" },
  errTxt: { fontSize: 15, color: "#c62828", fontWeight: 600 },
  retryBtn: { padding: "9px 22px", background: "#2874F0", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" },
  emptyCell: { padding: "56px 20px", textAlign: "center" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  emptyTxt: { fontSize: 15, fontWeight: 600, color: "#555" },
  emptyHint: { fontSize: 13, color: "#aaa" },

  /* cell styles */
  dateTxt: { fontWeight: 600, color: "#212121", fontSize: 13 },
  emailCell: { display: "flex", alignItems: "center", gap: 8 },
  avatar: { width: 28, height: 28, borderRadius: "50%", background: "#e8f0fe", color: "#2874F0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 },
  emailTxt: { fontSize: 13, color: "#212121" },
  punchInTag: { background: "#e8f5e9", color: "#2e7d32", padding: "3px 9px", borderRadius: 6, fontSize: 12, fontWeight: 600 },
  punchOutTag: { background: "#fdecea", color: "#c62828", padding: "3px 9px", borderRadius: 6, fontSize: 12, fontWeight: 600 },
  dash: { color: "#ccc", fontSize: 13 },
  coordTxt: { fontSize: 11, color: "#555", fontFamily: "monospace", maxWidth: 200, display: "inline-block", overflow: "hidden", textOverflow: "ellipsis" },
  distBadge: { background: "#e8f0fe", color: "#2874F0", padding: "3px 9px", borderRadius: 6, fontSize: 12, fontWeight: 600 },
  durBadge: { background: "#f3e8ff", color: "#6d28d9", padding: "3px 9px", borderRadius: 6, fontSize: 12, fontWeight: 600 },
  cityBadge: { background: "#e0f2fe", color: "#0369a1", padding: "3px 9px", borderRadius: 6, fontSize: 12, fontWeight: 700 },
  storeCell: { display: "flex", alignItems: "center", gap: 6 },
  storeDot: { width: 7, height: 7, borderRadius: "50%", background: "#2874F0", flexShrink: 0 },
  tlName: { fontWeight: 600, color: "#212121" },
  managerTxt: { color: "#555", fontWeight: 500 },
};

export default AdminDashboard;
