import { useEffect, useState } from "react";
import api from "../Services/api";

const CITIES = ["All", "NCR", "Kolkata", "Mumbai", "Bengaluru", "Hyderabad"];

const COLS = [
  { key: "date",             label: "Date" },
  { key: "tlName",           label: "TL Name" },
  { key: "userEmail",        label: "User Email" },
  { key: "punchIn",          label: "Punch IN" },
  { key: "punchOut",         label: "Punch OUT" },
  { key: "duration",         label: "Duration" },
  { key: "city",             label: "City" },
  { key: "storeName",        label: "Store Name" },
  { key: "reportingManager", label: "Reporting Manager" },
];

const toCSV = (data) => {
  const headers = ["Date","Email","Punch In","Punch Out","Duration","City","Store Name","TL Name","Reporting Manager"];
  const rows = data.map(r => [
    r.date, r.userEmail, r.punchIn, r.punchOut,
    r.duration, r.city, r.storeName, r.tlName, r.reportingManager
  ].map(v => `"${(v ?? "").toString().replace(/"/g, '""')}"`));
  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
};

const downloadCSV = (data, filename) => {
  const blob = new Blob([toCSV(data)], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

function AdminDashboard() {
  const [records, setRecords]       = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  const [activeTab, setActiveTab] = useState("attendance");

  // Leaves state
  const [leaves, setLeaves]               = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [leavesError, setLeavesError]     = useState("");
  const [leaveSearch, setLeaveSearch]     = useState("");
  const [leaveDateFilter, setLeaveDateFilter] = useState("");

  const token = localStorage.getItem("token");

  /* ── Fetch attendance (unchanged) ── */
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

  /* ── Fetch leaves ── */
  const fetchLeaves = async () => {
    setLeavesLoading(true);
    setLeavesError("");
    try {
      const res = await api.get("/attendance/admin/leaves", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaves(res.data);
    } catch (err) {
      setLeavesError(err.response?.data?.message || "Failed to load leaves");
    }
    setLeavesLoading(false);
  };

  useEffect(() => { fetchAll(); fetchLeaves(); }, []);

  /* ── Attendance filter ── */
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

  /* ── Leaves filter ── */
  const filteredLeaves = leaves.filter(l => {
    const q = leaveSearch.toLowerCase();
    const matchSearch = !q ||
      l.tlEmail?.toLowerCase().includes(q) ||
      l.tlName?.toLowerCase().includes(q) ||
      l.reportingManager?.toLowerCase().includes(q);
    const matchCity = cityFilter === "All" || l.city === cityFilter;
    let matchDate = true;
    if (leaveDateFilter) {
      const [y, m, d] = leaveDateFilter.split("-");
      matchDate = l.date === `${d}/${m}/${y}`;
    }
    return matchSearch && matchCity && matchDate;
  });

  // D-0 resets at 7:00 AM — before 7AM show yesterday, after 7AM show today
  const now             = new Date();
  const statDate        = now.getHours() < 7 ? new Date(now - 86400000) : now;
  const todayStr        = statDate.toLocaleDateString("en-GB"); // DD/MM/YYYY

  const statsRecords    = cityFilter === "All" ? records : records.filter(r => r.city === cityFilter);
  const statsLeaves     = cityFilter === "All" ? leaves  : leaves.filter(l => l.city === cityFilter);

  const todayRecords    = statsRecords.filter(r => r.date === todayStr);
  const todayLeaveCount = statsLeaves.filter(l => l.date === todayStr).length;

  // Total Records = raw count (all today punch-ins + today leaves)
  const totalRecords    = todayRecords.length + todayLeaveCount;
  // Active TLs = unique TLs currently in field (punched in today, NOT punched out)
  const totalTLs        = [...new Set(todayRecords.filter(r => !r.punchOut || r.punchOut === "-").map(r => r.userEmail))].length;
  // Today Visits = total store visits (each punch-in = 1 visit)
  const todayVisits     = todayRecords.length;
  // Currently In = total open punch-ins today (store visits still open, no punchout)
  const activeNow       = todayRecords.filter(r => !r.punchOut || r.punchOut === "-").length;

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record? This cannot be undone.")) return;
    try {
      await api.delete(`/attendance/admin/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setRecords(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete record");
    }
  };

  const handleDeleteLeave = async (id) => {
    if (!window.confirm("Are you sure you want to delete this leave record? This cannot be undone.")) return;
    try {
      await api.delete(`/attendance/admin/leave/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setLeaves(prev => prev.filter(l => l._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete leave record");
    }
  };

  const to12hr = (t) => {
    if (!t || t === "-") return t;
    const [hStr, mStr] = t.split(":");
    const h = parseInt(hStr, 10);
    if (isNaN(h)) return t;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12  = h % 12 || 12;
    return `${h12}:${mStr} ${ampm}`;
  };

  const clearFilters = () => { setSearch(""); setCityFilter("All"); setDateFilter(""); };
  const hasFilter    = search || cityFilter !== "All" || dateFilter;

  return (
    <div style={s.page}>

      {/* ── Top Bar ── */}
      <header style={s.navbar}>
        <div style={s.navInner} className="nav-inner">
          <div style={s.navLeft}>
            <h2 style={s.navTitle}>Attendance Overview</h2>
            <span style={s.navSub}>{todayStr} · Live Insights</span>
          </div>
          <div style={s.navRight}>
            <span style={s.adminBadge}>🔐 Admin Access</span>
          </div>
        </div>
      </header>

      <main style={s.main} className="main-content">

        {/* ── Unified Filter Bar ── */}
        <div style={s.filterBar}>
          <input
            style={s.searchInput}
            placeholder="🔍  Search by email, TL name, store or manager..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select style={s.select} value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
            {CITIES.map(c => <option key={c} value={c}>{c === "All" ? "🇮🇳 All Cities" : `📍 ${c}`}</option>)}
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
          <button style={s.refreshBtn} onClick={() => { fetchAll(); fetchLeaves(); }}>↻ Refresh</button>
        </div>

        {/* ── Stats ── */}
        <div style={s.statsHeaderRow}>
          <span style={s.statsLabel}>Live Stats</span>
          <span style={s.d0Badge}>D-0 · Today</span>
        </div>
        <div style={s.statsRow} className="stats-row">
          {[
            { label: "Total Records",    value: totalRecords,    icon: "📋", color: "#2874F0", bg: "#e8f0fe" },
            { label: "Active TLs",       value: totalTLs,        icon: "👥", color: "#26a541", bg: "#e8f5e9" },
            { label: "Today's Visits",   value: todayVisits,     icon: "📅", color: "#FB641B", bg: "#fff3e0" },
            { label: "Currently In",     value: activeNow,       icon: "📍", color: "#6d28d9", bg: "#f3e8ff" },
            { label: "Today's Absences", value: todayLeaveCount, icon: "🏖️", color: "#F57F17", bg: "#fff8e1" },
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

        {/* ── Tabs ── */}
        <div style={s.tabBar}>
          <button
            style={activeTab === "attendance" ? s.tabActive : s.tabInactive}
            onClick={() => setActiveTab("attendance")}
          >
            📋 Attendance
          </button>
          <button
            style={activeTab === "leaves" ? s.tabActive : s.tabInactive}
            onClick={() => setActiveTab("leaves")}
          >
            🏖️ Leaves & Week Offs
            {todayLeaveCount > 0 && <span style={s.tabBadge}>{todayLeaveCount}</span>}
          </button>
        </div>

        {/* ── Attendance Tab ── */}
        {activeTab === "attendance" && (
          <>

            {/* ── Table Card ── */}
            <div style={s.tableCard}>
              <div style={s.tableTop}>
                <div>
                  <h3 style={s.tableTitle}>Attendance Records</h3>
                  <p style={s.tableSubtitle}>All TL punch-in/out data from the field</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={s.tableCount}>{filtered.length} / {records.length} records</span>
                  <button style={s.exportBtn} onClick={() => downloadCSV(filtered, `attendance-filtered-${Date.now()}.csv`)}>⬇ Filtered</button>
                  <button style={s.exportBtn} onClick={() => downloadCSV(records, `attendance-all-${Date.now()}.csv`)}>⬇ All</button>
                </div>
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
                        <th style={s.th}>Action</th>
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
                          <tr key={i} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                            <td style={s.tdIdx}>{i + 1}</td>
                            <td style={s.td}><span style={s.dateTxt}>{row.date}</span></td>
                            <td style={s.td}>
                              <span style={s.tlName}>{row.tlName !== "-" ? row.tlName : <span style={s.dash}>—</span>}</span>
                            </td>
                            <td style={s.td}>
                              <div style={s.emailCell}>
                                <div style={s.avatar}>{row.userEmail?.charAt(0).toUpperCase()}</div>
                                <span style={s.emailTxt}>{row.userEmail}</span>
                              </div>
                            </td>
                            <td style={s.td}><span style={s.punchInTag}>{to12hr(row.punchIn)}</span></td>
                            <td style={s.td}>
                              {row.punchOut !== "-"
                                ? <span style={s.punchOutTag}>{to12hr(row.punchOut)}</span>
                                : <span style={s.dash}>—</span>}
                            </td>
                            <td style={s.td}>
                              {row.duration !== "-"
                                ? <span style={s.durBadge}>{row.duration}</span>
                                : <span style={s.dash}>—</span>}
                            </td>
                            <td style={s.td}>
                              {row.city !== "-"
                                ? <span style={s.cityBadge}>{row.city}</span>
                                : <span style={s.dash}>—</span>}
                            </td>
                            <td style={s.td}>
                              <div style={s.storeCell}>
                                <span style={s.storeDot} />
                                <span>{row.storeName}</span>
                              </div>
                            </td>
                            <td style={s.td}>
                              {row.reportingManager !== "-"
                                ? <span style={s.managerTxt}>{row.reportingManager}</span>
                                : <span style={s.dash}>—</span>}
                            </td>
                            <td style={s.td}>
                              <button style={s.deleteBtn} onClick={() => handleDelete(row._id)}>🗑️</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Leaves Tab ── */}
        {activeTab === "leaves" && (
          <div style={s.tableCard}>
            <div style={s.tableTop}>
              <div>
                <h3 style={s.tableTitle}>Leave & Week Off Records</h3>
                <p style={s.tableSubtitle}>All TL absence requests</p>
              </div>
              <span style={s.tableCount}>{filteredLeaves.length} / {leaves.length} records</span>
            </div>

            {/* Leaves Filters */}
            <div style={{ ...s.filterBar, padding: "12px 24px", marginBottom: 0, borderBottom: "1px solid #f0f0f0" }}>
              <input
                style={s.searchInput}
                placeholder="🔍  Search by email, TL name or manager..."
                value={leaveSearch}
                onChange={e => setLeaveSearch(e.target.value)}
              />
              <input
                style={s.dateInput}
                type="date"
                value={leaveDateFilter}
                onChange={e => setLeaveDateFilter(e.target.value)}
                title="Filter by date"
              />
              {(leaveSearch || leaveDateFilter) && (
                <button style={s.clearBtn} onClick={() => { setLeaveSearch(""); setLeaveDateFilter(""); }}>✕ Clear</button>
              )}
              {cityFilter !== "All" && (
                <span style={s.cityBadge}>📍 {cityFilter}</span>
              )}
            </div>

            {leavesLoading ? (
              <div style={s.centerMsg}><div style={s.spinner} /><p style={s.msgTxt}>Loading...</p></div>
            ) : leavesError ? (
              <div style={s.centerMsg}><p style={s.errTxt}>⚠️ {leavesError}</p><button style={s.retryBtn} onClick={fetchLeaves}>Retry</button></div>
            ) : (
              <div style={s.tableWrap}>
                <table style={{ ...s.table, minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th style={s.thIdx}>#</th>
                      <th style={s.th}>Date</th>
                      <th style={s.th}>Type</th>
                      <th style={s.th}>TL Email</th>
                      <th style={s.th}>TL Name</th>
                      <th style={s.th}>City</th>
                      <th style={s.th}>Phone</th>
                      <th style={s.th}>Reporting Manager</th>
                      <th style={s.th}>Reason</th>
                      <th style={s.th}>Applied At</th>
                      <th style={s.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaves.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={s.emptyCell}>
                          <div style={s.emptyState}>
                            <span style={{ fontSize: 40 }}>🏖️</span>
                            <p style={s.emptyTxt}>No leave records found</p>
                            <p style={s.emptyHint}>Try adjusting your filters</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredLeaves.map((l, i) => (
                        <tr key={l._id} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                          <td style={s.tdIdx}>{i + 1}</td>
                          <td style={s.td}><span style={s.dateTxt}>{l.date}</span></td>
                          <td style={s.td}>
                            <span style={l.leaveType === "leave" ? s.leaveTag : s.weekoffTag}>
                              {l.leaveType === "leave" ? "🏖️ Leave" : "📅 Week Off"}
                            </span>
                          </td>
                          <td style={s.td}>
                            <div style={s.emailCell}>
                              <div style={s.avatar}>{l.tlEmail?.charAt(0).toUpperCase()}</div>
                              <span style={s.emailTxt}>{l.tlEmail}</span>
                            </div>
                          </td>
                          <td style={s.td}><span style={s.tlName}>{l.tlName || <span style={s.dash}>—</span>}</span></td>
                          <td style={s.td}>{l.city ? <span style={s.cityBadge}>{l.city}</span> : <span style={s.dash}>—</span>}</td>
                          <td style={s.td}>{l.phone || <span style={s.dash}>—</span>}</td>
                          <td style={s.td}>{l.reportingManager || <span style={s.dash}>—</span>}</td>
                          <td style={s.td}>{l.reason || <span style={s.dash}>—</span>}</td>
                          <td style={s.td}>{new Date(l.appliedAt).toLocaleString()}</td>
                          <td style={s.td}>
                            <button style={s.deleteBtn} onClick={() => handleDeleteLeave(l._id)}>🗑️</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#F1F3F6", display: "flex", flexDirection: "column", fontFamily: "'Segoe UI', system-ui, sans-serif" },

  navbar: { background: "#fff", borderBottom: "1px solid #e0e0e0", position: "sticky", top: 0, zIndex: 100 },
  navInner: { padding: "0 28px", height: 80, display: "flex", alignItems: "center", justifyContent: "space-between" },
  navLeft: { display: "flex", flexDirection: "column" },
  navTitle: { color: "#212121", fontWeight: 700, fontSize: 18, margin: 0 },
  navSub: { color: "#878787", fontSize: 12, fontWeight: 500 },
  navRight: { display: "flex", alignItems: "center", gap: 14 },
  adminBadge: { background: "#e8f0fe", color: "#2874F0", padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700 },

  main: { padding: "28px 28px 40px", flex: 1 },

  statsHeaderRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  statsLabel:     { fontSize: 15, fontWeight: 700, color: "#212121" },
  d0Badge:        { background: "#e8f5e9", color: "#2e7d32", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 0.5 },

  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 },
  statCard: { background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 14 },
  statIcon: { width: 46, height: 46, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 },
  statVal: { fontSize: 26, fontWeight: 800, lineHeight: 1 },
  statLbl: { fontSize: 12, color: "#878787", marginTop: 4, fontWeight: 500 },

  tabBar:      { display: "flex", gap: 8, marginBottom: 20 },
  tabActive:   { padding: "9px 20px", background: "#2874F0", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
  tabInactive: { padding: "9px 20px", background: "#fff", color: "#555", border: "1.5px solid #e0e0e0", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
  tabBadge:    { background: "#FFA000", color: "#fff", borderRadius: 20, fontSize: 11, fontWeight: 700, padding: "1px 7px" },

  filterBar: { display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" },
  searchInput: { flex: "1 1 260px", padding: "10px 16px", border: "1.5px solid #e0e0e0", borderRadius: 8, fontSize: 14, outline: "none", background: "#fff", fontFamily: "inherit" },
  select: { padding: "10px 14px", border: "1.5px solid #e0e0e0", borderRadius: 8, fontSize: 14, outline: "none", background: "#fff", cursor: "pointer", fontFamily: "inherit" },
  dateInput: { padding: "10px 12px", border: "1.5px solid #e0e0e0", borderRadius: 8, fontSize: 14, outline: "none", background: "#fff", fontFamily: "inherit" },
  clearBtn: { padding: "10px 16px", background: "#fdecea", color: "#c62828", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" },
  refreshBtn: { padding: "10px 18px", background: "#2874F0", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" },

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

  centerMsg: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", gap: 12 },
  spinner: { width: 36, height: 36, border: "3px solid #e0e0e0", borderTop: "3px solid #2874F0", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  msgTxt: { fontSize: 14, color: "#878787" },
  errTxt: { fontSize: 15, color: "#c62828", fontWeight: 600 },
  retryBtn: { padding: "9px 22px", background: "#2874F0", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" },
  emptyCell: { padding: "56px 20px", textAlign: "center" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  emptyTxt: { fontSize: 15, fontWeight: 600, color: "#555" },
  emptyHint: { fontSize: 13, color: "#aaa" },

  dateTxt: { fontWeight: 600, color: "#212121", fontSize: 13 },
  emailCell: { display: "flex", alignItems: "center", gap: 8 },
  avatar: { width: 28, height: 28, borderRadius: "50%", background: "#e8f0fe", color: "#2874F0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 },
  emailTxt: { fontSize: 13, color: "#212121" },
  punchInTag: { background: "#e8f5e9", color: "#2e7d32", padding: "3px 9px", borderRadius: 6, fontSize: 12, fontWeight: 600 },
  punchOutTag: { background: "#fdecea", color: "#c62828", padding: "3px 9px", borderRadius: 6, fontSize: 12, fontWeight: 600 },
  dash: { color: "#ccc", fontSize: 13 },
  coordTxt: { fontSize: 11, color: "#555", fontFamily: "monospace", maxWidth: 200, display: "inline-block", overflow: "hidden", textOverflow: "ellipsis" },
  exportBtn: { padding: "10px 14px", background: "#26a541", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" },
  deleteBtn: { background: "#fdecea", color: "#c62828", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 14, cursor: "pointer", fontWeight: 700 },
  distBadge: { background: "#e8f0fe", color: "#2874F0", padding: "3px 9px", borderRadius: 6, fontSize: 12, fontWeight: 600 },
  durBadge: { background: "#f3e8ff", color: "#6d28d9", padding: "3px 9px", borderRadius: 6, fontSize: 12, fontWeight: 600 },
  cityBadge: { background: "#e0f2fe", color: "#0369a1", padding: "3px 9px", borderRadius: 6, fontSize: 12, fontWeight: 700 },
  storeCell: { display: "flex", alignItems: "center", gap: 6 },
  storeDot: { width: 7, height: 7, borderRadius: "50%", background: "#2874F0", flexShrink: 0 },
  tlName: { fontWeight: 600, color: "#212121" },
  managerTxt: { color: "#555", fontWeight: 500 },
  mapLink: { display: "inline-flex", alignItems: "center", gap: 4, background: "#e8f0fe", color: "#2874F0", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none", transition: "transform 0.2s" },

  leaveTag:   { background: "#fff8e1", color: "#F57F17", padding: "3px 9px", borderRadius: 6, fontSize: 12, fontWeight: 700 },
  weekoffTag: { background: "#f3f3f3", color: "#546E7A", padding: "3px 9px", borderRadius: 6, fontSize: 12, fontWeight: 700 },
};

export default AdminDashboard;
