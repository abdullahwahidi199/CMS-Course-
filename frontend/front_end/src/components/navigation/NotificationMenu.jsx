import { Bell } from "lucide-react";
import { useState } from "react";

export default function NotificationMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" onClick={() => setOpen((value) => !value)} aria-label="Notifications">
        <Bell size={20} />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-2 text-sm font-semibold text-slate-900">Notifications</div>
          <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">No urgent notifications.</div>
        </div>
      ) : null}
    </div>
  );
}
