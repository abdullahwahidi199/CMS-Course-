import { ChevronRight } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function SidebarItem({ item, collapsed, active, onClick }) {
  const Icon = item.icon;
  const content = (
    <>
      <Icon size={20} className="shrink-0" />
      {!collapsed ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
      {!collapsed && item.children?.length ? <ChevronRight size={16} className="shrink-0 text-slate-400" /> : null}
    </>
  );
  const className = `group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
    active ? "bg-cyan-700 text-white shadow-sm" : "text-slate-300 hover:bg-slate-800 hover:text-white"
  } ${collapsed ? "justify-center" : ""}`;

  if (item.path && !item.children?.length) {
    return (
      <NavLink to={item.path} end={item.end} title={collapsed ? item.label : undefined} className={className} onClick={onClick}>
        {content}
      </NavLink>
    );
  }

  return (
    <button type="button" title={collapsed ? item.label : undefined} className={className} onClick={onClick}>
      {content}
    </button>
  );
}
