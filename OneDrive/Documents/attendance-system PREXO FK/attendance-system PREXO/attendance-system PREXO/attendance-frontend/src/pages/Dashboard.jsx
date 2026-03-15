import { useEffect, useState } from "react";
import api from "../services/api";

function Dashboard() {
	const [attendance, setAttendance] = useState([]);
	const [status, setStatus] = useState("");
	const [store, setStore] = useState("");
	const [loading, setLoading] = useState(false);
	const [userProfile, setUserProfile] = useState({ name: "", city: "" });

	const fetchAttendance = async () => {
		const token = localStorage.getItem("token");
		const res = await api.get("/attendance/my-attendance", {
			headers: { Authorization: `Bearer ${token}` }
		});
		setAttendance(res.data);
	};

	const fetchUserProfile = async () => {
		const token = localStorage.getItem("token");
		const res = await api.get("/auth/me", {
			headers: { Authorization: `Bearer ${token}` }
		});
		setUserProfile({ name: res.data.name || "", city: res.data.city || "" });
	};

	useEffect(() => {
		fetchUserProfile();
		fetchAttendance();
	}, []);

	// Punch In logic
	const handlePunchIn = () => {
		if (!navigator.geolocation) {
			setStatus("Geolocation is not supported by your browser");
			return;
		}
		setLoading(true);
		navigator.geolocation.getCurrentPosition(async (pos) => {
			const { latitude, longitude } = pos.coords;
			try {
				const token = localStorage.getItem("token");
				const res = await api.post(
					"/attendance/punchin",
					{ latitude, longitude },
					{ headers: { Authorization: `Bearer ${token}` } }
				);
				setStatus(res.data.message);
				setStore(res.data.store || "");
				await fetchAttendance();
			} catch (err) {
				setStatus(err.response?.data?.message || "Attendance punch-in failed");
			}
			setLoading(false);
		}, () => {
			setStatus("Location access denied or unavailable");
			setLoading(false);
		});
	};

	// Punch Out logic
	const handlePunchOut = () => {
		if (!navigator.geolocation) {
			setStatus("Geolocation is not supported by your browser");
			return;
		}
		setLoading(true);
		navigator.geolocation.getCurrentPosition(async (pos) => {
			const { latitude, longitude } = pos.coords;
			try {
				const token = localStorage.getItem("token");
				const res = await api.post(
					"/attendance/punchout",
					{ latitude, longitude },
					{ headers: { Authorization: `Bearer ${token}` } }
				);
				setStatus(res.data.message);
				setStore(res.data.store || "");
				await fetchAttendance();
			} catch (err) {
				setStatus(err.response?.data?.message || "Attendance punch-out failed");
			}
			setLoading(false);
		}, () => {
			setStatus("Location access denied or unavailable");
			setLoading(false);
		});
	};

	// Debug: log current location
	const logLocation = () => {
		if (!navigator.geolocation) {
			alert("Geolocation not supported");
			return;
		}
		navigator.geolocation.getCurrentPosition((pos) => {
			alert(`Latitude: ${pos.coords.latitude}\nLongitude: ${pos.coords.longitude}`);
		}, () => {
			alert("Location access denied or unavailable");
		});
	};

	// Debug: manual punch-in with test coordinates
	const punchTestStore = async () => {
		setLoading(true);
		setStatus("");
		try {
			const token = localStorage.getItem("token");
			const res = await api.post(
				"/attendance/punchin",
				{ latitude: 12.927602500000003, longitude: 77.6949535 },
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			setStatus(res.data.message);
			setStore(res.data.store || "");
		} catch (err) {
			setStatus(err.response?.data?.message || "Attendance punch-in failed");
		}
		setLoading(false);
	};

	const isSuccess = status && status.toLowerCase().includes("successful");

	const getTimeSpent = (checkIn, checkOut) => {
		if (!checkOut) return null;
		const mins = Math.round((new Date(checkOut) - new Date(checkIn)) / 60000);
		const h = Math.floor(mins / 60);
		const m = mins % 60;
		return h > 0 ? `${h}h ${m}m` : `${m}m`;
	};

	return (
		<div style={s.page}>
			{/* Top Navigation */}
			<header style={s.navbar}>
				<div style={s.navInner}>
					<div style={s.navBrand}>
						<div style={s.navIcon}>TL</div>
						<span style={s.navTitle}>TL Attendance</span>
					</div>
					<div style={s.navRight}>
						{userProfile.name && (
							<div style={s.navUser}>
								<div style={s.navAvatar}>{userProfile.name.charAt(0).toUpperCase()}</div>
								<div style={s.navUserInfo}>
									<span style={s.navUserName}>{userProfile.name}</span>
									{userProfile.city && <span style={s.navUserCity}>{userProfile.city}</span>}
								</div>
							</div>
						)}
						<span style={s.navBadge}>📍 Live</span>
						<button
							style={s.logoutBtn}
							onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}
						>
							Logout
						</button>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main style={s.main}>

				{/* Page Title */}
				<div style={s.pageHeader}>
					<div>
						<h2 style={s.pageTitle}>
							{userProfile.name ? `Welcome, ${userProfile.name}` : "My Attendance"}
						</h2>
						<p style={s.pageSubtitle}>
							{userProfile.city ? `📍 ${userProfile.city} · ` : ""}
							Track your daily store visits and attendance records
						</p>
					</div>
					<div style={s.totalBadge}>
						<span style={s.totalNum}>{attendance.length}</span>
						<span style={s.totalLabel}>Total Visits</span>
					</div>
				</div>

				{/* Action Cards */}
				<div style={s.actionGrid}>
					<div style={s.actionCard}>
						<div style={s.actionCardIcon} onClick={handlePunchIn}>
							<span style={s.actionEmoji}>🟢</span>
						</div>
						<div style={s.actionCardBody}>
							<h3 style={s.actionCardTitle}>Punch In</h3>
							<p style={s.actionCardDesc}>Mark your arrival at the store using GPS</p>
							<button style={s.punchInBtn} onClick={handlePunchIn} disabled={loading}>
								{loading ? "Detecting..." : "Punch In"}
							</button>
						</div>
					</div>

					<div style={s.actionCard}>
						<div style={{ ...s.actionCardIcon, background: "#fff3ee" }} onClick={handlePunchOut}>
							<span style={s.actionEmoji}>🔴</span>
						</div>
						<div style={s.actionCardBody}>
							<h3 style={s.actionCardTitle}>Punch Out</h3>
							<p style={s.actionCardDesc}>Mark your departure from the store using GPS</p>
							<button style={s.punchOutBtn} onClick={handlePunchOut} disabled={loading}>
								{loading ? "Detecting..." : "Punch Out"}
							</button>
						</div>
					</div>

					{/* Status Card */}
					<div style={s.statusCard}>
						<h3 style={s.statusCardTitle}>Status</h3>
						{loading ? (
							<div style={s.loadingWrap}>
								<div style={s.spinner} />
								<p style={s.loadingText}>Detecting your location...</p>
							</div>
						) : (
							<>
								{status ? (
									<div style={isSuccess ? s.statusSuccess : s.statusError}>
										<span style={s.statusIcon}>{isSuccess ? "✅" : "⚠️"}</span>
										<span>{status}</span>
									</div>
								) : (
									<p style={s.statusIdle}>No recent activity</p>
								)}
								{store && (
									<div style={s.storeTag}>
										<span>📍</span>
										<span>Nearest Store: <strong>{store}</strong></span>
									</div>
								)}
							</>
						)}
					</div>
				</div>

				{/* Attendance Table */}
				<div style={s.tableCard}>
					<div style={s.tableHeader}>
						<h3 style={s.tableTitle}>Attendance History</h3>
						<span style={s.tableCount}>{attendance.length} records</span>
					</div>
					<div style={s.tableWrap}>
						<table style={s.table}>
							<thead>
								<tr>
									<th style={s.th}>Name</th>
									<th style={s.th}>Store</th>
									<th style={s.th}>Visit #</th>
									<th style={s.th}>Check In</th>
									<th style={s.th}>Check Out</th>
									<th style={s.th}>Time Spent</th>
									<th style={s.th}>City</th>
									<th style={s.th}>Status</th>
								</tr>
							</thead>
							<tbody>
								{attendance.length === 0 ? (
									<tr>
										<td colSpan={8} style={s.emptyCell}>
											<div style={s.emptyState}>
												<span style={s.emptyIcon}>📋</span>
												<p style={s.emptyText}>No attendance records yet</p>
												<p style={s.emptyHint}>Punch in at a store to get started</p>
											</div>
										</td>
									</tr>
								) : (
									attendance.map((a, i) => (
										<tr key={i} style={i % 2 === 0 ? s.trEven : s.trOdd}>
											<td style={s.td}>
												<div style={s.nameCell}>
													<div style={s.nameAvatar}>
														{userProfile.name ? userProfile.name.charAt(0).toUpperCase() : "?"}
													</div>
													<span style={s.nameTxt}>{userProfile.name || "—"}</span>
												</div>
											</td>
											<td style={s.td}>
												<div style={s.storeCell}>
													<span style={s.storeDot} />
													{a.storeName}
												</div>
											</td>
											<td style={s.td}>
												<span style={s.visitBadge}>#{a.visitNumber}</span>
											</td>
											<td style={s.td}>{new Date(a.checkInTime).toLocaleString()}</td>
											<td style={s.td}>
												{a.checkOutTime
													? new Date(a.checkOutTime).toLocaleString()
													: <span style={s.pendingTag}>Pending</span>}
											</td>
											<td style={s.td}>
												{getTimeSpent(a.checkInTime, a.checkOutTime)
													? <span style={s.timeBadge}>{getTimeSpent(a.checkInTime, a.checkOutTime)}</span>
													: <span style={s.pendingTag}>—</span>}
											</td>
											<td style={s.td}>
												{userProfile.city
													? <span style={s.cityBadge}>{userProfile.city}</span>
													: <span style={s.pendingTag}>—</span>}
											</td>
											<td style={s.td}>
												<span style={a.checkOutTime ? s.completedTag : s.activeTag}>
													{a.checkOutTime ? "Completed" : "Active"}
												</span>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			</main>
		</div>
	);
}

const s = {
	page: { minHeight: "100vh", background: "#F1F3F6", display: "flex", flexDirection: "column" },

	navbar: { background: "#2874F0", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", position: "sticky", top: 0, zIndex: 100 },
	navInner: { maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" },
	navBrand: { display: "flex", alignItems: "center", gap: 10 },
	navIcon: { width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 },
	navTitle: { color: "#fff", fontWeight: 700, fontSize: 18 },
	navRight: { display: "flex", alignItems: "center", gap: 16 },
	navUser: { display: "flex", alignItems: "center", gap: 10 },
	navAvatar: { width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.25)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0 },
	navUserInfo: { display: "flex", flexDirection: "column", lineHeight: 1.2 },
	navUserName: { color: "#fff", fontSize: 13, fontWeight: 600 },
	navUserCity: { color: "rgba(255,255,255,0.7)", fontSize: 11 },
	navBadge: { background: "rgba(255,255,255,0.15)", color: "#fff", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
	logoutBtn: { background: "rgba(255,255,255,0.15)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 6, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },

	main: { maxWidth: 1100, margin: "0 auto", padding: "32px 24px", width: "100%" },

	pageHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 },
	pageTitle: { fontSize: 24, fontWeight: 700, color: "#212121", marginBottom: 4 },
	pageSubtitle: { fontSize: 14, color: "#878787" },
	totalBadge: { background: "#fff", borderRadius: 12, padding: "12px 24px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
	totalNum: { display: "block", fontSize: 28, fontWeight: 700, color: "#2874F0" },
	totalLabel: { fontSize: 12, color: "#878787", fontWeight: 500 },

	actionGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginBottom: 28 },
	actionCard: { background: "#fff", borderRadius: 12, padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", display: "flex", gap: 16, alignItems: "flex-start" },
	actionCardIcon: { width: 52, height: 52, borderRadius: 12, background: "#edf4ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" },
	actionEmoji: { fontSize: 22 },
	actionCardBody: { flex: 1 },
	actionCardTitle: { fontSize: 16, fontWeight: 700, color: "#212121", marginBottom: 4 },
	actionCardDesc: { fontSize: 13, color: "#878787", marginBottom: 14, lineHeight: 1.5 },
	punchInBtn: { padding: "9px 20px", background: "#2874F0", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%" },
	punchOutBtn: { padding: "9px 20px", background: "#FB641B", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%" },

	statusCard: { background: "#fff", borderRadius: 12, padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
	statusCardTitle: { fontSize: 16, fontWeight: 700, color: "#212121", marginBottom: 16 },
	loadingWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "8px 0" },
	spinner: { width: 32, height: 32, border: "3px solid #e0e0e0", borderTop: "3px solid #2874F0", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
	loadingText: { fontSize: 13, color: "#878787" },
	statusSuccess: { display: "flex", alignItems: "center", gap: 8, background: "#e8f5e9", color: "#2e7d32", padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500 },
	statusError: { display: "flex", alignItems: "center", gap: 8, background: "#fdecea", color: "#c62828", padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500 },
	statusIcon: { fontSize: 16 },
	statusIdle: { fontSize: 13, color: "#aaa", fontStyle: "italic" },
	storeTag: { display: "flex", alignItems: "center", gap: 8, marginTop: 12, background: "#F1F3F6", padding: "8px 12px", borderRadius: 8, fontSize: 13, color: "#555" },

	tableCard: { background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" },
	tableHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #f0f0f0" },
	tableTitle: { fontSize: 16, fontWeight: 700, color: "#212121" },
	tableCount: { fontSize: 13, color: "#878787", background: "#F1F3F6", padding: "4px 12px", borderRadius: 20 },
	tableWrap: { overflowX: "auto" },
	table: { width: "100%", borderCollapse: "collapse", minWidth: 900 },
	th: { padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#878787", textTransform: "uppercase", letterSpacing: 0.5, background: "#fafafa", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" },
	td: { padding: "14px 16px", fontSize: 14, color: "#212121", borderBottom: "1px solid #f9f9f9", verticalAlign: "middle" },
	trEven: { background: "#fff" },
	trOdd: { background: "#fafafa" },

	nameCell: { display: "flex", alignItems: "center", gap: 10 },
	nameAvatar: { width: 30, height: 30, borderRadius: "50%", background: "#e8f0fe", color: "#2874F0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 },
	nameTxt: { fontWeight: 600, fontSize: 14, color: "#212121" },
	storeCell: { display: "flex", alignItems: "center", gap: 8 },
	storeDot: { width: 8, height: 8, borderRadius: "50%", background: "#2874F0", flexShrink: 0 },
	visitBadge: { background: "#e8f0fe", color: "#2874F0", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 },
	pendingTag: { color: "#aaa", fontStyle: "italic", fontSize: 13 },
	timeBadge: { background: "#f3e8ff", color: "#6d28d9", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 },
	cityBadge: { background: "#e0f2fe", color: "#0369a1", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 },
	completedTag: { background: "#e8f5e9", color: "#2e7d32", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
	activeTag: { background: "#fff3e0", color: "#e65100", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },

	emptyCell: { padding: "48px 20px", textAlign: "center" },
	emptyState: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
	emptyIcon: { fontSize: 40 },
	emptyText: { fontSize: 15, fontWeight: 600, color: "#555" },
	emptyHint: { fontSize: 13, color: "#aaa" },
};

export default Dashboard;
