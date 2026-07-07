import { useContext } from "react";
import { AuthContext } from "../../AuthProvider";

export default function Can({ permission, children, fallback = null }) {
  const { can } = useContext(AuthContext);
  return can(permission) ? children : fallback;
}
