import AttendancePanel from "../panel/AttendancePanel";
import StudentPageShell from "./StudentPageShell";

export default function AttendancePage() {
  return (
    <StudentPageShell title="Attendance" description="Attendance rate, summary, and recent attendance records.">
      <AttendancePanel />
    </StudentPageShell>
  );
}
