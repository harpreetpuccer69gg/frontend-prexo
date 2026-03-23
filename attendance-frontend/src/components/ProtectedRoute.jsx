import { Navigate } from "react-router-dom";

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

// requiredRole: "tl" | "admin"
function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/login" replace />;

  const payload = parseJwt(token);

  if (!payload || payload.exp * 1000 < Date.now()) {
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }

  const role = payload.role || "tl";

  if (role !== requiredRole) {
    return <Navigate to={role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  return children;
}

export default ProtectedRoute;
