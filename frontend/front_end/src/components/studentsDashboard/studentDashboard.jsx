import { useContext, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Bell,
  BookOpen,
  CalendarCheck,
  ClipboardCheck,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
  X,
} from "lucide-react";
import { AuthContext } from "../../AuthProvider";

const navItems = [
  { label: "Dashboard", path: "/student/dashboard", icon: LayoutDashboard, end: true },
  { label: "My Profile", path: "/student/dashboard/profile", icon: User },
  { label: "My Courses", path: "/student/dashboard/courses", icon: BookOpen },
  { label: "Attendance", path: "/student/dashboard/attendance", icon: CalendarCheck },
  { label: "Marks & Results", path: "/student/dashboard/marks", icon: GraduationCap },
  { label: "Assessments", path: "/student/dashboard/assessments", icon: ClipboardCheck },
  { label: "Assignments", path: "/student/dashboard/assignments", icon: FileText },
  { label: "Fees & Payments", path: "/student/dashboard/fees", icon: CreditCard },
  { label: "Notifications", path: "/student/dashboard/notifications", icon: Bell },
  { label: "Announcements", path: "/student/dashboard/announcements", icon: FileText },
  { label: "Settings", path: "/student/dashboard/settings", icon: Settings },
];

const pageTitles = Object.fromEntries(navItems.map((item) => [item.path, item.label]));

function StudentSidebar({ onNavigate }) {
  const { user, logout } = useContext(AuthContext);
  const name = user?.first_name || user?.username || "Student";

  const handleLogout = async () => {
    await logout();
    window.location.assign("/");
  };

  return (
    <aside className="flex h-full flex-col bg-slate-950 text-white">
      <div className="border-b border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-600 text-lg font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-slate-400">Student Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? "bg-cyan-700 text-white shadow-sm" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default function StudentsDashboard() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const name = user?.first_name || user?.username || "Student";
  const title = pageTitles[location.pathname] || "Student Portal";

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="fixed inset-y-0 left-0 z-30 hidden w-72 lg:block">
        <StudentSidebar />
      </div>

      <div className={`fixed inset-0 z-50 lg:hidden ${drawerOpen ? "" : "pointer-events-none"}`}>
        <button
          className={`absolute inset-0 bg-slate-950/50 transition-opacity ${drawerOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setDrawerOpen(false)}
          aria-label="Close navigation"
        />
        <aside className={`absolute inset-y-0 left-0 w-80 max-w-[88vw] transition-transform duration-300 ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <button
            onClick={() => setDrawerOpen(false)}
            className="absolute right-3 top-3 z-10 rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
          <StudentSidebar onNavigate={() => setDrawerOpen(false)} />
        </aside>
      </div>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Student Portal</p>
              <h1 className="truncate text-base font-semibold text-slate-950 sm:text-lg">{title}</h1>
            </div>
            <label className="hidden min-w-64 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 md:flex">
              <Search size={16} />
              <input className="w-full bg-transparent outline-none" placeholder={`Search ${title.toLowerCase()}`} />
            </label>
            <NavLink to="/student/dashboard/notifications" className="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100" aria-label="Notifications">
              <Bell size={20} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cyan-600" />
            </NavLink>
            <div className="hidden h-9 w-9 place-items-center rounded-full bg-cyan-700 text-sm font-bold text-white sm:grid">
              {name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] p-4 pb-10 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
