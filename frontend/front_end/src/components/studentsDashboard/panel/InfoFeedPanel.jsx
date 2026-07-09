import { useApiResource } from "../../../hooks/useApiResource";
import { EmptyState, PanelShell } from "./PanelShell";

export function AnnouncementsPanel() {
  const resource = useApiResource("/student/announcements/");
  const rows = resource.data?.announcements || [];
  return (
    <PanelShell title="Announcements" subtitle="Recent school updates." loading={resource.loading} error={resource.error}>
      <div className="space-y-3">
        {!rows.length ? <EmptyState>No announcements.</EmptyState> : null}
        {rows.map((row) => (
          <div key={row.id} className="rounded-md border border-gray-200 p-3">
            <p className="font-semibold text-gray-900">{row.title}</p>
            <p className="text-sm text-gray-500">{row.date}</p>
            <p className="mt-2 text-sm text-gray-700">{row.discription}</p>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

export function StudentNotificationsPanel() {
  const resource = useApiResource("/student/notifications/");
  const rows = resource.data?.notifications || [];
  return (
    <PanelShell title="Notifications" subtitle="Unread alerts and reminders." loading={resource.loading} error={resource.error}>
      <div className="space-y-3">
        {!rows.length ? <EmptyState>No notifications.</EmptyState> : null}
        {rows.slice(0, 6).map((row) => (
          <div key={row.id} className={`rounded-md border p-3 ${row.is_read ? "border-gray-200" : "border-cyan-200 bg-cyan-50"}`}>
            <p className="font-semibold text-gray-900">{row.title}</p>
            <p className="text-sm text-gray-700">{row.message}</p>
            <p className="mt-1 text-xs text-gray-500">{new Date(row.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}
