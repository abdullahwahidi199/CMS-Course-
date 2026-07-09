import { NavLink, useLocation } from "react-router-dom";
import SidebarItem from "./SidebarItem";
import { isItemActive } from "./navUtils";

export default function SidebarGroup({ item, collapsed, open, onToggle, onNavigate }) {
  const location = useLocation();
  const active = isItemActive(item, location.pathname);

  return (
    <div className="relative">
      <SidebarItem item={item} collapsed={collapsed} active={active} onClick={onToggle} />
      {open && !collapsed ? (
        <div className="mt-1 space-y-1 rounded-md bg-slate-950/50 p-1">
          {item.children.map((child) => {
            const Icon = child.icon;
            return (
              <NavLink
                key={`${child.label}-${child.path}`}
                to={child.path}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                    isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <Icon size={16} />
                <span className="truncate">{child.label}</span>
              </NavLink>
            );
          })}
        </div>
      ) : null}
      {open && collapsed ? (
        <div className="absolute left-full top-0 z-40 ml-3 w-72 rounded-lg border border-slate-800 bg-slate-950 p-3 shadow-2xl">
          <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</div>
          <div className="grid gap-1">
            {item.children.map((child) => {
              const Icon = child.icon;
              return (
                <NavLink
                  key={`${child.label}-${child.path}`}
                  to={child.path}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                      isActive ? "bg-cyan-700 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  <Icon size={17} />
                  <span>{child.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
