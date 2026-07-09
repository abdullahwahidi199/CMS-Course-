import ReportDashboard from "./ReportDashboard";
import { reportConfigs } from "./reportConfigs";

export default function FeesReport() {
  return <ReportDashboard config={reportConfigs.fees} />;
}
