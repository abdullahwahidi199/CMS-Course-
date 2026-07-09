import ReportDashboard from "./ReportDashboard";
import { reportConfigs } from "./reportConfigs";

export default function AssessmentReport() {
  return <ReportDashboard config={reportConfigs.assessments} />;
}
