import DataTable from "../../shared/DataTable";
import { useApiResource } from "../../../hooks/useApiResource";
import { PanelShell, StatTile } from "./PanelShell";

export default function AttendancePanel() {
  const resource = useApiResource("/student/attendance/");
  const data = resource.data || {};
  const summary = data.summary || {};
  return (
    <PanelShell title="Attendance" subtitle="Attendance summary by course and recent records." loading={resource.loading} error={resource.error}>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Rate" value={`${summary.percentage || 0}%`} />
        <StatTile label="Present" value={summary.present || 0} />
        <StatTile label="Absent" value={summary.absent || 0} />
        <StatTile label="Total Records" value={summary.total || 0} />
      </div>
      <DataTable
        title="Recent Attendance"
        rows={data.history || []}
        pageSize={6}
        columns={[
          { key: "date", label: "Date" },
          { key: "course", label: "Course" },
          { key: "batch", label: "Batch" },
          { key: "status", label: "Status" },
        ]}
      />
    </PanelShell>
  );
}
