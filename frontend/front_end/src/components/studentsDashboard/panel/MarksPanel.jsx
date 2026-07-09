import DataTable from "../../shared/DataTable";
import { useApiResource } from "../../../hooks/useApiResource";
import { PanelShell, StatTile } from "./PanelShell";

export default function MarksPanel() {
  const resource = useApiResource("/student/marks/");
  const data = resource.data || {};
  const summary = data.summary || {};
  return (
    <PanelShell title="Marks and Performance" subtitle="Published assessment results and course averages." loading={resource.loading} error={resource.error}>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Average" value={`${summary.average_score || 0}%`} />
        <StatTile label="Highest" value={`${summary.highest_score || 0}%`} />
        <StatTile label="Lowest" value={`${summary.lowest_score || 0}%`} />
        <StatTile label="GPA" value={summary.gpa || 0} />
      </div>
      <DataTable
        title="Mark Sheet"
        rows={data.results || []}
        pageSize={6}
        columns={[
          { key: "assessment", label: "Assessment" },
          { key: "course", label: "Course" },
          { key: "marks_obtained", label: "Marks" },
          { key: "maximum_marks", label: "Max" },
          { key: "percentage", label: "%" },
          { key: "grade", label: "Grade" },
          { key: "is_passed", label: "Result", render: (row) => (row.is_passed ? "Passed" : "Needs work") },
        ]}
      />
    </PanelShell>
  );
}
