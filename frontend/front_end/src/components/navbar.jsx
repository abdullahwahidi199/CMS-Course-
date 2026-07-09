import { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthProvider";
import { mediaUrl } from "../utils/mediaUrl";

function Navbar() {
  const { user, menus, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const logo = mediaUrl(user?.tenant?.logo);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex h-full flex-col justify-between overflow-auto">
      <div>
        <div className="mb-8">
          <div className="flex items-center gap-3">
            {logo ? (
              <img
                src={logo}
                alt={user?.tenant?.name || "School logo"}
                className="h-10 w-10 rounded-md bg-white object-contain p-1"
              />
            ) : null}
            <div className="min-w-0 text-lg font-bold text-white">{user?.tenant?.name || "School ERP"}</div>
          </div>
          <div className="mt-1 text-sm text-gray-300">{user?.first_name || user?.username}</div>
          <div className="text-xs text-gray-400">{user?.role_details?.name || user?.role_slug}</div>
        </div>

        <ul className="space-y-1">
          {menus.map((item) => (
            <li key={`${item.path}-${item.permission}`}>
              <NavLink
                to={item.path}
                end={item.path === "/admin/dashboard"}
                className={({ isActive }) =>
                  `block rounded px-4 py-2 text-sm transition hover:bg-gray-700 ${
                    isActive ? "bg-gray-700 text-white" : "text-gray-300"
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      <button className="rounded px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default Navbar;
