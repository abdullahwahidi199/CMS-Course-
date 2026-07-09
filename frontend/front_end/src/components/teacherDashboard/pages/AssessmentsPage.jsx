import DataTable from "../../shared/DataTable";
import { useApiResource } from "../../../hooks/useApiResource";
import TeacherPageShell from "./TeacherPageShell";
import { statusBadge } from "./teacherUtils.jsx";

export default function TeacherAssessmentsPage() {
  const assessments = useApiResource("/v1/assessments/");
  const rows = assessments.results;

  return (
    <TeacherPageShell title="Assessments" description="Assessments assigned to you, their publication status, and grading progress.">
      <DataTable
        title="My Assessments"
        rows={rows}
        loading={assessments.loading}
        error={assessments.error}
        empty="No assessments found."
        columns={[
          { key: "title", label: "Title" },
          { key: "batch_name", label: "Batch" },
          { key: "assessment_type", label: "Type" },
          { key: "assessment_date", label: "Date" },
          { key: "maximum_marks", label: "Max" },
          { key: "results", label: "Marked", accessor: (row) => row.results?.length || 0 },
          { key: "status", label: "Status", render: (row) => statusBadge(row.status) },
        ]}
      />
    </TeacherPageShell>
  );
}
