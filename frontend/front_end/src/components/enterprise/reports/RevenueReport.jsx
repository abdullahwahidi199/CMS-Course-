import ReportDashboard from "./ReportDashboard";
import { reportConfigs } from "./reportConfigs";

export default function RevenueReport() {
  return <ReportDashboard config={reportConfigs.revenue} />;
}
