import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../Services/api";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(
    JSON.parse(localStorage.getItem("sidebarCollapsed") || "false")
  );
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const navItems = [
    { name: "Attendance", path: "/admin/attendance", icon: "📅" },
    { name: "Users", path: "/admin/users", icon: "👥" },
    { name: "Stores", path: "/admin/stores", icon: "🏢" },
  ];

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  };

  return (
    <aside style={{ ...s.sidebar, width: isCollapsed ? 80 : 260 }}>
      {/* Brand Section */}
      <div style={s.brand}>
        <div style={s.brandIcon}>A</div>
        {!isCollapsed && (
          <div style={s.brandText}>
            <div style={s.brandTitle}>Admin</div>
            <div style={s.brandSub}>PREXO Attendance</div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav style={s.nav}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...s.navLink,
                backgroundColor: isActive ? "rgba(40,116,240,0.1)" : "transparent",
                color: isActive ? "#2874F0" : "#555",
                justifyContent: isCollapsed ? "center" : "flex-start",
              }}
            >
              <span style={{ ...s.icon, fontSize: isCollapsed ? 24 : 18 }}>{item.icon}</span>
              {!isCollapsed && <span style={s.navText}>{item.name}</span>}
              {isActive && !isCollapsed && <div style={s.activeDot} />}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Toggle */}
      <div style={s.footer}>
        <button
          onClick={handleLogout}
          style={{
            ...s.logoutBtn,
            justifyContent: isCollapsed ? "center" : "flex-start",
          }}
          title="Logout"
        >
          <span style={{ ...s.icon, fontSize: isCollapsed ? 24 : 18 }}>🚪</span>
          {!isCollapsed && <span style={s.navText}>Logout</span>}
        </button>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={s.toggleBtn}
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>
    </aside>
  );
};

const s = {
  sidebar: {
    height: "100vh",
    background: "#fff",
    borderRight: "1px solid #e0e0e0",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    left: 0,
    top: 0,
    zIndex: 1000,
    transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "2px 0 12px rgba(0,0,0,0.03)",
  },
  brand: {
    height: 80,
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    gap: 12,
    borderBottom: "1px solid #f5f5f5",
    overflow: "hidden",
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "linear-gradient(135deg, #2874F0 0%, #1a5dc8 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 20,
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(40,116,240,0.3)",
  },
  brandText: {
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#212121",
    lineHeight: 1.2,
  },
  brandSub: {
    fontSize: 11,
    color: "#878787",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  nav: {
    flex: 1,
    padding: "24px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    borderRadius: 10,
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 14,
    transition: "all 0.2s",
    position: "relative",
    overflow: "hidden",
  },
  navText: {
    marginLeft: 12,
    whiteSpace: "nowrap",
  },
  icon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    flexShrink: 0,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#2874F0",
    marginLeft: "auto",
  },
  footer: {
    padding: "20px 12px",
    borderTop: "1px solid #f5f5f5",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    borderRadius: 10,
    background: "#fdecea",
    color: "#c62828",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    width: "100%",
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
  toggleBtn: {
    height: 32,
    width: "100%",
    borderRadius: 8,
    background: "#f1f3f6",
    color: "#878787",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 16,
  },
};

export default Sidebar;
