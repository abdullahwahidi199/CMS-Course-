import ReportDashboard from "./ReportDashboard";
import { reportConfigs } from "./reportConfigs";

export default function StationerySalesReport() {
  return <ReportDashboard config={reportConfigs.stationerySales} />;
}
