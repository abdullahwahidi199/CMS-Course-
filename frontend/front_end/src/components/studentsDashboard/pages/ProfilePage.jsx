import StudentProfilePanel from "../panel/StudentProfilePanel";
import StudentPageShell from "./StudentPageShell";

export default function ProfilePage() {
  return (
    <StudentPageShell title="My Profile" description="Identity, contact, guardian, and enrollment information.">
      <StudentProfilePanel />
    </StudentPageShell>
  );
}
