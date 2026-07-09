import AssessmentsPanel from "../panel/AssessmentsPanel";
import StudentPageShell from "./StudentPageShell";

export default function AssessmentsPage() {
  return (
    <StudentPageShell title="Assessments" description="Scheduled, closed, and published assessments.">
      <AssessmentsPanel />
    </StudentPageShell>
  );
}
