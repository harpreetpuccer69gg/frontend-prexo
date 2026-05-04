import { useEffect, useState, useCallback } from "react";
import api from "../Services/api";

/* ── Toast Component ── */
function Toast({ toasts, remove }) {
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: t.type === "success" ? "#2e7d32" : t.type === "error" ? "#c62828" : "#1565c0", color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, boxShadow: "0 4px 16px rgba(0,0,0,0.18)", display: "flex", alignItems: "center", gap: 10, minWidth: 280, animation: "slideIn 0.3s ease" }}>
          <span>{t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}</span>
          <span style={{ flex: 1 }}>{t.msg}</span>
          <span style={{ cursor: "pointer", opacity: 0.7, fontSize: 16 }} onClick={() => remove(t.id)}>✕</span>
        </div>
      ))}
    </div>
  );
}

/* ── Skeleton Row ── */
function SkeletonRows({ cols = 10, rows = 8 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i}>
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} style={{ padding: "13px 14px", borderBottom: "1px solid #f5f5f5" }}>
          <div style={{ height: 14, borderRadius: 6, background: "linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
        </td>
      ))}
    </tr>
  ));
}

/* ── Mini Bar Chart ── */
function BarChart({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#212121" }}>📈 Last 7 Days Attendance</div>
          <div style={{ fontSize: 12, color: "#aaa" }}>Daily punch-in count</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ fontSize: 10, color: "#2874F0", fontWeight: 700 }}>{d.count}</div>
            <div style={{ width: "100%", background: i === data.length - 1 ? "#2874F0" : "#bdd3ff", borderRadius: "4px 4px 0 0", height: Math.max((d.count / max) * 60, 4) + "px", transition: "height 0.5s" }} />
            <div style={{ fontSize: 10, color: "#878787", whiteSpace: "nowrap" }}>{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Confirm Modal ── */
function ConfirmModal({ msg, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9998 }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: "28px", maxWidth: 380, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
        <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>🗑️</div>
        <p style={{ fontSize: 15, color: "#212121", textAlign: "center", fontWeight: 600, marginBottom: 8 }}>Delete Record?</p>
        <p style={{ fontSize: 13, color: "#878787", textAlign: "center", marginBottom: 24 }}>{msg}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px", background: "#f5f5f5", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "10px", background: "#c62828", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

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

  // Not Reported state
  const [notReported, setNotReported]               = useState([]);
  const [notReportedLoading, setNotReportedLoading] = useState(false);
  const [notReportedError, setNotReportedError]     = useState("");
  const [notReportedSearch, setNotReportedSearch]   = useState("");
  const [notReportedDate, setNotReportedDate]       = useState("");
  const [notReportedStatus, setNotReportedStatus]   = useState("all");

  // TL Performance state
  const [tlPerf, setTlPerf]               = useState([]);
  const [tlPerfLoading, setTlPerfLoading] = useState(false);
  const [tlPerfError, setTlPerfError]     = useState("");
  const [tlPerfPeriod, setTlPerfPeriod]   = useState("weekly");
  const [tlPerfSearch, setTlPerfSearch]   = useState("");
  const [tlPerfExpanded, setTlPerfExpanded] = useState(null);

  // Store Heatmap state
  const [heatmap, setHeatmap]               = useState([]);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [heatmapError, setHeatmapError]     = useState("");
  const [heatmapPeriod, setHeatmapPeriod]   = useState("weekly");
  const [heatmapSearch, setHeatmapSearch]   = useState("");

  // Toast
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  const removeToast = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), []);

  // Pagination
  const [page, setPage]         = useState(1);
  const PAGE_SIZE               = 50;

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState(null); // { msg, onConfirm }

  // Bar chart data
  const [chartData, setChartData] = useState([]);

  const token = localStorage.getItem("token");

  /* ── Fetch attendance ── */
  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/attendance/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(res.data);
      setFiltered(res.data);
      setPage(1);
      // Build last 7 days chart
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
        const fmt   = d.toLocaleDateString("en-GB");
        const count = res.data.filter(r => r.date === fmt).length;
        days.push({ label, count });
      }
      setChartData(days);
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

  const fetchNotReported = async (date = "", city = "All") => {
    setNotReportedLoading(true);
    setNotReportedError("");
    try {
      const params = [];
      if (date) params.push(`date=${date}`);
      if (city && city !== "All") params.push(`city=${encodeURIComponent(city)}`);
      const url = `/attendance/admin/not-reported${params.length ? "?" + params.join("&") : ""}`;
      const res = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotReported(res.data);
    } catch (err) {
      setNotReportedError(err.response?.data?.message || "Failed to load data");
    }
    setNotReportedLoading(false);
  };

  const fetchTlPerf = async (period = "weekly", city = "All") => {
    setTlPerfLoading(true); setTlPerfError("");
    try {
      const params = [`period=${period}`];
      if (city && city !== "All") params.push(`city=${encodeURIComponent(city)}`);
      const res = await api.get(`/attendance/admin/tl-performance?${params.join("&")}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTlPerf(res.data);
    } catch (err) { setTlPerfError(err.response?.data?.message || "Failed to load"); }
    setTlPerfLoading(false);
  };

  const fetchHeatmap = async (period = "weekly") => {
    setHeatmapLoading(true); setHeatmapError("");
    try {
      const res = await api.get(`/attendance/admin/store-heatmap?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHeatmap(res.data);
    } catch (err) { setHeatmapError(err.response?.data?.message || "Failed to load"); }
    setHeatmapLoading(false);
  };

  useEffect(() => { fetchAll(); fetchLeaves(); fetchNotReported("", cityFilter); fetchTlPerf(tlPerfPeriod, cityFilter); fetchHeatmap(heatmapPeriod); }, []);

  useEffect(() => { fetchNotReported(notReportedDate, cityFilter); fetchTlPerf(tlPerfPeriod, cityFilter); }, [notReportedDate, cityFilter]);

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

  // If date filter is selected use it, else use today (resets at 7AM)
  const now          = new Date();
  const statDate     = now.getHours() < 7 ? new Date(now - 86400000) : now;
  const todayStr     = dateFilter
    ? (() => { const [y, m, d] = dateFilter.split("-"); return `${d}/${m}/${y}`; })()
    : statDate.toLocaleDateString("en-GB");

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

  const handleDelete = (id) => {
    setConfirmModal({
      msg: "This attendance record will be permanently deleted.",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await api.delete(`/attendance/admin/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          setRecords(prev => prev.filter(r => r._id !== id));
          addToast("Record deleted successfully", "success");
        } catch (err) {
          addToast(err.response?.data?.message || "Failed to delete record", "error");
        }
      }
    });
  };

  const handleDeleteLeave = (id) => {
    setConfirmModal({
      msg: "This leave record will be permanently deleted.",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await api.delete(`/attendance/admin/leave/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          setLeaves(prev => prev.filter(l => l._id !== id));
          addToast("Leave record deleted", "success");
        } catch (err) {
          addToast(err.response?.data?.message || "Failed to delete", "error");
        }
      }
    });
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

  const clearFilters = () => { setSearch(""); setCityFilter("All"); setDateFilter(""); setPage(1); };
  const hasFilter    = search || cityFilter !== "All" || dateFilter;

  // Pagination helpers
  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={s.page}>
      <Toast toasts={toasts} remove={removeToast} />
      {confirmModal && <ConfirmModal msg={confirmModal.msg} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(null)} />}

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
          <button style={s.refreshBtn} onClick={() => { fetchAll(); fetchLeaves(); fetchNotReported(notReportedDate, cityFilter); fetchTlPerf(tlPerfPeriod, cityFilter); fetchHeatmap(heatmapPeriod); }}>↻ Refresh</button>
        </div>

        {/* ── Bar Chart ── */}
        {activeTab === "attendance" && chartData.length > 0 && <BarChart data={chartData} />}

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
          <button
            style={activeTab === "not-reported" ? s.tabActive : s.tabInactive}
            onClick={() => setActiveTab("not-reported")}
          >
            ⚠️ Not Reported
            {notReported.length > 0 && <span style={{ ...s.tabBadge, background: "#c62828" }}>{notReported.length}</span>}
          </button>
          <button
            style={activeTab === "tl-performance" ? s.tabActive : s.tabInactive}
            onClick={() => { setActiveTab("tl-performance"); fetchTlPerf(tlPerfPeriod, cityFilter); }}
          >
            📊 TL Performance
          </button>
          <button
            style={activeTab === "store-heatmap" ? s.tabActive : s.tabInactive}
            onClick={() => { setActiveTab("store-heatmap"); fetchHeatmap(heatmapPeriod); }}
          >
            🗺️ Store Heatmap
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
                <div style={s.tableWrap}>
                  <table style={s.table}><thead><tr><th style={s.thIdx}>#</th>{COLS.map(c=><th key={c.key} style={s.th}>{c.label}</th>)}<th style={s.th}>Action</th></tr></thead>
                  <tbody><SkeletonRows cols={COLS.length + 2} rows={10} /></tbody></table>
                </div>
              ) : error ? (
                <div style={s.centerMsg}>
                  <p style={s.errTxt}>⚠️ {error}</p>
                  <button style={s.retryBtn} onClick={fetchAll}>Retry</button>
                </div>
              ) : (
                <>
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
                      {paginated.length === 0 ? (
                        <tr>
                          <td colSpan={COLS.length + 2} style={s.emptyCell}>
                            <div style={s.emptyState}>
                              <span style={{ fontSize: 40 }}>📭</span>
                              <p style={s.emptyTxt}>No records found</p>
                              <p style={s.emptyHint}>Try adjusting your filters</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginated.map((row, i) => (
                          <tr key={row._id || i} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                            <td style={s.tdIdx}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                            <td style={s.td}><span style={s.dateTxt}>{row.date}</span></td>
                            <td style={s.td}><span style={s.tlName}>{row.tlName !== "-" ? row.tlName : <span style={s.dash}>—</span>}</span></td>
                            <td style={s.td}>
                              <div style={s.emailCell}>
                                <div style={s.avatar}>{row.userEmail?.charAt(0).toUpperCase()}</div>
                                <span style={s.emailTxt}>{row.userEmail}</span>
                              </div>
                            </td>
                            <td style={s.td}><span style={s.punchInTag}>{to12hr(row.punchIn)}</span></td>
                            <td style={s.td}>{row.punchOut !== "-" ? <span style={s.punchOutTag}>{to12hr(row.punchOut)}</span> : <span style={s.dash}>—</span>}</td>
                            <td style={s.td}>{row.duration !== "-" ? <span style={s.durBadge}>{row.duration}</span> : <span style={s.dash}>—</span>}</td>
                            <td style={s.td}>{row.city !== "-" ? <span style={s.cityBadge}>{row.city}</span> : <span style={s.dash}>—</span>}</td>
                            <td style={s.td}><div style={s.storeCell}><span style={s.storeDot} /><span>{row.storeName}</span></div></td>
                            <td style={s.td}>{row.reportingManager !== "-" ? <span style={s.managerTxt}>{row.reportingManager}</span> : <span style={s.dash}>—</span>}</td>
                            <td style={s.td}><button style={s.deleteBtn} onClick={() => handleDelete(row._id)}>🗑️</button></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div style={s.pagination}>
                    <button style={s.pageBtn} disabled={page === 1} onClick={() => setPage(1)}>«</button>
                    <button style={s.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                    <span style={s.pageInfo}>Page {page} of {totalPages} · {filtered.length} records</span>
                    <button style={s.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                    <button style={s.pageBtn} disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
                  </div>
                )}
                </>
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

        {/* ── Not Reported Tab ── */}
        {activeTab === "not-reported" && (
          <div style={s.tableCard}>
            <div style={s.tableTop}>
              <div>
                <h3 style={s.tableTitle}>Not Reported Today</h3>
                <p style={s.tableSubtitle}>TLs who have not punched in or applied leave today</p>
              </div>
              <span style={s.tableCount}>{notReported.length} TLs</span>
            </div>

            <div style={{ ...s.filterBar, padding: "12px 24px", marginBottom: 0, borderBottom: "1px solid #f0f0f0" }}>
              <input
                style={s.searchInput}
                placeholder="🔍  Search by name, email or manager..."
                value={notReportedSearch}
                onChange={e => setNotReportedSearch(e.target.value)}
              />
              <input
                style={s.dateInput}
                type="date"
                value={notReportedDate}
                onChange={e => setNotReportedDate(e.target.value)}
                title="Filter by date"
              />
              <select
                style={s.select}
                value={notReportedStatus}
                onChange={e => setNotReportedStatus(e.target.value)}
              >
                <option value="all">All</option>
                <option value="not-reported">🔴 Not Reported</option>
                <option value="1-store">🟠 1 Store Visited</option>
              </select>
              {(notReportedSearch || notReportedDate || notReportedStatus !== "all") && (
                <button style={s.clearBtn} onClick={() => { setNotReportedSearch(""); setNotReportedDate(""); setNotReportedStatus("all"); }}>✕ Clear</button>
              )}
            </div>

            {notReportedLoading ? (
              <div style={s.centerMsg}><div style={s.spinner} /><p style={s.msgTxt}>Loading...</p></div>
            ) : notReportedError ? (
              <div style={s.centerMsg}><p style={s.errTxt}>⚠️ {notReportedError}</p><button style={s.retryBtn} onClick={fetchNotReported}>Retry</button></div>
            ) : (
              <div style={s.tableWrap}>
                <table style={{ ...s.table, minWidth: 700 }}>
                  <thead>
                    <tr>
                      <th style={s.thIdx}>#</th>
                      <th style={s.th}>TL Name</th>
                      <th style={s.th}>TL Email</th>
                      <th style={s.th}>City</th>
                      <th style={s.th}>Phone</th>
                      <th style={s.th}>Reporting Manager</th>
                      <th style={s.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notReported.filter(r => {
                      const q = notReportedSearch.toLowerCase();
                      const matchSearch = !q ||
                        r.tlName?.toLowerCase().includes(q) ||
                        r.tlEmail?.toLowerCase().includes(q) ||
                        r.reportingManager?.toLowerCase().includes(q);
                      const matchStatus =
                        notReportedStatus === "all" ||
                        (notReportedStatus === "not-reported" && r.visitCount === 0) ||
                        (notReportedStatus === "1-store" && r.visitCount === 1);
                      return matchSearch && matchStatus;
                    }).length === 0 ? (
                      <tr>
                        <td colSpan={6} style={s.emptyCell}>
                          <div style={s.emptyState}>
                            <span style={{ fontSize: 40 }}>✅</span>
                            <p style={s.emptyTxt}>All TLs have reported today</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      notReported
                        .filter(r => {
                          const q = notReportedSearch.toLowerCase();
                          const matchSearch = !q ||
                            r.tlName?.toLowerCase().includes(q) ||
                            r.tlEmail?.toLowerCase().includes(q) ||
                            r.reportingManager?.toLowerCase().includes(q);
                          const matchStatus =
                            notReportedStatus === "all" ||
                            (notReportedStatus === "not-reported" && r.visitCount === 0) ||
                            (notReportedStatus === "1-store" && r.visitCount === 1);
                          return matchSearch && matchStatus;
                        })
                        .map((r, i) => (
                          <tr key={r.tlEmail} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                            <td style={s.tdIdx}>{i + 1}</td>
                            <td style={s.td}><span style={s.tlName}>{r.tlName}</span></td>
                            <td style={s.td}>
                              <div style={s.emailCell}>
                                <div style={s.avatar}>{r.tlEmail?.charAt(0).toUpperCase()}</div>
                                <span style={s.emailTxt}>{r.tlEmail}</span>
                              </div>
                            </td>
                            <td style={s.td}>{r.city !== "-" ? <span style={s.cityBadge}>{r.city}</span> : <span style={s.dash}>—</span>}</td>
                            <td style={s.td}>{r.phone !== "-" ? r.phone : <span style={s.dash}>—</span>}</td>
                            <td style={s.td}>{r.reportingManager !== "-" ? <span style={s.managerTxt}>{r.reportingManager}</span> : <span style={s.dash}>—</span>}</td>
                            <td style={s.td}>
                              {r.visitCount === 0
                                ? <span style={s.notReportedTag}>Not Reported</span>
                                : <span style={s.oneStoreTag}>1 Store Visited</span>}
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

        {/* ── TL Performance Tab ── */}
        {activeTab === "tl-performance" && (
          <div style={s.tableCard}>
            <div style={s.tableTop}>
              <div>
                <h3 style={s.tableTitle}>TL Performance Summary</h3>
                <p style={s.tableSubtitle}>Store visits, avg time and activity per TL</p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button style={tlPerfPeriod === "weekly" ? s.tabActive : s.tabInactive} onClick={() => { setTlPerfPeriod("weekly"); fetchTlPerf("weekly", cityFilter); }}>Weekly</button>
                <button style={tlPerfPeriod === "monthly" ? s.tabActive : s.tabInactive} onClick={() => { setTlPerfPeriod("monthly"); fetchTlPerf("monthly", cityFilter); }}>Monthly</button>
              </div>
            </div>
            <div style={{ ...s.filterBar, padding: "12px 24px", marginBottom: 0, borderBottom: "1px solid #f0f0f0" }}>
              <input style={s.searchInput} placeholder="🔍  Search by TL name or email..." value={tlPerfSearch} onChange={e => setTlPerfSearch(e.target.value)} />
              {tlPerfSearch && <button style={s.clearBtn} onClick={() => setTlPerfSearch("")}>✕ Clear</button>}
            </div>
            {tlPerfLoading ? (
              <div style={s.centerMsg}><div style={s.spinner} /><p style={s.msgTxt}>Loading...</p></div>
            ) : tlPerfError ? (
              <div style={s.centerMsg}><p style={s.errTxt}>⚠️ {tlPerfError}</p></div>
            ) : (
              <div style={s.tableWrap}>
                <table style={{ ...s.table, minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th style={s.thIdx}>#</th>
                      <th style={s.th}>TL Name</th>
                      <th style={s.th}>City</th>
                      <th style={s.th}>Total Visits</th>
                      <th style={s.th}>Avg Visits/Day</th>
                      <th style={s.th}>Avg Time/Visit</th>
                      <th style={s.th}>Reporting Manager</th>
                      <th style={s.th}>Store Breakdown</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tlPerf.filter(r => {
                      const q = tlPerfSearch.toLowerCase();
                      return !q || r.tlName?.toLowerCase().includes(q) || r.tlEmail?.toLowerCase().includes(q);
                    }).map((r, i) => (
                      <>
                        <tr key={r.tlEmail} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                          <td style={s.tdIdx}>{i + 1}</td>
                          <td style={s.td}>
                            <div style={s.emailCell}>
                              <div style={s.avatar}>{r.tlName?.charAt(0).toUpperCase()}</div>
                              <div>
                                <div style={s.tlName}>{r.tlName}</div>
                                <div style={{ fontSize: 11, color: "#aaa" }}>{r.tlEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td style={s.td}>{r.city !== "-" ? <span style={s.cityBadge}>{r.city}</span> : <span style={s.dash}>—</span>}</td>
                          <td style={s.td}><span style={s.visitBadge}>{r.totalVisits}</span></td>
                          <td style={s.td}><span style={s.durBadge}>{r.avgVisitsPerDay}/day</span></td>
                          <td style={s.td}><span style={s.durBadge}>{r.avgMinsPerVisit}m</span></td>
                          <td style={s.td}><span style={s.managerTxt}>{r.reportingManager}</span></td>
                          <td style={s.td}>
                            <button style={s.expandBtn} onClick={() => setTlPerfExpanded(tlPerfExpanded === r.tlEmail ? null : r.tlEmail)}>
                              {tlPerfExpanded === r.tlEmail ? "▲ Hide" : "▼ Stores"}
                            </button>
                          </td>
                        </tr>
                        {tlPerfExpanded === r.tlEmail && (
                          <tr key={r.tlEmail + "_exp"}>
                            <td colSpan={8} style={{ padding: "0 24px 12px", background: "#f8faff" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
                                <thead>
                                  <tr>
                                    <th style={{ ...s.th, background: "#f0f4ff" }}>Store Name</th>
                                    <th style={{ ...s.th, background: "#f0f4ff" }}>Visits</th>
                                    <th style={{ ...s.th, background: "#f0f4ff" }}>Avg Time</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {r.stores.map(st => (
                                    <tr key={st.storeName}>
                                      <td style={s.td}><div style={s.storeCell}><span style={s.storeDot} />{st.storeName}</div></td>
                                      <td style={s.td}><span style={s.visitBadge}>{st.visits}</span></td>
                                      <td style={s.td}><span style={s.durBadge}>{st.avgMins}m</span></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Store Heatmap Tab ── */}
        {activeTab === "store-heatmap" && (
          <div style={s.tableCard}>
            <div style={s.tableTop}>
              <div>
                <h3 style={s.tableTitle}>Store Visit Heatmap</h3>
                <p style={s.tableSubtitle}>Which stores are visited most and least</p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button style={heatmapPeriod === "weekly" ? s.tabActive : s.tabInactive} onClick={() => { setHeatmapPeriod("weekly"); fetchHeatmap("weekly"); }}>Weekly</button>
                <button style={heatmapPeriod === "monthly" ? s.tabActive : s.tabInactive} onClick={() => { setHeatmapPeriod("monthly"); fetchHeatmap("monthly"); }}>Monthly</button>
              </div>
            </div>
            <div style={{ ...s.filterBar, padding: "12px 24px", marginBottom: 0, borderBottom: "1px solid #f0f0f0" }}>
              <input style={s.searchInput} placeholder="🔍  Search by store name..." value={heatmapSearch} onChange={e => setHeatmapSearch(e.target.value)} />
              {heatmapSearch && <button style={s.clearBtn} onClick={() => setHeatmapSearch("")}>✕ Clear</button>}
            </div>
            {heatmapLoading ? (
              <div style={s.centerMsg}><div style={s.spinner} /><p style={s.msgTxt}>Loading...</p></div>
            ) : heatmapError ? (
              <div style={s.centerMsg}><p style={s.errTxt}>⚠️ {heatmapError}</p></div>
            ) : (() => {
              const filtered = heatmap.filter(r => !heatmapSearch || r.storeName?.toLowerCase().includes(heatmapSearch.toLowerCase()));
              const maxVisits = filtered[0]?.totalVisits || 1;
              return (
                <div style={s.tableWrap}>
                  <table style={{ ...s.table, minWidth: 700 }}>
                    <thead>
                      <tr>
                        <th style={s.thIdx}>#</th>
                        <th style={s.th}>Store Name</th>
                        <th style={s.th}>Total Visits</th>
                        <th style={s.th}>Avg Time/Visit</th>
                        <th style={s.th}>Unique TLs</th>
                        <th style={s.th}>Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={6} style={s.emptyCell}><div style={s.emptyState}><span style={{ fontSize: 40 }}>🗺️</span><p style={s.emptyTxt}>No store data found</p></div></td></tr>
                      ) : filtered.map((r, i) => {
                        const pct = Math.round((r.totalVisits / maxVisits) * 100);
                        const heat = pct > 75 ? "#c62828" : pct > 50 ? "#e65100" : pct > 25 ? "#f9a825" : "#2e7d32";
                        return (
                          <tr key={r.storeName} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                            <td style={s.tdIdx}>{i + 1}</td>
                            <td style={s.td}><div style={s.storeCell}><span style={{ ...s.storeDot, background: heat }} />{r.storeName}</div></td>
                            <td style={s.td}><span style={{ ...s.visitBadge, background: heat + "22", color: heat }}>{r.totalVisits}</span></td>
                            <td style={s.td}><span style={s.durBadge}>{r.avgMins}m</span></td>
                            <td style={s.td}><span style={s.cityBadge}>{r.uniqueTLs} TLs</span></td>
                            <td style={{ ...s.td, minWidth: 160 }}>
                              <div style={{ background: "#f0f0f0", borderRadius: 6, height: 10, overflow: "hidden" }}>
                                <div style={{ width: `${pct}%`, background: heat, height: "100%", borderRadius: 6, transition: "width 0.4s" }} />
                              </div>
                              <span style={{ fontSize: 11, color: "#aaa", marginTop: 2, display: "block" }}>{pct}% of max</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}

      </main>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#F1F3F6", display: "flex", flexDirection: "column", fontFamily: "'Segoe UI', system-ui, sans-serif", "@keyframes shimmer": { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } } },

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

  expandBtn: { background: "#e8f0fe", color: "#2874F0", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600 },
  visitBadge: { background: "#e8f0fe", color: "#2874F0", padding: "3px 9px", borderRadius: 6, fontSize: 12, fontWeight: 700 },

  notReportedTag: { background: "#fdecea", color: "#c62828", padding: "3px 9px", borderRadius: 6, fontSize: 12, fontWeight: 700 },
  oneStoreTag:    { background: "#fff3e0", color: "#e65100", padding: "3px 9px", borderRadius: 6, fontSize: 12, fontWeight: 700 },

  leaveTag:   { background: "#fff8e1", color: "#F57F17", padding: "3px 9px", borderRadius: 6, fontSize: 12, fontWeight: 700 },
  weekoffTag: { background: "#f3f3f3", color: "#546E7A", padding: "3px 9px", borderRadius: 6, fontSize: 12, fontWeight: 700 },

  pagination: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "16px 24px", borderTop: "1px solid #f0f0f0" },
  pageBtn:    { padding: "6px 14px", background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: 6, fontSize: 14, cursor: "pointer", fontWeight: 600, color: "#2874F0" },
  pageInfo:   { fontSize: 13, color: "#878787", fontWeight: 500, padding: "0 8px" },
};

export default AdminDashboard;
