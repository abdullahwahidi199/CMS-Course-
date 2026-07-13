import { useContext, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Bell,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Search,
  Settings,
  Moon,
  Sun,
  User,
  Users,
  X,
} from "lucide-react";
import { AuthContext } from "../../AuthProvider";
import usePermissions from "../../hooks/usePermissions";

const navItems = [
  { label: "Dashboard", path: "/teacher/dashboard", icon: LayoutDashboard, end: true },
  { label: "My Profile", path: "/teacher/dashboard/profile", icon: User },
  { label: "My Classes", path: "/teacher/dashboard/classes", icon: BookOpen, permission: "batches.view" },
  { label: "My Students", path: "/teacher/dashboard/students", icon: Users, permission: "students.view" },
  { label: "Attendance", path: "/teacher/dashboard/attendance", icon: CalendarCheck, permission: "attendance.view" },
  { label: "Marks", path: "/teacher/dashboard/marks", icon: GraduationCap, permission: "assessments.view" },
  { label: "Assessments", path: "/teacher/dashboard/assessments", icon: ClipboardCheck, permission: "assessments.view" },
  { label: "Exams", path: "/teacher/dashboard/exams", icon: GraduationCap, permission: "assessments.view" },
  { label: "Assignments", path: "/teacher/dashboard/assignments", icon: FileText, permission: "assessments.view" },
  { label: "Announcements", path: "/teacher/dashboard/announcements", icon: Megaphone },
  { label: "Notifications", path: "/teacher/dashboard/notifications", icon: Bell, permission: "notifications.view" },
  { label: "Timetable", path: "/teacher/dashboard/timetable", icon: CalendarDays, permission: "batches.view" },
  { label: "Settings", path: "/teacher/dashboard/settings", icon: Settings },
];

const pageTitles = Object.fromEntries(navItems.map((item) => [item.path, item.label]));

function TeacherSidebar({ items, onNavigate }) {
  const { user, logout } = useContext(AuthContext);
  const name = user?.profile?.name || [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username || "Teacher";

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
            <p className="truncate text-xs text-slate-400">Teacher Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
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

export default function TeacherDashboard() {
  const { user } = useContext(AuthContext);
  const { hasPermission } = usePermissions();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("teacher-dark-mode") === "true");
  const name = user?.profile?.name || user?.first_name || user?.username || "Teacher";
  const items = useMemo(() => navItems.filter((item) => !item.permission || hasPermission(item.permission)), [hasPermission]);
  const title = pageTitles[location.pathname] || "Teacher Portal";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("teacher-dark-mode", String(darkMode));
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="fixed inset-y-0 left-0 z-30 hidden w-72 lg:block">
        <TeacherSidebar items={items} />
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
          <TeacherSidebar items={items} onNavigate={() => setDrawerOpen(false)} />
        </aside>
      </div>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Teacher Portal</p>
              <h1 className="truncate text-base font-semibold text-slate-950 dark:text-white sm:text-lg">{title}</h1>
            </div>
            <label className="hidden min-w-64 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 md:flex">
              <Search size={16} />
              <input className="w-full bg-transparent outline-none" placeholder={`Search ${title.toLowerCase()}`} />
            </label>
            {hasPermission("notifications.view") ? (
              <NavLink to="/teacher/dashboard/notifications" className="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100" aria-label="Notifications">
                <Bell size={20} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cyan-600" />
              </NavLink>
            ) : null}
            <button
              type="button"
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => setDarkMode((value) => !value)}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
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
