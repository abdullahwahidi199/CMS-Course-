import { Menu, Search } from "lucide-react";
import { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../AuthProvider";
import Breadcrumbs, { usePageTitle } from "./Breadcrumbs";
import NotificationMenu from "./NotificationMenu";
import QuickActions from "./QuickActions";
import UserMenu from "./UserMenu";
import { filterByPermission } from "./navUtils";
import { navigationModules } from "./navigationConfig";

export default function TopNavbar({ onMenuClick, collapsed, onToggleSidebar }) {
  const { can } = useContext(AuthContext);
  const title = usePageTitle();
  const [query, setQuery] = useState("");
  const searchableItems = useMemo(() => {
    const modules = filterByPermission(navigationModules, can);
    return modules.flatMap((item) => [item, ...(item.children || [])]).filter((item) => item.path);
  }, [can]);
  const searchResults = query.trim()
    ? searchableItems.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : [];
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <button className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={onMenuClick} aria-label="Open navigation">
          <Menu size={22} />
        </button>
        <button className="hidden rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:block" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <Menu size={20} className={collapsed ? "" : "rotate-180 transition-transform"} />
        </button>

        <div className="min-w-0 flex-1">
          <Breadcrumbs />
          <h1 className="truncate text-lg font-semibold text-slate-950">{title}</h1>
        </div>

        <div className="relative hidden xl:block">
          <label className="flex min-w-72 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            <Search size={16} />
            <input className="w-full bg-transparent outline-none" placeholder="Search existing pages..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          {searchResults.length ? (
            <div className="absolute right-0 z-50 mt-2 w-full rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
              {searchResults.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={`${item.label}-${item.path}`} to={item.path} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" onClick={() => setQuery("")}>
                    <Icon size={16} /> {item.label}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>

        <QuickActions />

        <NotificationMenu />
        <UserMenu />
      </div>
    </header>
  );
}
