import DataTable from "../../shared/DataTable";
import { useApiResource } from "../../../hooks/useApiResource";
import { PanelShell } from "./PanelShell";

export default function AssignmentsPanel() {
  const resource = useApiResource("/student/assignments/");
  return (
    <PanelShell title="Assignments" subtitle="Homework, due dates, submission status, and feedback." loading={resource.loading} error={resource.error}>
      <DataTable
        title="Assignments"
        rows={resource.data?.assignments || []}
        pageSize={6}
        columns={[
          { key: "title", label: "Title" },
          { key: "course", label: "Course" },
          { key: "batch", label: "Batch" },
          { key: "due_date", label: "Due" },
          { key: "total_marks", label: "Marks" },
          { key: "status", label: "Status", accessor: (row) => row.submission?.status || "pending" },
          { key: "marks_obtained", label: "Score", accessor: (row) => row.submission?.marks_obtained ?? "-" },
          { key: "suggestion", label: "Feedback", accessor: (row) => row.submission?.suggestion || "-" },
        ]}
      />
    </PanelShell>
  );
}
