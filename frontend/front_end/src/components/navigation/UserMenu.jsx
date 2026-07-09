import { LogOut, Settings, User } from "lucide-react";
import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../AuthProvider";

export default function UserMenu() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const items = [
    { label: "About Me", icon: User, path: "/admin/dashboard/about-me" },
    { label: "Settings", icon: Settings, path: "/admin/dashboard/settings" },
  ];

  return (
    <div className="relative">
      <button className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100" onClick={() => setOpen((value) => !value)}>
        <div className="grid h-8 w-8 place-items-center rounded-full bg-cyan-700 text-sm font-semibold text-white">
          {(user?.first_name || user?.username || "U").slice(0, 1).toUpperCase()}
        </div>
        <div className="hidden min-w-0 text-left lg:block">
          <div className="truncate text-sm font-semibold text-slate-900">{user?.first_name || user?.username || "User"}</div>
          <div className="truncate text-xs text-slate-500">{user?.role_details?.name || user?.role_slug}</div>
        </div>
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} to={item.path} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" onClick={() => setOpen(false)}>
                <Icon size={16} /> {item.label}
              </Link>
            );
          })}
          <button className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
