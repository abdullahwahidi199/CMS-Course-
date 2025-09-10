import './App.css';
import './forTailwind.css';
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';
import RootLayout from './rootLayout';
import HomePage from './components/homePage';
import Attendence from './components/attendence';
import IndividaulStudent from './components/individualStudent';
import Classes from './components/classes';
import Teachers from './components/teachers';
import Admission from './components/admission';
import Staff from './components/otherStaff';
import Expenses from './components/expenses';
import ExpenseHistory from './components/expensesHistory';
import IndividualExpense from './components/individualExpense';
import Timetable from './components/timetable';
import IndividaulClass from './components/individualClass';
import Rooms from './components/rooms';
import Login from './components/loginPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './components/adminDashboard';
import TeacherDashboard from './components/teacherDashboard/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import { AuthProvider } from './AuthProvider';
import { Home } from 'lucide-react';
import TeacherHomepage from './components/teacherDashboard/homepage';
import Marks from './components/teacherDashboard/marks';
import ClassDetails from './components/teacherDashboard/class';
import Assignment from './components/teacherDashboard/individualAss';


function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path='/' element={<RootLayout />}>
        
        <Route index element={<Login />} />

        {/* Dashboards */}
        <Route path="admin/dashboard" element={
          <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
        } >
          <Route index element={ <HomePage />}  />
          <Route path='attendence' element={<Attendence />} />
          <Route path='addmission' element={ <Admission />} />
          <Route path='student/:id' element={ <IndividaulStudent />} />
          <Route path='classes' element={ <Classes />} />
          <Route path='classes/:id' element={ <IndividaulClass />} />
          <Route path='teachers' element={ <Teachers />} />
          <Route path='staff' element={ <Staff />} />
          <Route path='expenses' element={ <Expenses />} />
          <Route path='expenses/history' element={ <ExpenseHistory />} />
          <Route path='expenses/history/:id' element={ <IndividualExpense />} />
          <Route path='school/timetable' element={ <Timetable />} />
          <Route path='rooms' element={ <Rooms />} />

        </Route>
        <Route path="teacher/dashboard" element={
          <ProtectedRoute roles={['teacher']}><TeacherDashboard /></ProtectedRoute>
        } >
          <Route index element={<TeacherHomepage/>}/>
          {/* <Route path='student/give_marks' element={<Marks/>}/> */}
          <Route path='classes/:id' element={<ClassDetails/>}/>
          <Route path='assignment/:id' element={<Assignment/>}/>

        </Route>
        <Route path="student/dashboard" element={
          <ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>
        } />

        {/* Admin routes */}
        
      </Route>
    )
  );

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
