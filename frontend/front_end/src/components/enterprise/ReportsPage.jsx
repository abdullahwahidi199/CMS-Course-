import {
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  Download,
  GraduationCap,
  PackageSearch,
  ReceiptText,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import instance from "../../api/axiosInstance";
import PageHeader from "../shared/PageHeader";

const reports = [
  { label: "Attendance Report", path: "attendance", endpoint: "/v1/reports/attendance/", icon: ClipboardCheck, description: "Daily presence, absence, class, teacher, and student attendance trends." },
  { label: "Assessments Report", path: "assessments", endpoint: "/v1/reports/assessments/", icon: BookOpenCheck, description: "Exam, quiz, assignment, grade, pass rate, and academic performance reporting." },
  { label: "Fees Report", path: "fees", endpoint: "/v1/reports/fees/", icon: ReceiptText, description: "Invoices, collections, pending balances, plans, and course-level fee status." },
  { label: "Revenue Report", path: "revenue", endpoint: "/v1/reports/revenue/", icon: BarChart3, description: "Revenue by month, year, payment method, cashier, and collection source." },
  { label: "Students Report", path: "students", endpoint: "/v1/reports/students/", icon: GraduationCap, description: "Enrollment, active status, course distribution, and student directory analytics." },
  { label: "Teachers Report", path: "teachers", endpoint: "/v1/reports/teachers/", icon: Users, description: "Teacher headcount, departments, employment status, and joining date views." },
  { label: "Inventory Report", path: "inventory", endpoint: "/v1/reports/inventory/", icon: PackageSearch, description: "Stock quantities, low-stock alerts, suppliers, categories, and inventory value." },
  { label: "Stationery Sales Report", path: "stationery-sales", endpoint: "/v1/reports/stationery-sales/", icon: ShoppingCart, description: "Stationery sales, products, cashiers, payment status, and daily trends." },
];

async function downloadFile(endpoint, filename) {
  const response = await instance.get(endpoint, { responseType: "blob" });
  const blob = new Blob([response.data], { type: response.headers["content-type"] || "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Operational analytics for attendance, academics, billing, revenue, students, teachers, inventory, and sales." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <section key={report.path} className="rounded-md bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="rounded-md bg-cyan-50 p-2 text-cyan-700">
                  <Icon size={22} />
                </div>
                <Download size={16} className="text-gray-400" />
              </div>
              <h2 className="text-base font-semibold text-gray-950">{report.label}</h2>
              <p className="mt-2 min-h-16 text-sm text-gray-500">{report.description}</p>
              <p className="mt-3 text-xs text-gray-400">Last generated: available in report view</p>
              <div className="mt-4 flex items-center gap-2">
                <Link className="rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white" to={report.path}>
                  View Report
                </Link>
                <select
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
                  defaultValue=""
                  onChange={(event) => {
                    if (!event.target.value) return;
                    downloadFile(`${report.endpoint}?export=${event.target.value}`, `${report.path}.${event.target.value === "excel" ? "xls" : event.target.value}`);
                    event.target.value = "";
                  }}
                >
                  <option value="">Export</option>
                  <option value="csv">CSV</option>
                  <option value="excel">Excel</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
