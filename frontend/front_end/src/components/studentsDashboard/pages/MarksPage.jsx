import MarksPanel from "../panel/MarksPanel";
import StudentPageShell from "./StudentPageShell";

export default function MarksPage() {
  return (
    <StudentPageShell title="Marks & Results" description="Published marks, grades, GPA, and performance summary.">
      <MarksPanel />
    </StudentPageShell>
  );
}
