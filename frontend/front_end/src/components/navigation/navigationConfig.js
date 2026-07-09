import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  FileBarChart,
  FileClock,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  Shield,
  UserCog,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import { routeForPermission } from "../../routes/appRoutes";

const pathFor = (permission, fallback) => routeForPermission(permission)?.path || fallback;

export const navigationModules = [
  {
    label: "Main",
    icon: LayoutDashboard,
    permission: "dashboard.view",
    children: [
      { label: "Dashboard", icon: LayoutDashboard, path: pathFor("dashboard.view", "/admin/dashboard"), end: true, permission: "dashboard.view" },
      { label: "Operations", icon: Home, path: "/admin/dashboard/operations", permission: "dashboard.view" },
    ],
  },
  {
    label: "People",
    icon: Users,
    children: [
      { label: "Admission", icon: UserPlus, path: "/admin/dashboard/addmission", permission: "students.create" },
      { label: "Students", icon: GraduationCap, path: pathFor("students.view", "/admin/dashboard/students"), permission: "students.view" },
      { label: "Teachers", icon: Users, path: pathFor("teachers.view", "/admin/dashboard/teachers"), permission: "teachers.view" },
      { label: "Staff", icon: UserCog, path: pathFor("staff.view", "/admin/dashboard/staff"), permission: "staff.view" },
    ],
  },
  {
    label: "Academic",
    icon: BookOpen,
    children: [
      { label: "Courses", icon: BookOpen, path: pathFor("courses.view", "/admin/dashboard/courses"), permission: "courses.view" },
      { label: "Batches", icon: Building2, path: pathFor("batches.view", "/admin/dashboard/classes"), permission: "batches.view" },
      { label: "Attendance", icon: CalendarCheck, path: pathFor("attendance.view", "/admin/dashboard/attendence"), permission: "attendance.view" },
      { label: "Assessments", icon: ClipboardCheck, path: pathFor("assessments.view", "/admin/dashboard/assessments"), permission: "assessments.view" },
      { label: "Timetable", icon: FileClock, path: "/admin/dashboard/school/timetable", permission: "batches.view" },
      { label: "Rooms", icon: Home, path: "/admin/dashboard/rooms", permission: "batches.manage" },
    ],
  },
  {
    label: "Finance",
    icon: WalletCards,
    children: [
      { label: "Billing", icon: WalletCards, path: pathFor("fees.view", "/admin/dashboard/billing"), permission: "fees.view" },
      { label: "Expenses", icon: Receipt, path: pathFor("expenses.view", "/admin/dashboard/expenses"), permission: "expenses.view" },
      { label: "Expense History", icon: FileText, path: "/admin/dashboard/expenses/history", permission: "expenses.view" },
      { label: "Receipt", icon: Receipt, path: "/admin/dashboard/reciept", permission: "fees.view" },
    ],
  },
  {
    label: "Stationery",
    icon: Package,
    path: pathFor("stationery.view", "/admin/dashboard/stationery"),
    permission: "stationery.view",
  },
  {
    label: "Reports",
    icon: BarChart3,
    permission: "reports.view",
    children: [
      { label: "Reports", icon: BarChart3, path: pathFor("reports.view", "/admin/dashboard/reports"), permission: "reports.view" },
      { label: "Attendance Report", icon: FileBarChart, path: "/admin/dashboard/reports/attendance", permission: "reports.view" },
      { label: "Assessments Report", icon: FileBarChart, path: "/admin/dashboard/reports/assessments", permission: "reports.view" },
      { label: "Fees Report", icon: FileBarChart, path: "/admin/dashboard/reports/fees", permission: "reports.view" },
      { label: "Revenue Report", icon: FileBarChart, path: "/admin/dashboard/reports/revenue", permission: "reports.view" },
      { label: "Students Report", icon: FileBarChart, path: "/admin/dashboard/reports/students", permission: "reports.view" },
      { label: "Teachers Report", icon: FileBarChart, path: "/admin/dashboard/reports/teachers", permission: "reports.view" },
      { label: "Inventory Report", icon: FileBarChart, path: "/admin/dashboard/reports/inventory", permission: "reports.view" },
      { label: "Stationery Sales Report", icon: FileBarChart, path: "/admin/dashboard/reports/stationery-sales", permission: "reports.view" },
    ],
  },
  {
    label: "Administration",
    icon: Settings,
    children: [
      { label: "Users", icon: Users, path: pathFor("users.view", "/admin/dashboard/users"), permission: "users.view" },
      { label: "Roles & Permissions", icon: Shield, path: pathFor("roles.view", "/admin/dashboard/roles"), permission: "roles.view" },
      { label: "Notifications", icon: Bell, path: pathFor("notifications.view", "/admin/dashboard/notifications"), permission: "notifications.view" },
      { label: "Settings", icon: Settings, path: pathFor("settings.view", "/admin/dashboard/settings"), permission: "settings.view" },
    ],
  },
];

export const quickActions = [
  { label: "Admission", icon: UserPlus, path: "/admin/dashboard/addmission", permission: "students.create" },
  { label: "Billing", icon: WalletCards, path: "/admin/dashboard/billing", permission: "fees.view" },
  { label: "Take Attendance", icon: CalendarCheck, path: "/admin/dashboard/attendence", permission: "attendance.create" },
  { label: "Assessments", icon: ClipboardCheck, path: "/admin/dashboard/assessments", permission: "assessments.create" },
  { label: "Stationery", icon: Package, path: "/admin/dashboard/stationery", permission: "stationery.view" },
];
