import { useContext } from "react";
import { AuthContext } from "../AuthProvider";

export default function usePermissions() {
  const { permissions, can, user } = useContext(AuthContext);

  return {
    permissions,
    hasPermission: can,
    hasAnyPermission: (items = []) => items.some((permission) => can(permission)),
    hasAllPermissions: (items = []) => items.every((permission) => can(permission)),
    hasRole: (roles = []) => roles.includes(user?.role_slug),
  };
}
