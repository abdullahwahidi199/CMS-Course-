import "./App.css";
import "./forTailwind.css";
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
import Classes from "./components/classes";
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
import AdminDashboard from "./components/adminDashboard";
import TeacherDashboard from "./components/teacherDashboard/TeacherDashboard";

import { AuthProvider } from "./AuthProvider";
import TeacherHomepage from "./components/teacherDashboard/homepage";
import Marks from "./components/teacherDashboard/marks";
import ClassDetails from "./components/teacherDashboard/class";
import Assignment from "./components/teacherDashboard/individualAss";
import Reciept from "./components/reciept";
import Homepage from "./components/studentsDashboard/homepage";
import StudentsDashboard from "./components/studentsDashboard/studentDashboard";
import About from "./components/about";
import SuperAdminMain from "./components/SuperAdmin/SuperAdminMain";
import SettingsMain from "./components/settings/SettingsMain";
import SubscriptionExpired from "./components/SubscriptionExpired";
import EnterpriseDashboard from "./components/enterprise/EnterpriseDashboard";
import AssessmentsPage from "./components/enterprise/AssessmentsPage";
import BillingPage from "./components/enterprise/BillingPage";
import StationeryPage from "./components/enterprise/StationeryPage";
import ReportsPage from "./components/enterprise/ReportsPage";
import NotificationsPage from "./components/enterprise/NotificationsPage";
import UserManagementPage from "./components/enterprise/UserManagementPage";
import RoleManagementPage from "./components/enterprise/RoleManagementPage";

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
            <ProtectedRoute permission="dashboard.view">
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<EnterpriseDashboard />} />
          <Route path="operations" element={<ProtectedRoute permission="dashboard.view"><EnterpriseDashboard /></ProtectedRoute>} />
          <Route path="users" element={<ProtectedRoute permission="users.view"><UserManagementPage /></ProtectedRoute>} />
          <Route path="roles" element={<ProtectedRoute permission="roles.view"><RoleManagementPage /></ProtectedRoute>} />
          <Route path="assessments" element={<ProtectedRoute permission="assessments.view"><AssessmentsPage /></ProtectedRoute>} />
          <Route path="billing" element={<ProtectedRoute permission="fees.view"><BillingPage /></ProtectedRoute>} />
          <Route path="stationery" element={<ProtectedRoute permission="stationery.view"><StationeryPage /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute permission="reports.view"><ReportsPage /></ProtectedRoute>} />
          <Route path="notifications" element={<ProtectedRoute permission="notifications.view"><NotificationsPage /></ProtectedRoute>} />
          <Route path="attendence" element={<ProtectedRoute permission="attendance.view"><Attendence /></ProtectedRoute>} />
          <Route path="addmission" element={<ProtectedRoute permission="students.create"><Admission /></ProtectedRoute>} />
          <Route path="student/:id" element={<IndividaulStudent />} />
          <Route path="classes" element={<ProtectedRoute permission="classes.view"><Classes /></ProtectedRoute>} />
          <Route path="classes/:id" element={<IndividaulClass />} />
          <Route path="teachers" element={<ProtectedRoute permission="teachers.view"><Teachers /></ProtectedRoute>} />
          <Route path="staff" element={<ProtectedRoute permission="staff.view"><Staff /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute permission="settings.view"><SettingsMain /></ProtectedRoute>} />
          <Route path="expenses" element={<ProtectedRoute permission="fees.view"><Expenses /></ProtectedRoute>} />
          <Route path="expenses/history" element={<ExpenseHistory />} />
          <Route path="expenses/history/:id" element={<IndividualExpense />} />
          <Route path="school/timetable" element={<ProtectedRoute permission="classes.view"><Timetable /></ProtectedRoute>} />
          <Route path="rooms" element={<ProtectedRoute permission="classes.manage"><Rooms /></ProtectedRoute>} />
          <Route path="reciept" element={<Reciept />} />
          <Route path="about-me" element={<About />} />
        </Route>
        <Route
          path="teacher/dashboard"
          element={
            <ProtectedRoute roles={["teacher"]}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherHomepage />} />
          {/* <Route path='student/give_marks' element={<Marks/>}/> */}
          <Route path="classes/:id" element={<ClassDetails />} />
          <Route path="assignment/:id" element={<Assignment />} />
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
        </Route>
        <Route path="subscription-expired" element={<SubscriptionExpired />} />
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
