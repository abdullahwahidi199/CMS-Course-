import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import {
  BarChart3,
  CalendarCheck,
  ClipboardCheck,
  Package,
  UserPlus,
  WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Bar, Line } from "react-chartjs-2";
import PageHeader from "../shared/PageHeader";
import StatCard from "../shared/StatCard";
import Can from "../shared/Can";
import { useApiResource } from "../../hooks/useApiResource";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
);

function money(value) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function Panel({ title, children }) {
  return (
    <section className="rounded-md bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

function List({ rows, empty, render }) {
  if (!rows?.length) return <p className="text-sm text-gray-500">{empty}</p>;
  return <div className="divide-y divide-gray-100">{rows.map(render)}</div>;
}

const shortcuts = [
  {
    label: "Today's Attendance",
    helper: "Open attendance workspace",
    icon: CalendarCheck,
    path: "./attendence",
    permission: "attendance.view",
  },
  {
    label: "New Admission",
    helper: "Register a new student",
    icon: UserPlus,
    path: "./addmission",
    permission: "students.create",
  },
  {
    label: "Billing",
    helper: "Manage invoices and payments",
    icon: WalletCards,
    path: "./billing",
    permission: "fees.view",
  },
  {
    label: "Stationery",
    helper: "Products, stock, and sales",
    icon: Package,
    path: "./stationery",
    permission: "stationery.view",
  },
  {
    label: "Reports",
    helper: "Analytics and exports",
    icon: BarChart3,
    path: "./reports",
    permission: "reports.view",
  },
  {
    label: "Assessments",
    helper: "Academic evaluations",
    icon: ClipboardCheck,
    path: "./assessments",
    permission: "assessments.view",
  },
];

export default function EnterpriseDashboard() {
  const { data, loading, error } = useApiResource("/v1/dashboards/admin/");
  const cards = data?.cards || {};
  const revenue = data?.monthly_revenue || [];
  const attendance = data?.attendance_trend || [];
  const fees = data?.fee_collection || [];
  const assessments = data?.assessment_performance || [];
  const inventory = data?.inventory_movement || [];

  const revenueChart = {
    labels: revenue.map((row) => `M${row.payment_date__month}`),
    datasets: [
      {
        label: "Revenue",
        data: revenue.map((row) => Number(row.total || 0)),
        borderColor: "#0369a1",
        backgroundColor: "#38bdf8",
      },
    ],
  };

  const attendanceChart = {
    labels: attendance.map((row) => row.date),
    datasets: [
      {
        label: "Present",
        data: attendance.map((row) => row.present),
        borderColor: "#047857",
        backgroundColor: "#34d399",
      },
      {
        label: "Absent",
        data: attendance.map((row) => row.absent),
        borderColor: "#b91c1c",
        backgroundColor: "#f87171",
      },
    ],
  };

  const feeChart = {
    labels: fees.map((row) => `M${row.month}`),
    datasets: [
      {
        label: "Collected",
        data: fees.map((row) => Number(row.collected || 0)),
        backgroundColor: "#059669",
      },
      {
        label: "Outstanding",
        data: fees.map((row) => Number(row.outstanding || 0)),
        backgroundColor: "#f97316",
      },
    ],
  };

  const assessmentChart = {
    labels: assessments.map((row) => row.assessment__title),
    datasets: [
      {
        label: "Average %",
        data: assessments.map((row) => Number(row.avg_percentage || 0)),
        backgroundColor: "#8b5cf6",
      },
    ],
  };

  const inventoryChart = {
    labels: inventory.map((row) => row.transaction_type),
    datasets: [
      {
        label: "Quantity",
        data: inventory.map((row) => Number(row.total || 0)),
        backgroundColor: "#0f766e",
      },
    ],
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-20 animate-pulse rounded-md bg-white" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-md bg-white"
            />
          ))}
        </div>
      </div>
    );
  }
  if (error)
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Live operational overview across academics, finance, users, and inventory."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <Can key={shortcut.label} permission={shortcut.permission}>
              <Link
                className="rounded-md bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                to={shortcut.path}
              >
                <div className="mb-3 inline-flex rounded-md bg-cyan-50 p-2 text-cyan-700">
                  <Icon size={20} />
                </div>
                <div className="text-sm font-semibold text-gray-950">
                  {shortcut.label}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {shortcut.helper}
                </div>
              </Link>
            </Can>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Can permission="students.view">
          <Link
            className="rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white shadow-sm"
            to="./students"
          >
            Manage Students
          </Link>
        </Can>
        <Can permission="courses.view">
          <Link
            className="rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white shadow-sm"
            to="./courses"
          >
            Manage Courses
          </Link>
        </Can>
        <Can permission="batches.view">
          <Link
            className="rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white shadow-sm"
            to="./classes"
          >
            Manage Batches
          </Link>
        </Can>
        <Can permission="students.create">
          <Link
            className="rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white"
            to="./addmission"
          >
            Create Student
          </Link>
        </Can>
        <Can permission="fees.collect_payment">
          <Link
            className="rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white"
            to="./billing"
          >
            Collect Fee
          </Link>
        </Can>
        <Can permission="stationery.sell">
          <Link
            className="rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white"
            to="./stationery"
          >
            Sell Item
          </Link>
        </Can>
        <Can permission="assessments.create">
          <Link
            className="rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white"
            to="./assessments"
          >
            Create Assessment
          </Link>
        </Can>
        <Can permission="attendance.create">
          <Link
            className="rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white"
            to="./attendence"
          >
            Take Attendance
          </Link>
        </Can>
        <Can permission="users.create">
          <Link
            className="rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white"
            to="./users"
          >
            Create User
          </Link>
        </Can>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Can permission="students.view">
          <StatCard
            title="Students"
            value={cards.students}
            accent="border-sky-500"
          />
        </Can>
        <Can permission="teachers.view">
          <StatCard
            title="Teachers"
            value={cards.teachers}
            accent="border-emerald-500"
          />
        </Can>
        <Can permission="staff.view">
          <StatCard
            title="Staff"
            value={cards.staff}
            accent="border-slate-500"
          />
        </Can>
        <Can permission="courses.view">
          <StatCard
            title="Courses"
            value={cards.courses}
            accent="border-indigo-500"
          />
        </Can>
        <Can permission="batches.view">
          <StatCard
            title="Batches"
            value={cards.batches || cards.classes}
            accent="border-cyan-500"
          />
        </Can>
        <Can permission="attendance.view">
          <StatCard
            title="Today's Attendance"
            value={cards.todays_attendance}
            accent="border-teal-500"
          />
        </Can>
        <Can permission="attendance.view">
          <StatCard
            title="Monthly Attendance %"
            value={`${cards.monthly_attendance_percentage || 0}%`}
            accent="border-lime-600"
          />
        </Can>
        <Can permission="fees.view">
          <StatCard
            title="Collected Fees"
            value={money(cards.collected_fees)}
            accent="border-green-600"
          />
        </Can>
        <Can permission="fees.view">
          <StatCard
            title="Pending Fees"
            value={money(cards.pending_fees)}
            accent="border-orange-500"
          />
        </Can>
        <Can permission="fees.view">
          <StatCard
            title="Overdue Fees"
            value={money(cards.overdue_fees)}
            accent="border-red-600"
          />
        </Can>
        <Can permission="stationery.view">
          <StatCard
            title="Stationery Sales"
            value={money(cards.stationery_sales)}
            accent="border-cyan-600"
          />
        </Can>
        <Can permission="inventory.view">
          <StatCard
            title="Inventory Value"
            value={money(cards.inventory_value)}
            accent="border-violet-500"
          />
        </Can>
        <Can permission="inventory.view">
          <StatCard
            title="Low Stock Items"
            value={cards.low_stock_items}
            accent="border-rose-600"
          />
        </Can>
        <Can permission="assessments.view">
          <StatCard
            title="Assessments"
            value={cards.assessments}
            accent="border-amber-500"
          />
        </Can>
        <Can permission="assessments.view">
          <StatCard
            title="Upcoming Exams"
            value={cards.upcoming_exams}
            accent="border-fuchsia-500"
          />
        </Can>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Can permission="fees.view">
          <Panel title="Monthly Revenue">
            <Bar data={revenueChart} />
          </Panel>
        </Can>
        <Can permission="attendance.view">
          <Panel title="Attendance Trend">
            <Line data={attendanceChart} />
          </Panel>
        </Can>
        <Can permission="fees.view">
          <Panel title="Fee Collection">
            <Bar data={feeChart} />
          </Panel>
        </Can>
        <Can permission="assessments.view">
          <Panel title="Assessment Performance">
            <Bar data={assessmentChart} />
          </Panel>
        </Can>
        <Can permission="inventory.view">
          <Panel title="Inventory Movement">
            <Bar data={inventoryChart} />
          </Panel>
        </Can>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Can permission="fees.view">
          <Panel title="Recent Payments">
            <List
              rows={data?.recent_payments}
              empty="No payments yet."
              render={(row) => (
                <div key={row.receipt_number} className="py-2 text-sm">
                  <span className="font-medium">
                    {row.invoice__student__name}
                  </span>
                  <span className="float-right">{money(row.amount_paid)}</span>
                </div>
              )}
            />
          </Panel>
        </Can>
        <Can permission="students.view">
          <Panel title="Recent Admissions">
            <List
              rows={data?.recent_admissions}
              empty="No recent admissions."
              render={(row) => (
                <div key={row.id} className="py-2 text-sm">
                  <span className="font-medium">{row.name}</span>
                  <span className="float-right text-gray-500">
                    {row.role_number}
                  </span>
                </div>
              )}
            />
          </Panel>
        </Can>
        <Can permission="assessments.view">
          <Panel title="Upcoming Exams">
            <List
              rows={data?.upcoming_exams}
              empty="No upcoming exams."
              render={(row) => (
                <div key={row.id} className="py-2 text-sm">
                  <span className="font-medium">{row.title}</span>
                  <span className="float-right text-gray-500">
                    {row.assessment_date}
                  </span>
                </div>
              )}
            />
          </Panel>
        </Can>
        <Can permission="inventory.view">
          <Panel title="Low Stock">
            <List
              rows={data?.low_stock}
              empty="No low-stock items."
              render={(row) => (
                <div key={row.id} className="py-2 text-sm">
                  <span className="font-medium">{row.item_name}</span>
                  <span className="float-right text-gray-500">
                    {row.quantity}/{row.minimum_stock}
                  </span>
                </div>
              )}
            />
          </Panel>
        </Can>
        <Can permission="notifications.view">
          <Panel title="Notifications">
            <List
              rows={data?.notifications}
              empty="No notifications."
              render={(row) => (
                <div
                  key={`${row.title}-${row.created_at}`}
                  className="py-2 text-sm"
                >
                  <div className="font-medium">{row.title}</div>
                  <div className="text-gray-500">{row.message}</div>
                </div>
              )}
            />
          </Panel>
        </Can>
      </div>
    </div>
  );
}
