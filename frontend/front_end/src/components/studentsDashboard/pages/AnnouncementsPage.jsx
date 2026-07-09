import { AnnouncementsPanel } from "../panel/InfoFeedPanel";
import StudentPageShell from "./StudentPageShell";

export default function AnnouncementsPage() {
  return (
    <StudentPageShell title="Announcements" description="Recent school updates and announcements.">
      <AnnouncementsPanel />
    </StudentPageShell>
  );
}
