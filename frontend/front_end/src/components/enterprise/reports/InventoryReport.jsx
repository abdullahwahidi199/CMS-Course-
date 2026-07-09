import ReportDashboard from "./ReportDashboard";
import { reportConfigs } from "./reportConfigs";

export default function InventoryReport() {
  return <ReportDashboard config={reportConfigs.inventory} />;
}
