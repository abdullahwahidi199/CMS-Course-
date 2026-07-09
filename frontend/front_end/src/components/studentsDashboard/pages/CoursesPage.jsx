import EnrollmentsPanel from "../panel/EnrollmentsPanel";
import StudentPageShell from "./StudentPageShell";

export default function CoursesPage() {
  return (
    <StudentPageShell title="My Courses" description="Current and historical course enrollments.">
      <EnrollmentsPanel />
    </StudentPageShell>
  );
}
