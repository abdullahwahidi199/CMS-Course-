import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import MobileDrawer from "./navigation/MobileDrawer";
import Sidebar from "./navigation/Sidebar";
import TopNavbar from "./navigation/TopNavbar";

export default function AdminDashboard() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("ems-sidebar-collapsed");
    if (saved !== null) return saved === "true";
    return window.matchMedia?.("(max-width: 1279px)").matches || false;
  });

  useEffect(() => {
    localStorage.setItem("ems-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <div className="hidden shrink-0 lg:block">
        <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
      </div>
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavbar
          collapsed={collapsed}
          onMenuClick={() => setMobileOpen(true)}
          onToggleSidebar={() => setCollapsed((value) => !value)}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
