import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";

const AdminLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(
    JSON.parse(localStorage.getItem("sidebarCollapsed") || "false")
  );

  // Sync with sidebar state changes (simulated)
  useEffect(() => {
    const handleStorage = () => {
      const state = JSON.parse(localStorage.getItem("sidebarCollapsed") || "false");
      setIsCollapsed(state);
    };
    window.addEventListener("storage", handleStorage);
    // Poll for changes since storage event only fires from other tabs
    const interval = setInterval(handleStorage, 500);
    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  return (
    <div style={s.layout}>
      <Sidebar />
      <div 
        style={{ 
          ...s.content, 
          marginLeft: isCollapsed ? 80 : 260 
        }}
      >
        {children}
      </div>
    </div>
  );
};

const s = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    background: "#F1F3F6",
  },
  content: {
    flex: 1,
    transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    minWidth: 0, // Prevent overflow issues
  },
};

export default AdminLayout;
