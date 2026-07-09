import AssignmentsPanel from "../panel/AssignmentsPanel";
import StudentPageShell from "./StudentPageShell";

export default function AssignmentsPage() {
  return (
    <StudentPageShell title="Assignments" description="Homework, submission status, scores, and feedback.">
      <AssignmentsPanel />
    </StudentPageShell>
  );
}
