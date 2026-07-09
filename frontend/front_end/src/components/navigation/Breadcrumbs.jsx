import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const labels = {
  admin: "Admin",
  dashboard: "Dashboard",
  operations: "Operations",
  users: "Users",
  students: "Students",
  roles: "Roles",
  assessments: "Assessments",
  billing: "Finance",
  stationery: "Inventory",
  reports: "Reports",
  attendance: "Attendance Reports",
  fees: "Fees Report",
  revenue: "Revenue Report",
  teachers: "Teachers",
  inventory: "Inventory Report",
  "stationery-sales": "Stationery Sales",
  notifications: "Notifications",
  attendence: "Attendance",
  addmission: "Admissions",
  courses: "Courses",
  classes: "Batches",
  staff: "Staff",
  settings: "Settings",
  expenses: "Expenses",
  school: "School",
  timetable: "Timetable",
  rooms: "Rooms",
  reciept: "Receipt",
  "about-me": "About Me",
};

function titleFromSegment(segment) {
  return labels[segment] || segment.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function usePageTitle() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);
  return titleFromSegment(parts[parts.length - 1] || "dashboard");
}

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);
  const visible = parts.filter((part) => part !== "admin");

  return (
    <nav className="hidden items-center gap-1 text-sm text-slate-500 md:flex">
      {visible.map((part, index) => {
        const href = `/${parts.slice(0, parts.indexOf(part) + 1).join("/")}`;
        const isLast = index === visible.length - 1;
        return (
          <span key={`${part}-${index}`} className="inline-flex items-center gap-1">
            {index > 0 ? <ChevronRight size={14} /> : null}
            {isLast ? <span className="font-medium text-slate-700">{titleFromSegment(part)}</span> : <Link className="hover:text-cyan-700" to={href}>{titleFromSegment(part)}</Link>}
          </span>
        );
      })}
    </nav>
  );
}
