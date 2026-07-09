import { Plus } from "lucide-react";
import { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../AuthProvider";
import { filterByPermission } from "./navUtils";
import { quickActions } from "./navigationConfig";

export default function QuickActions() {
  const { can } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const actions = useMemo(() => filterByPermission(quickActions, can), [can]);

  if (!actions.length) return null;

  return (
    <div className="relative">
      <button className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-800" onClick={() => setOpen((value) => !value)}>
        <Plus size={16} /> <span className="hidden sm:inline">Quick Actions</span>
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} to={action.path} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" onClick={() => setOpen(false)}>
                <Icon size={16} /> {action.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
