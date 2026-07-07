import { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../AuthProvider";
import instance from "../api/axiosInstance";

export default function ProtectedRoute({ children, roles, permission }) {
  const { user, initializing, can } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      if (initializing) return;
      try {
        if (!user || user.role_slug === "super-admin" || user.role_slug === "super_admin") {
          setLoading(false);
          return;
        }
        const response = await instance.get("/get-tenant/");
        const expiryDate = response.data.subscription_expiry;
        if (expiryDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (new Date(expiryDate) < today) setExpired(true);
        }
      } finally {
        setLoading(false);
      }
    };
    checkSubscription();
  }, [initializing, user]);

  if (initializing) return <div className="p-6 text-sm text-gray-500">Restoring session...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role_slug)) return <Navigate to="/" replace />;
  if (permission && !can(permission)) return <Navigate to="/admin/dashboard" replace />;
  if (loading && user.role_slug !== "super-admin" && user.role_slug !== "super_admin") return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  if (expired) return <Navigate to="/subscription-expired" replace />;

  return children;
}
