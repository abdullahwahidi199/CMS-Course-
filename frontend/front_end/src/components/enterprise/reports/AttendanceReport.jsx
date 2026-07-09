import ReportDashboard from "./ReportDashboard";
import { reportConfigs } from "./reportConfigs";

export default function AttendanceReport() {
  return <ReportDashboard config={reportConfigs.attendance} />;
}
