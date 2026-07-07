import { Download } from "lucide-react";
import PageHeader from "../shared/PageHeader";

const reports = [
  ["Attendance", "/v1/reports/attendance/?export=csv"],
  ["Assessments", "/v1/reports/assessments/?export=csv"],
  ["Fees", "/v1/reports/fees/?export=csv"],
  ["Revenue", "/v1/reports/revenue/?export=csv"],
  ["Students", "/v1/reports/students/?export=csv"],
  ["Teachers", "/v1/reports/teachers/?export=csv"],
  ["Inventory", "/v1/reports/inventory/?export=csv"],
  ["Stationery Sales", "/v1/reports/stationery-sales/?export=csv"],
];

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Reports" description="Operational exports for attendance, academics, billing, revenue, and inventory." />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {reports.map(([label, href]) => (
          <a
            key={label}
            href={`${import.meta.env.VITE_API_URL}${href}`}
            className="flex items-center justify-between rounded-md bg-white p-4 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50"
          >
            {label}
            <Download className="h-4 w-4 text-gray-500" />
          </a>
        ))}
      </div>
    </div>
  );
}

