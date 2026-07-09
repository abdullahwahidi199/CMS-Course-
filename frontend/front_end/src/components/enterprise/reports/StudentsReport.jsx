import ReportDashboard from "./ReportDashboard";
import { reportConfigs } from "./reportConfigs";

export default function StudentsReport() {
  return <ReportDashboard config={reportConfigs.students} />;
}
