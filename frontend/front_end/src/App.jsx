import "./App.css";
import "./forTailwind.css";
import { lazy, Suspense } from "react";
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from "react-router-dom";
import RootLayout from "./rootLayout";
import HomePage from "./components/homePage";
import Attendence from "./components/attendence";
import IndividaulStudent from "./components/individualStudent";
import Teachers from "./components/teachers";
import Admission from "./components/admission";
import Staff from "./components/otherStaff";
import Expenses from "./components/expenses";
import ExpenseHistory from "./components/expensesHistory";
import IndividualExpense from "./components/individualExpense";
import Timetable from "./components/timetable";
import IndividaulClass from "./components/individualClass";
import Rooms from "./components/rooms";
import Login from "./components/loginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import PermissionRedirect from "./components/PermissionRedirect";
import AdminDashboard from "./components/adminDashboard";

import { AuthProvider } from "./AuthProvider";
import Reciept from "./components/reciept";
import Homepage from "./components/studentsDashboard/homepage";
import StudentsDashboard from "./components/studentsDashboard/studentDashboard";
import StudentProfilePage from "./components/studentsDashboard/pages/ProfilePage";
import StudentCoursesPage from "./components/studentsDashboard/pages/CoursesPage";
import StudentAttendancePage from "./components/studentsDashboard/pages/AttendancePage";
import StudentMarksPage from "./components/studentsDashboard/pages/MarksPage";
import StudentAssessmentsPage from "./components/studentsDashboard/pages/AssessmentsPage";
import StudentAssignmentsPage from "./components/studentsDashboard/pages/AssignmentsPage";
import StudentFeesPage from "./components/studentsDashboard/pages/FeesPage";
import StudentNotificationsPage from "./components/studentsDashboard/pages/NotificationsPage";
import StudentAnnouncementsPage from "./components/studentsDashboard/pages/AnnouncementsPage";
import StudentSettingsPage from "./components/studentsDashboard/pages/StudentSettingsPage";
import About from "./components/about";
import SuperAdminMain from "./components/SuperAdmin/SuperAdminMain";
import SettingsMain from "./components/settings/SettingsMain";
import SubscriptionExpired from "./components/SubscriptionExpired";
import AccessDenied from "./components/AccessDenied";
import EnterpriseDashboard from "./components/enterprise/EnterpriseDashboard";
import AssessmentsPage from "./components/enterprise/AssessmentsPage";
import BillingPage from "./components/enterprise/BillingPage";
import StationeryPage from "./components/enterprise/StationeryPage";
import ReportsPage from "./components/enterprise/ReportsPage";
import AssessmentReport from "./components/enterprise/reports/AssessmentReport";
import AttendanceReport from "./components/enterprise/reports/AttendanceReport";
import FeesReport from "./components/enterprise/reports/FeesReport";
import InventoryReport from "./components/enterprise/reports/InventoryReport";
import RevenueReport from "./components/enterprise/reports/RevenueReport";
import StationerySalesReport from "./components/enterprise/reports/StationerySalesReport";
import StudentsReport from "./components/enterprise/reports/StudentsReport";
import TeachersReport from "./components/enterprise/reports/TeachersReport";
import NotificationsPage from "./components/enterprise/NotificationsPage";
import UserManagementPage from "./components/enterprise/UserManagementPage";
import RoleManagementPage from "./components/enterprise/RoleManagementPage";
import StudentManagementPage from "./components/students/StudentManagementPage";
import CourseManagementPage from "./components/academic/CourseManagementPage";
import BatchManagementPage from "./components/academic/BatchManagementPage";

const TeacherDashboard = lazy(() => import("./components/teacherDashboard/TeacherDashboard"));
const TeacherHomepage = lazy(() => import("./components/teacherDashboard/homepage"));
const ClassDetails = lazy(() => import("./components/teacherDashboard/class"));
const Assignment = lazy(() => import("./components/teacherDashboard/individualAss"));
const TeacherProfilePage = lazy(() => import("./components/teacherDashboard/pages/ProfilePage"));
const TeacherClassesPage = lazy(() => import("./components/teacherDashboard/pages/ClassesPage"));
const TeacherAttendancePage = lazy(() => import("./components/teacherDashboard/pages/AttendancePage"));
const TeacherMarksPage = lazy(() => import("./components/teacherDashboard/pages/MarksPage"));
const TeacherAssessmentsPage = lazy(() => import("./components/teacherDashboard/pages/AssessmentsPage"));
const TeacherAssignmentsPage = lazy(() => import("./components/teacherDashboard/pages/AssignmentsPage"));
const TeacherNotificationsPage = lazy(() => import("./components/teacherDashboard/pages/NotificationsPage"));
const TeacherSettingsPage = lazy(() => import("./components/teacherDashboard/pages/SettingsPage"));
const TeacherStudentsPage = lazy(() => import("./components/teacherDashboard/pages/StudentsPage"));
const TeacherTimetablePage = lazy(() => import("./components/teacherDashboard/pages/TimetablePage"));

function TeacherFallback() {
  return <div className="min-h-screen bg-slate-100 p-6 text-sm text-slate-500">Loading teacher portal...</div>;
}

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<RootLayout />}>
        <Route index element={<Login />} />

        <Route
          path="super-admin/dashboard"
          element={
            <ProtectedRoute roles={["super-admin", "super_admin"]}>
              <SuperAdminMain />
            </ProtectedRoute>
          }
        ></Route>
        <Route
          path="admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<PermissionRedirect />} />
          <Route
            path="operations"
            element={
              <ProtectedRoute permission="dashboard.view">
                <EnterpriseDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <ProtectedRoute permission="users.view">
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="students"
            element={
              <ProtectedRoute permission="students.view">
                <StudentManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="roles"
            element={
              <ProtectedRoute permission="roles.view">
                <RoleManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="assessments"
            element={
              <ProtectedRoute permission="assessments.view">
                <AssessmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="billing"
            element={
              <ProtectedRoute permission="fees.view">
                <BillingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="stationery"
            element={
              <ProtectedRoute permission="stationery.view">
                <StationeryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute permission="reports.view">
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/attendance"
            element={
              <ProtectedRoute permission="reports.view">
                <AttendanceReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/assessments"
            element={
              <ProtectedRoute permission="reports.view">
                <AssessmentReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/fees"
            element={
              <ProtectedRoute permission="reports.view">
                <FeesReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/revenue"
            element={
              <ProtectedRoute permission="reports.view">
                <RevenueReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/students"
            element={
              <ProtectedRoute permission="reports.view">
                <StudentsReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/teachers"
            element={
              <ProtectedRoute permission="reports.view">
                <TeachersReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/inventory"
            element={
              <ProtectedRoute permission="reports.view">
                <InventoryReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/stationery-sales"
            element={
              <ProtectedRoute permission="reports.view">
                <StationerySalesReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="notifications"
            element={
              <ProtectedRoute permission="notifications.view">
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="attendence"
            element={
              <ProtectedRoute permission="attendance.view">
                <Attendence />
              </ProtectedRoute>
            }
          />
          <Route
            path="addmission"
            element={
              <ProtectedRoute permission="students.create">
                <Admission />
              </ProtectedRoute>
            }
          />
          <Route
            path="student/:id"
            element={
              <ProtectedRoute permission="students.view">
                <IndividaulStudent />
              </ProtectedRoute>
            }
          />
          <Route
            path="courses"
            element={
              <ProtectedRoute permission="courses.view">
                <CourseManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="classes"
            element={
              <ProtectedRoute permission="batches.view">
                <BatchManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="classes/:id"
            element={
              <ProtectedRoute permission="batches.view">
                <IndividaulClass />
              </ProtectedRoute>
            }
          />
          <Route
            path="students"
            element={
              <ProtectedRoute permission="students.view">
                <TeacherStudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="teachers"
            element={
              <ProtectedRoute permission="teachers.view">
                <Teachers />
              </ProtectedRoute>
            }
          />
          <Route
            path="staff"
            element={
              <ProtectedRoute permission="staff.view">
                <Staff />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute permission="settings.view">
                <SettingsMain />
              </ProtectedRoute>
            }
          />
          <Route
            path="expenses"
            element={
              <ProtectedRoute permission="expenses.view">
                <Expenses />
              </ProtectedRoute>
            }
          />
          <Route
            path="expenses/history"
            element={
              <ProtectedRoute permission="expenses.view">
                <ExpenseHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="expenses/history/:id"
            element={
              <ProtectedRoute permission="expenses.view">
                <IndividualExpense />
              </ProtectedRoute>
            }
          />
          <Route
            path="school/timetable"
            element={
              <ProtectedRoute permission="batches.view">
                <Timetable />
              </ProtectedRoute>
            }
          />
          <Route
            path="rooms"
            element={
              <ProtectedRoute permission="batches.manage">
                <Rooms />
              </ProtectedRoute>
            }
          />
          <Route
            path="reciept"
            element={
              <ProtectedRoute permission="fees.view">
                <Reciept />
              </ProtectedRoute>
            }
          />
          <Route
            path="about-me"
            element={
              <ProtectedRoute permission="dashboard.view">
                <About />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route
          path="teacher/dashboard"
          element={
            <ProtectedRoute roles={["teacher"]}>
              <Suspense fallback={<TeacherFallback />}>
                <TeacherDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherHomepage />} />
          <Route path="profile" element={<TeacherProfilePage />} />
          <Route
            path="classes"
            element={
              <ProtectedRoute permission="batches.view">
                <TeacherClassesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="classes/:id"
            element={
              <ProtectedRoute permission="batches.view">
                <ClassDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="attendance"
            element={
              <ProtectedRoute permission="attendance.view">
                <TeacherAttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="marks"
            element={
              <ProtectedRoute permission="assessments.view">
                <TeacherMarksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="assessments"
            element={
              <ProtectedRoute permission="assessments.view">
                <TeacherAssessmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="assignments"
            element={
              <ProtectedRoute permission="assessments.view">
                <TeacherAssignmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="assignment/:id"
            element={
              <ProtectedRoute permission="assessments.view">
                <Assignment />
              </ProtectedRoute>
            }
          />
          <Route
            path="notifications"
            element={
              <ProtectedRoute permission="notifications.view">
                <TeacherNotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="timetable"
            element={
              <ProtectedRoute permission="batches.view">
                <TeacherTimetablePage />
              </ProtectedRoute>
            }
          />
          <Route path="settings" element={<TeacherSettingsPage />} />
        </Route>

        <Route
          path="student/dashboard"
          element={
            <ProtectedRoute roles={["student"]}>
              <StudentsDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Homepage />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="courses" element={<StudentCoursesPage />} />
          <Route path="attendance" element={<StudentAttendancePage />} />
          <Route path="marks" element={<StudentMarksPage />} />
          <Route path="assessments" element={<StudentAssessmentsPage />} />
          <Route path="assignments" element={<StudentAssignmentsPage />} />
          <Route path="fees" element={<StudentFeesPage />} />
          <Route path="notifications" element={<StudentNotificationsPage />} />
          <Route path="announcements" element={<StudentAnnouncementsPage />} />
          <Route path="settings" element={<StudentSettingsPage />} />
        </Route>
        <Route path="subscription-expired" element={<SubscriptionExpired />} />
        <Route path="access-denied" element={<AccessDenied />} />
      </Route>,
    ),
  );

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
