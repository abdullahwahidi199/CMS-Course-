import StudentProfilePanel from "../panel/StudentProfilePanel";
import StudentPageShell from "./StudentPageShell";

export default function StudentSettingsPage() {
  return (
    <StudentPageShell title="Settings" description="Account information and student profile settings.">
      <StudentProfilePanel />
    </StudentPageShell>
  );
}
