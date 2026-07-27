export const APP_ROUTES = [
  { label: "Dashboard", path: "/admin/dashboard", permission: "dashboard.view" },
  { label: "Students", path: "/admin/dashboard/students", permission: "students.view" },
  { label: "Teachers", path: "/admin/dashboard/teachers", permission: "teachers.view" },
  { label: "Attendance", path: "/admin/dashboard/attendence", permission: "attendance.view" },
  { label: "Assessments", path: "/admin/dashboard/assessments", permission: "assessments.view" },
  { label: "Finance", path: "/admin/dashboard/billing", permission: "fees.view" },
  { label: "Expenses", path: "/admin/dashboard/expenses", permission: "expenses.view" },
  { label: "Inventory", path: "/admin/dashboard/stationery", permission: "stationery.view" },
  { label: "Reports", path: "/admin/dashboard/reports", permission: "reports.view" },
  { label: "Settings", path: "/admin/dashboard/settings", permission: "settings.view" },
  { label: "Users", path: "/admin/dashboard/users", permission: "users.view" },
  { label: "Roles & Permissions", path: "/admin/dashboard/roles", permission: "roles.view" },
  { label: "Notifications", path: "/admin/dashboard/notifications", permission: "notifications.view" },
  { label: "Online Page", path: "/admin/dashboard/online-page", permission: "online-page.view" },
  { label: "Documentation", path: "/admin/dashboard/documentation" },
  { label: "Courses", path: "/admin/dashboard/courses", permission: "courses.view" },
  { label: "Batches", path: "/admin/dashboard/classes", permission: "batches.view" },
  { label: "Staff", path: "/admin/dashboard/staff", permission: "staff.view" },
];

export const TEACHER_ROUTES = [
  { label: "Dashboard", path: "/teacher/dashboard" },
  { label: "My Classes", path: "/teacher/dashboard/classes", permission: "batches.view" },
  { label: "My Students", path: "/teacher/dashboard/students", permission: "students.view" },
  { label: "Attendance", path: "/teacher/dashboard/attendance", permission: "attendance.view" },
  { label: "Marks", path: "/teacher/dashboard/marks", permission: "assessments.view" },
  { label: "Assessments", path: "/teacher/dashboard/assessments", permission: "assessments.view" },
  { label: "Exams", path: "/teacher/dashboard/exams", permission: "assessments.view" },
  { label: "Assignments", path: "/teacher/dashboard/assignments", permission: "assessments.view" },
  { label: "Announcements", path: "/teacher/dashboard/announcements" },
  { label: "Notifications", path: "/teacher/dashboard/notifications", permission: "notifications.view" },
  { label: "Timetable", path: "/teacher/dashboard/timetable", permission: "batches.view" },
  { label: "Profile", path: "/teacher/dashboard/profile" },
  { label: "Settings", path: "/teacher/dashboard/settings" },
];

export function firstAccessibleRoute(permissions = []) {
  const allowed = new Set(permissions);
  return APP_ROUTES.find((route) => allowed.has(route.permission)) || null;
}

export function firstAccessibleTeacherRoute(permissions = []) {
  const allowed = new Set(permissions);
  return TEACHER_ROUTES.find((route) => !route.permission || allowed.has(route.permission)) || null;
}

export function firstAccessiblePath(permissions = []) {
  return firstAccessibleRoute(permissions)?.path || "/access-denied";
}

export function firstAccessibleTeacherPath(permissions = []) {
  return firstAccessibleTeacherRoute(permissions)?.path || "/access-denied";
}

export function routeForPermission(permission) {
  return APP_ROUTES.find((route) => route.permission === permission);
}
