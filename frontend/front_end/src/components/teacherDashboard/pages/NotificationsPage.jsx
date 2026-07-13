import { useMemo, useState } from "react";
import { Bell, CheckCheck, Megaphone, Search } from "lucide-react";
import instance from "../../../api/axiosInstance";
import { useApiResource } from "../../../hooks/useApiResource";
import TeacherPageShell from "./TeacherPageShell";
import { EmptyState, ErrorState, LoadingSkeleton, Panel, StatTile, Toast } from "./TeacherUi";
import { buttonClass, formatDate, inputClass, normalizeList, statusBadge } from "./teacherUtils.jsx";

export default function TeacherNotificationsPage() {
  const notifications = useApiResource("/v1/notifications/");
  const [filters, setFilters] = useState({ search: "", type: "", read: "" });
  const [toast, setToast] = useState(null);
  const rows = normalizeList(notifications.data);

  const visible = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return rows.filter((item) => {
      const matchesSearch = !term || [item.title, item.message, item.notification_type].join(" ").toLowerCase().includes(term);
      const matchesType = !filters.type || item.notification_type === filters.type;
      const matchesRead = filters.read === "" || String(item.is_read) === filters.read;
      return matchesSearch && matchesType && matchesRead;
    });
  }, [filters, rows]);

  const types = [...new Set(rows.map((item) => item.notification_type).filter(Boolean))];

  const markRead = async (item) => {
    await instance.post(`/v1/notifications/${item.id}/mark-read/`);
    setToast({ message: "Notification marked as read." });
    await notifications.refetch();
  };

  const markAllRead = async () => {
    await instance.post("/v1/notifications/mark-all-read/");
    setToast({ message: "All notifications marked as read." });
    await notifications.refetch();
  };

  return (
    <TeacherPageShell
      title="Notifications"
      description="Announcements, assignments, submissions, schedule changes, and exam reminders."
      actions={<button type="button" className={buttonClass()} onClick={markAllRead}><CheckCheck size={16} /> Mark All Read</button>}
    >
      <ErrorState message={notifications.error} />
      {notifications.loading ? (
        <LoadingSkeleton rows={5} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile icon={Bell} label="Total" value={rows.length} helper="All notifications" />
            <StatTile icon={Megaphone} label="Unread" value={rows.filter((item) => !item.is_read).length} helper="Need attention" tone="amber" />
            <StatTile icon={Search} label="Visible" value={visible.length} helper="After filters" tone="emerald" />
            <StatTile icon={CheckCheck} label="Types" value={types.length} helper="Notification groups" tone="violet" />
          </div>

          <Panel title="Search And Filters">
            <div className="grid gap-3 md:grid-cols-[1fr_180px_160px]">
              <input className={inputClass()} placeholder="Search notifications" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
              <select className={inputClass()} value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
                <option value="">All types</option>
                {types.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <select className={inputClass()} value={filters.read} onChange={(event) => setFilters({ ...filters, read: event.target.value })}>
                <option value="">All</option>
                <option value="false">Unread</option>
                <option value="true">Read</option>
              </select>
            </div>
          </Panel>

          <Panel title="Notification Center" description={`${visible.length} messages`}>
            {visible.length ? (
              <div className="space-y-3">
                {visible.map((item) => (
                  <article key={item.id} className={`rounded-md border p-4 dark:border-slate-800 ${item.is_read ? "border-slate-200 bg-white dark:bg-slate-900" : "border-cyan-200 bg-cyan-50/60 dark:bg-cyan-950/30"}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-950 dark:text-white">{item.title}</h3>
                          {statusBadge(item.is_read ? "closed" : "active")}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.message}</p>
                        <p className="mt-2 text-xs text-slate-500">{item.notification_type || "notification"} / {formatDate(item.created_at)}</p>
                      </div>
                      {!item.is_read ? <button type="button" className={buttonClass("secondary")} onClick={() => markRead(item)}>Mark Read</button> : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="No notifications found" description="Try changing filters or check back later." />
            )}
          </Panel>
        </>
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </TeacherPageShell>
  );
}
