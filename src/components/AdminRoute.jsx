import { Navigate } from "react-router-dom";
import { useRole } from "../hooks/useRole";

export default function AdminRoute({ children }) {
  const { role, loading } = useRole();
  if (loading) return <div style={{ padding: 30 }}>Loading...</div>;
  if (role !== "superadmin") return <Navigate to="/dashboard" replace />;
  return children;
}
