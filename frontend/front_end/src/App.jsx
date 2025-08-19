
import './App.css'
import './forTailwind.css'
import {Route,createBrowserRouter,createRoutesFromElements,RouterProvider} from 'react-router-dom'
import RootLayout from './rootLayout'
import HomePage from './components/homePage'
import Attendence from './components/attendence'
import IndividaulStudent from './components/individualStudent'
import Classes from './components/classes'

import Teachers from './components/teachers'
import Admission from './components/admission'
import Staff from './components/otherStaff'
import Expenses from './components/expenses'
import ExpenseHistory from './components/expensesHistory'
import IndividualExpense from './components/individualExpense'
import Timetable from './components/timetable'
import IndividaulClass from './components/individualClass'
import Rooms from './components/rooms'



function App() {

  
  
    
  
  const router=createBrowserRouter(
    createRoutesFromElements(
      <Route path='/' element={<RootLayout/>}>
        <Route index element={<HomePage/>}/>
        <Route path='attendence' element={<Attendence/>}/>
        <Route path='addmission' element={<Admission/>}/>
        <Route path='/:id' element={<IndividaulStudent/>}></Route>
        
        <Route path='classes' element={<Classes/>}/>
        <Route path='classes/:id' element={<IndividaulClass/>}/>
        <Route path='teachers' element={<Teachers/>}/>
        <Route path='staff' element={<Staff/>}/>
        <Route path='expenses' element={<Expenses/>}/>
        <Route path='expenses/history/' element={<ExpenseHistory/>}>
          
        </Route>
        <Route path='expenses/history/:id' element={<IndividualExpense/>}/>
        <Route path='school/timetable' element={<Timetable/>}/>
        <Route path='rooms' element={<Rooms/>}/>
      </Route>
    )
  )
  return (
    <RouterProvider router={router}/>
      )
  
}

export default App
