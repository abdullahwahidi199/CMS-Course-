import DataTable from "../../shared/DataTable";
import { useApiResource } from "../../../hooks/useApiResource";
import TeacherPageShell from "./TeacherPageShell";

export default function TeacherMarksPage() {
  const results = useApiResource("/v1/assessment-results/");
  return (
    <TeacherPageShell title="Marks" description="Published and saved assessment results for your students.">
      <DataTable
        title="Student Marks"
        rows={results.results}
        loading={results.loading}
        error={results.error}
        empty="No marks found."
        columns={[
          { key: "student_name", label: "Student" },
          { key: "assessment_title", label: "Assessment" },
          { key: "course_name", label: "Course" },
          { key: "batch_name", label: "Batch" },
          { key: "marks_obtained", label: "Marks" },
          { key: "percentage", label: "%" },
          { key: "grade", label: "Grade" },
          { key: "is_passed", label: "Result", render: (row) => (row.is_passed ? "Pass" : "Needs work") },
        ]}
      />
    </TeacherPageShell>
  );
}
