import DataTable from "../../shared/DataTable";
import { useApiResource } from "../../../hooks/useApiResource";
import { PanelShell } from "./PanelShell";

export default function AssessmentsPanel() {
  const resource = useApiResource("/student/assessments/");
  return (
    <PanelShell title="Assessments" subtitle="Scheduled, closed, and published assessments." loading={resource.loading} error={resource.error}>
      <DataTable
        title="Assessments"
        rows={resource.data?.assessments || []}
        pageSize={6}
        columns={[
          { key: "title", label: "Title" },
          { key: "type", label: "Type" },
          { key: "course", label: "Course" },
          { key: "batch", label: "Batch" },
          { key: "teacher", label: "Teacher" },
          { key: "date", label: "Date" },
          { key: "status", label: "Status" },
          { key: "marks_obtained", label: "Marks", render: (row) => (row.marks_obtained == null ? "-" : row.marks_obtained) },
          { key: "percentage", label: "%", render: (row) => (row.percentage == null ? "-" : `${row.percentage}%`) },
          { key: "grade", label: "Grade", render: (row) => row.grade || "-" },
        ]}
      />
    </PanelShell>
  );
}
