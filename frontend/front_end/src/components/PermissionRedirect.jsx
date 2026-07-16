import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../AuthProvider";
import { firstAccessiblePath, firstAccessibleTeacherPath } from "../routes/appRoutes";
import EnterpriseDashboard from "./enterprise/EnterpriseDashboard";

const SUPER_ADMIN_DASHBOARD = "/super-admin/dashboard";

export default function PermissionRedirect() {
  const { user, permissions, initializing } = useContext(AuthContext);

  if (initializing) return <div className="p-6 text-sm text-gray-500">Restoring session...</div>;
  if (!user) return <Navigate to="/" replace />;

  const roleSlug = user.role_slug || user.role_details?.slug;
  if (roleSlug === "super-admin" || roleSlug === "super_admin") return <Navigate to={SUPER_ADMIN_DASHBOARD} replace />;
  if (roleSlug === "teacher") return <Navigate to={firstAccessibleTeacherPath(permissions)} replace />;
  if (roleSlug === "student") return <Navigate to="/student/dashboard" replace />;

  const path = firstAccessiblePath(permissions);
  if (path === "/admin/dashboard") return <EnterpriseDashboard />;
  return <Navigate to={path} replace />;
}
