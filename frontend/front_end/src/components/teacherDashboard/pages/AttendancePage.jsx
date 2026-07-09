import DataTable from "../../shared/DataTable";
import { useApiResource } from "../../../hooks/useApiResource";
import TeacherPageShell from "./TeacherPageShell";
import { statusBadge } from "./teacherUtils.jsx";

export default function TeacherAttendancePage() {
  const profile = useApiResource("/teacher/profile/");
  const sessions = useApiResource("/attendance-sessions/");
  const allowed = new Set((profile.data?.classes || []).map((item) => Number(item.id)));
  const rows = sessions.results.filter((row) => !allowed.size || allowed.has(Number(row.batch)));

  return (
    <TeacherPageShell title="Attendance" description="Attendance sessions for your assigned classes.">
      <DataTable
        title="Attendance Sessions"
        rows={rows}
        loading={profile.loading || sessions.loading}
        error={profile.error || sessions.error}
        empty="No attendance sessions found."
        columns={[
          { key: "date", label: "Date" },
          { key: "course_name", label: "Course" },
          { key: "batch_name", label: "Batch" },
          { key: "session_topic", label: "Topic" },
          { key: "present_count", label: "Present" },
          { key: "absent_count", label: "Absent" },
          { key: "attendance_percentage", label: "%" },
          { key: "status", label: "Status", render: (row) => statusBadge(row.status) },
        ]}
      />
    </TeacherPageShell>
  );
}
