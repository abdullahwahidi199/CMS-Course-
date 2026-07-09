import { Bell, CheckCheck } from "lucide-react";
import DataTable from "../shared/DataTable";
import PageHeader from "../shared/PageHeader";
import { apiPost, useApiResource } from "../../hooks/useApiResource";

function typeLabel(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function NotificationsPage() {
  const notifications = useApiResource("/v1/notifications/");
  const rows = notifications.results;
  const unread = rows.filter((row) => !row.is_read).length;

  const markRead = async (row) => {
    await apiPost(`/v1/notifications/${row.id}/mark-read/`);
    await notifications.refetch();
  };

  const markAllRead = async () => {
    await apiPost("/v1/notifications/mark-all-read/");
    await notifications.refetch();
  };

  const columns = [
    {
      key: "title",
      label: "Title",
      render: (row) => (
        <span className={row.is_read ? "text-gray-600" : "font-semibold text-gray-900"}>
          {row.title}
        </span>
      ),
    },
    {
      key: "notification_type",
      label: "Type",
      render: (row) => typeLabel(row.notification_type),
    },
    { key: "message", label: "Message" },
    {
      key: "is_read",
      label: "Status",
      render: (row) => (row.is_read ? "Read" : "Unread"),
    },
    {
      key: "created_at",
      label: "Created",
      render: (row) => new Date(row.created_at).toLocaleString(),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Assessment, fee, payment, inventory, and exam reminders." />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Bell size={16} />
            Total
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{rows.length}</p>
        </div>
        <div className="rounded-md bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Bell size={16} />
            Unread
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{unread}</p>
        </div>
        <div className="rounded-md bg-white p-4 shadow-sm">
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            onClick={markAllRead}
            disabled={!unread}
          >
            <CheckCheck size={16} />
            Mark All Read
          </button>
        </div>
      </div>

      <DataTable
        title="Notifications"
        columns={columns}
        rows={rows}
        loading={notifications.loading}
        error={notifications.error}
        empty="No notifications yet"
        actions={(row) =>
          row.is_read
            ? []
            : [
                {
                  label: "Mark read",
                  onClick: () => markRead(row),
                },
              ]
        }
      />
    </div>
  );
}
