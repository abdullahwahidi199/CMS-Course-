import { NavLink } from "react-router-dom"
function Navbar() {
    return (
        <div className="h-full flex flex-col justify-between">
            <div className="">
                <div className="text-2xl font-bold text-white mb-8">Admin</div>

                <ul className="space-y-2">

                    <li><NavLink to='/admin/dashboard' end className={({ isActive }) =>
                        `block px-4 py-[5px] rounded hover:bg-gray-700 transition ${isActive ? `bg-gray-700 text-white` :`text-gray-300`
                        }`
                    }>Home</NavLink></li>

                    <li><NavLink to='addmission' className={({isActive})=>
                    `block px-4 py-[5px] rounded hover:bg-gray-700 transition ${isActive ? `bg-gray-700 text-white`:`text-gray-300`}`
                    }>Addmission</NavLink></li>

                    <li className="text-gray-300 px-4 py-2 hover:bg-gray-700 rounded cursor-pointer">Carriculam</li>

                    <li><NavLink to='classes' className={({ isActive }) =>
                        `block px-4 py-[5px] rounded hover:bg-gray-700 transition ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300'
                        }`
                    } id="nav_item">Classes</NavLink></li>

                    <li><NavLink to='attendence' className={({ isActive }) =>
                        `block px-4 py-[5px] rounded hover:bg-gray-700 transition ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300'
                        }`
                    } id="nav_item">Attendence</NavLink></li>
                    <li><NavLink to='teachers' className={({ isActive }) =>
                        `block px-4 py-[5px] rounded hover:bg-gray-700 transition ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300'
                        }`
                    } id="nav_item">Teachers</NavLink></li>
                    <li><NavLink 
                        to='staff' 
                        className={({isActive})=>`block px-4 py-[5px] rounded hover:bg-gray-700 transition ${isActive?'bg-gray-700 text-white':'text-gray-300'}`}
                        >Staff</NavLink></li>

                    <li>
                        <NavLink
                            to='expenses'
                            className={({isActive})=>`block px-4 py-[5px] rounded hover:bg-gray-700 transition ${isActive?'bg-gray-700 text-white':'text-gray-300'}`}

                        >Expenses</NavLink>
                    </li>
                    <li>
                        <NavLink 
                            to='school/timetable'
                            className={({isActive})=>`block px-4 py-[5px] rounded hover:bg-gray-700 transitionn ${isActive? 'bg-gray-700 text-white}':'text-gray-300'}`}
                        >Timetable</NavLink>
                    </li>
                    <li>
                        <NavLink 
                            to='rooms'
                            className={({isActive})=>`block px-4 py-[5px] rounded hover:bg-gray-700 transitionn ${isActive? 'bg-gray-700 text-white}':'text-gray-300'}`}
                        >Rooms</NavLink>
                    </li>
                    <li>
                        <NavLink 
                            to='about-me'
                            className={({isActive})=>`block px-4 py-[5px] rounded hover:bg-gray-700 transitionn ${isActive? 'bg-gray-700 text-white}':'text-gray-300'}`}
                        >About</NavLink>
                    </li>
                </ul>
            </div>
            <h2 className="text-gray-400 px-4 py-4 cursor-pointer">
                Info
            </h2>
        </div>
    )
}
export default Navbar