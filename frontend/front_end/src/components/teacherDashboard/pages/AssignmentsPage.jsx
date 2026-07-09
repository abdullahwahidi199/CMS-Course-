import { Link } from "react-router-dom";
import DataTable from "../../shared/DataTable";
import { useApiResource } from "../../../hooks/useApiResource";
import TeacherPageShell from "./TeacherPageShell";
import { classIds, normalizeList, statusBadge } from "./teacherUtils.jsx";

export default function TeacherAssignmentsPage() {
  const profile = useApiResource("/teacher/profile/");
  const assignments = useApiResource("/assignments/");
  const allowed = classIds(profile.data);
  const rows = normalizeList(assignments.data).filter((row) => !allowed.size || allowed.has(Number(row.class_assigned)));

  return (
    <TeacherPageShell title="Assignments" description="Assigned coursework, due dates, and submission grading.">
      <DataTable
        title="Assignments"
        rows={rows}
        loading={profile.loading || assignments.loading}
        error={profile.error || assignments.error}
        empty="No assignments found."
        columns={[
          { key: "title", label: "Title" },
          { key: "class_assigned", label: "Class ID" },
          { key: "due_date", label: "Due Date" },
          { key: "total_marks", label: "Marks" },
          { key: "submissions", label: "Submissions", accessor: (row) => row.submissions?.length || 0 },
          { key: "status", label: "Status", accessor: (row) => (new Date(row.due_date) < new Date() ? "closed" : "active"), render: (row) => statusBadge(new Date(row.due_date) < new Date() ? "closed" : "active") },
        ]}
        actions={(row) => [{ label: "Open", onClick: () => { window.location.href = `/teacher/dashboard/assignment/${row.id}`; } }]}
      />
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
        Open a class from <Link className="font-medium text-cyan-700" to="/teacher/dashboard/classes">My Classes</Link> to create a new assignment for that batch.
      </div>
    </TeacherPageShell>
  );
}
