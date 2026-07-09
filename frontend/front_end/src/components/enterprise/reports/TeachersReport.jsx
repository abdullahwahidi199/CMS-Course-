import ReportDashboard from "./ReportDashboard";
import { reportConfigs } from "./reportConfigs";

export default function TeachersReport() {
  return <ReportDashboard config={reportConfigs.teachers} />;
}
