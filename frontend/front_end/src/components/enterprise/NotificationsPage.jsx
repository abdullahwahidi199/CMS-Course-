import DataTable from "../shared/DataTable";
import PageHeader from "../shared/PageHeader";
import { useApiResource } from "../../hooks/useApiResource";

export default function NotificationsPage() {
  const { results, loading, error } = useApiResource("/v1/notifications/");
  const columns = [
    { key: "title", label: "Title" },
    { key: "notification_type", label: "Type" },
    { key: "message", label: "Message" },
    { key: "is_read", label: "Read", render: (row) => (row.is_read ? "Yes" : "No") },
    { key: "created_at", label: "Created" },
  ];

  return (
    <div>
      <PageHeader title="Notifications" description="Assessment, fee, payment, inventory, and exam reminders." />
      <DataTable columns={columns} rows={results} loading={loading} error={error} />
    </div>
  );
}

