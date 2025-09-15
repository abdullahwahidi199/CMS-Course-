import { Clipboard, Edit3, Users, Clock, User, X, Calendar, MapPin } from "lucide-react";
import { Settings, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect,useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../AuthProvider";
export default function TeacherHomepage() {
    const [teacher, setTeacher] = useState(null);
    const tokens = JSON.parse(localStorage.getItem("tokens"));
    const [teacherProfileDisplay, setTeacherProfileDisplay] = useState(false)
    const navigate = useNavigate()
    const {logout}=useContext(AuthContext) 
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch("http://127.0.0.1:8000/teacher/profile/", {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${tokens.access}`
                    }
                });

                if (!res.ok) {
                    throw new Error("Failed to fetch teacher profile");
                }

                const data = await res.json();
                setTeacher(data);
                console.log(data)
            } catch (err) {
                console.error(err);
            }
        };

        fetchProfile();
    }, []);

    if (!teacher) return <p>Loading...</p>;

    const handleTeacherProfileDisplay = () => {
        setTeacherProfileDisplay(!teacherProfileDisplay)
    }
    const handleLogout = () => {
        logout();         
        navigate("/login"); 
    };
    return (
        <div>

            <header className="w-full flex justify-between items-center px-6 py-4 bg-white shadow-md">

                <h1 className="text-xl font-semibold text-gray-800">
                    {teacher.full_name}
                </h1>


                <button
                    onClick={handleTeacherProfileDisplay}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
                >
                    <User className="w-6 h-6 text-gray-600" />
                </button>


                <div
                    className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 z-50
        ${teacherProfileDisplay ? "translate-x-0" : "translate-x-full"}`}
                >

                    <div className="p-4">
                        {/* <h2 className="text-lg font-semibold text-gray-800">Profile</h2> */}
                        <button
                            onClick={handleTeacherProfileDisplay}
                            className="p-2 rounded-full hover:bg-gray-100"
                        >
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>


                    <div className="flex flex-col items-center mt-6">
                        <div className="w-30 h-30 rounded-full bg-gray-200 flex items-center justify-center text-4xl font-bold text-gray-600">
                            {teacher.full_name.charAt(0)}
                        </div>
                        <h3 className="mt-3 text-xl font-semibold text-gray-800">
                            {teacher.full_name}
                        </h3>
                        <div className="mt-2 text-sm text-gray-600 space-y-1 text-center">
                            <p className="truncate">{teacher.email_address}</p>
                            <p className="flex items-center justify-center gap-1">
                                📞 {teacher.phone_number}
                            </p>
                            <p className="flex items-center justify-center gap-1">
                                🏫 {teacher.department}
                            </p>
                        </div>

                    </div>


                    <div className="mt-6 px-4 space-y-2">
                        <button className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                            <Settings className="w-5 h-5 mr-2" />
                            Settings
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                            <LogOut className="w-5 h-5 mr-2" />
                            Logout
                        </button>
                    </div>


                    <div className="absolute bottom-4 left-0 w-full text-center text-xs text-gray-400">
                        © {new Date().getFullYear()} Course Management
                    </div>
                </div>
            </header>
            <div className="p-6">
                <h1 className="text-xl font-bold mb-[30px]">My Classes</h1>




                <div>

                    {teacher.classes.length > 0 ? (
                        <div>
                            {teacher.classes.map((classInfo) => (
                                <Link to={`classes/${classInfo.id}`}>
                                <div
                                    
                                    className="cursor-pointer bg-white shadow-md rounded-xl p-5 hover:shadow-xl transition transform hover:-translate-y-1"
                                    key={classInfo.id}
                                >

                                    <div className="flex justify-between items-center">
                                        <h2 className="text-lg font-semibold text-gray-800">{classInfo.name}</h2>
                                        <span className="flex items-center text-sm text-gray-500">
                                            <MapPin className="w-4 h-4 mr-1" />
                                            Room {classInfo.roomOfClass_details && (<h2>{classInfo.roomOfClass_details.name}</h2>)}

                                        </span>
                                    </div>


                                    <p className="flex items-center text-gray-600 mt-2 text-sm">
                                        <Users className="w-4 h-4 mr-1" /> {classInfo.students ? (classInfo.students.length) : ("0")} Students
                                    </p>


                                    <div className="mt-3 space-y-1 text-sm text-gray-500">
                                        <p className="flex items-center">
                                            <Clock className="w-4 h-4 mr-1" />
                                            {classInfo.start_time} – {classInfo.end_time}
                                        </p>
                                        <p className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            {classInfo.startDate} → {classInfo.endDate}
                                        </p>
                                    </div>


                                    {/* <div className="flex mt-4 space-x-3">
                                        <button
                                            // onClick={(e) => {
                                            //     e.stopPropagation(); // prevent card click
                                            //     alert(`Add Assignment for ${classInfo.name}`);
                                            // }}

                                            className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition"
                                        >
                                            <Clipboard className="w-4 h-4" /> Assignment
                                        </button>
                                         
                                    </div> */}
                                </div></Link>
                            ))}
                        </div>

                    ) : (
                        <p className="text-sm text-red-500">No classes assigned</p>
                    )}
                </div>

            </div>
        </div>
    );
}
