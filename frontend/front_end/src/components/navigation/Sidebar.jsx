import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../../AuthProvider";
import { mediaUrl } from "../../utils/mediaUrl";
import { filterByPermission, isItemActive } from "./navUtils";
import { navigationModules } from "./navigationConfig";
import SidebarGroup from "./SidebarGroup";
import SidebarItem from "./SidebarItem";

export default function Sidebar({ collapsed, onCollapsedChange, onNavigate }) {
  const { user, can } = useContext(AuthContext);
  const location = useLocation();
  const [openGroup, setOpenGroup] = useState("");
  const modules = useMemo(() => filterByPermission(navigationModules, can), [can]);
  const logo = mediaUrl(user?.tenant?.logo);

  useEffect(() => {
    const activeGroup = modules.find((item) => item.children?.length && isItemActive(item, location.pathname));
    if (activeGroup) setOpenGroup(activeGroup.label);
  }, [location.pathname, modules]);

  return (
    <aside className={`flex h-full flex-col bg-slate-950 text-white transition-all duration-300 ${collapsed ? "w-20" : "w-72"}`}>
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-4">
        {logo ? <img src={logo} alt={user?.tenant?.name || "School logo"} className="h-9 w-9 rounded-md bg-white object-contain p-1" /> : <div className="h-9 w-9 rounded-md bg-cyan-600" />}
        {!collapsed ? (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{user?.tenant?.name || "School ERP"}</div>
            <div className="truncate text-xs text-slate-400">{user?.role_details?.name || user?.role_slug || "Admin"}</div>
          </div>
        ) : null}
        <button
          className="ml-auto hidden rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:block"
          onClick={() => onCollapsedChange(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {modules.map((item) =>
          item.children?.length ? (
            <SidebarGroup
              key={item.label}
              item={item}
              collapsed={collapsed}
              open={openGroup === item.label}
              onToggle={() => setOpenGroup((current) => (current === item.label ? "" : item.label))}
              onNavigate={onNavigate}
            />
          ) : (
            <SidebarItem key={item.label} item={item} collapsed={collapsed} active={isItemActive(item, location.pathname)} onClick={onNavigate} />
          ),
        )}
      </nav>
    </aside>
  );
}
