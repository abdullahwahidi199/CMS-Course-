import { useEffect, useState } from "react";
import PieChartComponent from "./pieChartForStudents";
import PieChartComponent2 from "./pieChartForTeachers";
import { Link, useNavigate } from "react-router-dom";
import { Pencil, Trash2, Save, XCircle } from 'lucide-react';

import { HiOutlineUser, HiOutlineUserGroup, HiOutlineBookOpen } from 'react-icons/hi';


function Classes() {
    const [classes, setClasses] = useState(null)
    const [addStuFormDisplay, setAddStuFormDisplay] = useState(false)

    const [selectedClassId, setSelectedClassId] = useState(null)

    const [teachers, setTeachers] = useState([])
    const [selectedTeachers, setSelectedTeachers] = useState({})


    const [addClassFormDisplay, setAddClassFormDisplay] = useState(false)
    const [newClass, setNewClass] = useState({ 'name': '', 'subjects': '', 'startDate': '', 'endDate': '','start_time':'','end_time':''})
    const [selectedRoomId, setSelectedRoomId] = useState('')
    const [updatedClass, setUpdatedClass] = useState({ 'name': '', 'subjects': '', 'startDate': '', 'endDate': '' ,'start_time':'','end_time':''})
    const [editClassID, setEditClassId] = useState(null)
    const [editClassDisplay, setEditClassDisplay] = useState(false)
    const [rooms, setRooms] = useState([])


    const [teacherFormDisplay, setTeacherFormDisplay] = useState(false)


    const navigate = useNavigate()

    const fetchClasses = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/classes/');
            if (!response.ok) {
                throw new Error('could not fetch classes from the API')
            };
            const data = await response.json();
            setClasses(data)

        }
        catch (error) {
            console.error(error.message)
        }
    }


    const fetchRooms = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/rooms/')
            if (!response.ok) {
                throw new Error('could not fetch Rooms!')
            }
            const data = await response.json()
            setRooms(data)
        }
        catch (error) {
            console.error(error.message)
        }
    }

    const fetchTeachers = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/teachers/`)
            if (!response.ok) {
                throw new Error('could not fetch teachers!');

            }
            const data = await response.json()
            setTeachers(data)
        }
        catch (error) {
            console.error(error.message)
        }
    }

    const handleAssignTeachers = async (classID) => {

        const teacherIDToADD = selectedTeachers[classID]?.[0]
        if (!teacherIDToADD) return;

        try {
            const classRes = await fetch(`http://127.0.0.1:8000/classes/${classID}/`)
            const classData = await classRes.json()
            const currentTeacherIDs = classData.teachers;
            const updatedTeacherIDs = [...new Set([...currentTeacherIDs, teacherIDToADD])]

            const response = await fetch(`http://127.0.0.1:8000/classes/${classID}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teachers: updatedTeacherIDs
                })
            })

            if (!response.ok) {
                throw new Error('failed to assign the new teacher')

            }
            const updatedClassWithTeachers = await response.json()
            setClasses((prevClasses) =>
                prevClasses.map((cls) => (cls.id === classID ? updatedClassWithTeachers : cls)
                )
            )

            setSelectedTeachers((prev) => ({
                ...prev,
                [classID]: [],
            }))
            handleTeacherFormDisplay()


        }
        catch (error) {
            console.error(error)
        }


    }

    useEffect(() => {
        fetchClasses();
        fetchTeachers();
        fetchRooms();
    }, [])

    const handleDeleteTeachers = async (classId) => {

        const selectedToDelete = selectedTeachers[classId] || []

        const currentClass = classes.find((cls) => cls.id === classId);

        const currentTeacherIds = currentClass.teachers_details.map((t) => t.id)

        const updatedTeacherIDs = currentTeacherIds.filter(
            (id) => !selectedToDelete.includes(id)
        )

        if (updatedTeacherIDs.length === currentTeacherIds.length) {
            window.alert('not in class to delete!')
        }
        else {
            try {
                const response = await fetch(`http://127.0.0.1:8000/classes/${classId}/`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        teachers: updatedTeacherIDs
                    })

                })
                if (!response.ok) {
                    const updatedClass = await response.json();
                    throw new Error('could not delete the teacher!')

                }
                const updatedClass = await response.json();

                setClasses((prevClasses) =>
                    prevClasses.map((cls) => (cls.id === classId ? updatedClass : cls)
                    )
                )


                setSelectedTeachers((prev) => ({
                    ...prev,
                    [classId]: []
                }))
                handleTeacherFormDisplay()

            }
            catch (error) {
                console.error(error)
            }
        }


    }

    function handleAddStuFormDisplay() {
        console.log(selectedClassId)
        setAddStuFormDisplay(!addStuFormDisplay)
    }

    function handleAddClassFormDisplay() {
        setAddClassFormDisplay(!addClassFormDisplay)

    }

    function handleTeacherFormDisplay() {
        console.log(selectedClassId)
        setTeacherFormDisplay(!teacherFormDisplay)

    }

    function handleEditClassDisplay() {
        setEditClassDisplay(!editClassDisplay)
    }



    const add_student = async (e) => {
        e.preventDefault();

        const studentData = {
            ...newStudent,
            studentClass: selectedClassId
        }

        try {

            const response = await fetch(`http://127.0.0.1:8000/students/`, {
                method: 'POST',

                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentData),
            })
            if (!response.ok) {
                throw new Error('hhhh')
            }
            const result = await response.json();


            setNewStudent({ 'name': '', 'f_name': '', 'role_number': '', 'parent_mobile_number': '', 'address': '' })
            fetchClasses();
            handleAddStuFormDisplay()

        }
        catch (error) {
            console.error(error.message)
        }
    }


    // const add_teacher=async (e)=>{
    //     e.preventDefault();

    //     const teacherData={
    //         ...newTeacher,

    //     }

    // }


    const add_class = async (e) => {

        e.preventDefault();

        const classData = {
            ...newClass,
            roomOfClass: selectedRoomId
        }

        const response = await fetch(`http://127.0.0.1:8000/classes/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(classData)
        }
        )
        const data=await response.json()
        if (!response.ok) {
            
            const errorMsg = data.non_field_errors ? data.non_field_errors[0] : "Could not add class!";
            alert(errorMsg);
            return;
        }
        setNewClass({ 'name': '', 'subjects': '', 'startDate': '', 'endDate': '' ,'start_time':'','end_time':''})
        setRoomOfClass('')

    }





const updateClass = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch(`http://127.0.0.1:8000/classes/${editClassID}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',

            },
            body: JSON.stringify(updatedClass)
        })
        if (!response.ok) {
            let errorText = await response.text(); // <-- safer than response.json()
            console.error("Server error:", errorText);
            throw new Error('could not post the new class!');
        }
        const data = await response.json();
        navigate('/classes');
        setEditClassId(null);
        setUpdatedClass({ 'name': '', 'subjects': '', 'startDate': '', 'endDate': '','start_time':'','end_time':''})
        fetchClasses();
    }


    catch (error) {
        console.error(error.message)
    }
}

const handleClassDelete = async () => {

    try {
        const response = await fetch(`http://127.0.0.1:8000/classes/${editClassID}/`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('could not delete the class!')
        }

    }
    catch (error) {
        console.error(error.message)
    }
    navigate('/classes')
    setEditClassId(null)
    fetchClasses()
}
const handleStudentInfo = (e) => {
    setNewStudent(prev => ({
        ...prev, [e.target.name]: e.target.value
    }))

}
const handleClassesInfo = (e) => {
    setNewClass(prev => ({
        ...prev, [e.target.name]: e.target.value
    }))
}

const handleSelectChange = (classId, selectedOptions) => {
    const teacherIds = Array.from(selectedOptions).map((opt) =>
        parseInt(opt.value)
    );
    setSelectedTeachers((prev) => ({
        ...prev,
        [classId]: teacherIds,
    }))
}

const handleEditClassInfo = (e) => {
    setUpdatedClass(prev => ({
        ...prev, [e.target.name]: e.target.value
    }))
}


return (

    <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">All Classes</h1>
            <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={() => {
                    handleAddClassFormDisplay()
                }}>
                Add class
            </button>
        </div>


        {classes ? (
            classes.map((classItem) => (
                <div className="bg-white p-6 rounded-lg shadow-md space-y-6" key={classItem.id}>
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">{classItem.name}</h2>
                        <Link to={`${classItem.id}`}>
                        <button
                            onClick={() => setEditClassId(classItem.id)}
                            className="text-sm text-blue-600 hover:underline cursor-pointer">
                            Edit class
                        </button></Link>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded p-4 flex items-center justify-between">
                            <PieChartComponent data={{ students_count: classItem.student.length }} />
                        </div>
                        <div className="bg-gray-50 rounded p-4 flex items-center justify-between">
                            <PieChartComponent2 data={{ teachers_count: classItem.teachers.length }} />
                        </div>

                        <div className="teachers">
                            <h2 className="text-lg font-bold mb-2">Teachers</h2>
                            <ul className="list-disc list-inside mb-2 text-gray-700">
                                {classItem.teachers_details.map(teacher => (
                                    <li key={teacher.id}>{teacher.full_name}</li>

                                ))}</ul>
                            <button
                                className="text-sm text-blue-600 hover:underline cursor-pointer"
                                onClick={() => {
                                    handleTeacherFormDisplay();

                                }}>Edit teachers</button>


                            <div style={{ display: teacherFormDisplay ? 'block' : 'none' }} className="mt-4 space-y-2">
                                <select
                                    multiple
                                    className="w-full border border-gray-300 p-2 rounded"
                                    value={selectedTeachers[classItem.id] || []}
                                    onChange={(e) => {
                                        handleSelectChange(classItem.id, e.target.selectedOptions)
                                    }}
                                >
                                    {teachers.map((teacher) => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {teacher.full_name}
                                        </option>
                                    ))}

                                </select>
                                <div style={{ display: 'flex', marginLeft: -10 }} className="flex space-x-2">
                                    <button
                                        onClick={() => handleAssignTeachers(classItem.id)}
                                        className="bg-green-600 text-white px-3 py-1 rounded">
                                        Assign
                                    </button>


                                    <button
                                        onClick={() => window.confirm('Are u sure u want to remove the teacher') ? handleDeleteTeachers(classItem.id) : ''}
                                        className="bg-green-600 text-white px-3 py-1 rounded">
                                        delete
                                    </button>


                                    <button
                                        onClick={() => { handleTeacherFormDisplay() }}
                                        className="bg-green-600 text-white px-3 py-1 rounded">
                                        cancel
                                    </button>
                                </div>
                            </div>


                        </div>

                        <div className="overflow-x-auto mt-6">
                            <h2 className="text-lg font-semibold mb-2">Students</h2>
                            <table className="min-w-full table-auto border border-gray-300">
                                <thead>
                                    <tr className="bg-gray-200 text-left">
                                        <th className="px-4 py-2">Role Number</th>
                                        <th className="px-4 py-2">Name</th>
                                        <th className="px-4 py-2">Father's Name</th>
                                        <th className="px-4 py-2">Profile & attendance</th>
                                    </tr>
                                </thead>
                                {classItem.student.map((student) => (
                                    <tbody key={student.id}>

                                        <tr className="border-t">

                                            <td className="px-4 py-2">{student.role_number}</td>
                                            <td className="px-4 py-2">{student.name}</td>
                                            <td className="px-4 py-2 ">{student.f_name}</td>

                                            <td className="text-blue-600 hover:underline -">
                                                <Link to={`/${student.id}`} className="ml-4 inline-flex">profile & attendance{student.total_fee - student.amount_paid > 0 ? <p >🔴</p> : ''}</Link>
                                            </td>

                                        </tr>


                                    </tbody>

                                ))}
                            </table>


                        </div>




                        <div className="mt-6">
                            <h2 className="text-lg font-bold">Subjects</h2>
                            <p className="text-gray-600">{classItem.subjects}</p>
                        </div>



                        <div>
                            <h2>Total earnings: {classItem.total_earnings}</h2>
                        </div>





                        {editClassID && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-300">
                                <div className="bg-white p-6 rounded-lg w-full max-w-xl shadow-lg ">
                                    <h2 className="text-xl font-bold mg-4">Edit Class</h2>
                                    <form onSubmit={(e) => updateClass(e)} className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <input
                                                name="name"
                                                value={updatedClass.name}
                                                onChange={handleEditClassInfo}
                                                placeholder="Class name"
                                                className="border border-gray-300 p-2 rounded"
                                            />
                                            <input
                                                name="subjects"
                                                value={updatedClass.subjects}
                                                onChange={handleEditClassInfo}
                                                placeholder="Subjects"
                                                className="border border-gray-300 p-2 rounded"
                                            />
                                            <input
                                                type="date"
                                                name="startDate"
                                                value={updatedClass.startDate}
                                                onChange={handleEditClassInfo}
                                                className="border border-gray-300 p-2 rounded"
                                            />
                                            <input
                                                type="date"
                                                name="endDate"
                                                value={updatedClass.endDate}
                                                onChange={handleEditClassInfo}
                                                className="border border-gray-300 p-2 rounded"
                                            />
                                        </div>
                                        <div className="flex space-x-2 mt-10 justify-center">
                                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded inline-flex items-center gap-2">
                                                <Save size={16} />Save
                                            </button>
                                            <button
                                                onClick={() => setEditClassId(null)}
                                                type="button"
                                                className="bg-gray-500 text-white px-4 py-2 rounded inline-flex items-center gap-2"
                                            >
                                                <XCircle size={16} /> Cancel
                                            </button>
                                            <button
                                                onClick={() => window.confirm('Are you sure you want to delete the class?') && handleClassDelete()}
                                                type="button"
                                                className="bg-red-600 text-white px-4 py-2 rounded inline-flex gap-2 items-center"
                                            >
                                                <Trash2 size={16} />Delete Class
                                            </button>
                                        </div>
                                    </form>

                                </div>

                            </div>
                        )}



                    </div>




                </div>

            ))
        ) : (
            <h2 className="text-center text-gray-500 text-lg">No classes yet!</h2>
        )}


        {addClassFormDisplay && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-300 bg-opacity-50 ">
                <div className="bg-white p-6 rounded-lg w-full max-w-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Add New Class</h2>
                    <form onSubmit={add_class} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input name="name" value={newClass.name} onChange={handleClassesInfo} placeholder="Class name" className="border border-gray-300 p-2 rounded" />
                            <input name="subjects" value={newClass.subjects} onChange={handleClassesInfo} placeholder="Subjects" className="border border-gray-300 p-2 rounded" />
                            <input type="date" name="startDate" value={newClass.startDate} onChange={handleClassesInfo} className="border border-gray-300 p-2 rounded" />
                            <input type="date" name="endDate" value={newClass.endDate} onChange={handleClassesInfo} className="border border-gray-300 p-2 rounded" />
                            <input type="time" name='start_time' value={newClass.start_time} onChange={handleClassesInfo} className="border border-gray-300 p-2 rounded" /> 
                            <input type="time" name='end_time' value={newClass.end_time} onChange={handleClassesInfo} className="border border-gray-300 p-2 rounded" />
                            <select value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)}>
                            <option value=''>Room name</option>

                                {rooms.map((room) => (
                                    <option key={room.id} value={room.id}>{room.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded inline-flex items-center gap-2">
                                <Save size={16} />Save</button>
                            <button type="button" onClick={handleAddClassFormDisplay}
                                className="bg-gray-500 text-white px-4 py-2 rounded inline-flex items-center gap-2">
                                <XCircle size={16} />Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>

)}

export default Classes;