import { StudentNotificationsPanel } from "../panel/InfoFeedPanel";
import StudentPageShell from "./StudentPageShell";

export default function NotificationsPage() {
  return (
    <StudentPageShell title="Notifications" description="Alerts and reminders from your education center.">
      <StudentNotificationsPanel />
    </StudentPageShell>
  );
}
