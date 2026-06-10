import { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../AuthProvider";
import instance from "../api/axiosInstance";

export default function ProtectedRoute({ children, roles }) {
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        // Super admins bypass the subscription check
        if (!user || user.role === "super_admin") {
          return;
        }

        const response = await instance.get("/get-tenant/");
        
        const expiryDate = response.data.subscription_expiry;

        if (expiryDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const expiry = new Date(expiryDate);

          if (expiry < today) {
            setExpired(true);
          }
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user]);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (loading && user.role !== "super_admin") {
    return <div>Loading...</div>;
  }

  if (expired) {
    return <Navigate to="/subscription-expired" replace />;
  }

  return children;
}
