import DataTable from "../../shared/DataTable";
import { useApiResource } from "../../../hooks/useApiResource";
import TeacherPageShell from "./TeacherPageShell";
import { statusBadge } from "./teacherUtils.jsx";

export default function TeacherNotificationsPage() {
  const notifications = useApiResource("/v1/notifications/");
  return (
    <TeacherPageShell title="Notifications" description="Messages and operational alerts from your education center.">
      <DataTable
        title="Notifications"
        rows={notifications.results}
        loading={notifications.loading}
        error={notifications.error}
        empty="No notifications found."
        columns={[
          { key: "title", label: "Title" },
          { key: "message", label: "Message" },
          { key: "notification_type", label: "Type" },
          { key: "created_at", label: "Date" },
          { key: "is_read", label: "Status", render: (row) => statusBadge(row.is_read ? "closed" : "active") },
        ]}
      />
    </TeacherPageShell>
  );
}
