import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Pencil, Trash2, Save, XCircle } from 'lucide-react';


function IndividaulClass() {
    const { id } = useParams();

    const [cls, setClass] = useState(null)
    const navigate = useNavigate()
    const [editFormDisplay, setEditFormDisplay] = useState(false)
    const [selectedRoomId, setSelectedRoomId] = useState('')
    const [rooms, setRooms] = useState([])
    const savedTokens = localStorage.getItem("tokens");


    const fetchClass = async () => {
        try {
            const parsedTokens = JSON.parse(savedTokens)
            const response = await fetch(`http://127.0.0.1:8000/classes/${id}/`, {
                headers: {
                    Authorization: `Bearer ${parsedTokens.access}`,
                }
            });
            if (!response.ok) {
                throw new Error('could not fetch the class!');
            }
            const data = await response.json()
            console.log(data)
            setClass(data)

        }
        catch (error) {
            console.error(error)
        }
    }

    const fetchRooms = async () => {
        try {
            const parsedTokens = JSON.parse(savedTokens)
            const response = await fetch('http://127.0.0.1:8000/rooms/', {
                headers: {
                    Authorization: `Bearer ${parsedTokens.access}`
                },
            })
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
    useEffect(() => {
        fetchClass();
        fetchRooms();
    }, [id])
    const handleDelete = async () => {
        try {
            const parsedTokens = JSON.parse(savedTokens);
            const response = await fetch(`http://127.0.0.1:8000/classes/${id}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${parsedTokens.access}`,
                }
            });
            if (!response.ok) {
                throw new Error('could not delete the class!')
            }

        }
        catch (error) {
            console.error(error.message)
        }
        navigate(-1)
        fetchClass()
    }


    const handleChange = (e) => {
        setClass(prev => ({
            ...prev, [e.target.name]: e.target.value
        }))
    }


    const updateClass = async () => {
        const payload = {
            name: cls.name || "",
            subjects: cls.subjects || "",
            startDate: cls.startDate || "",
            endDate: cls.endDate || "",
            start_time: cls.start_time || null,
            end_time: cls.end_time || null,
            teachers: cls.teachers || [],
            roomOfClass: selectedRoomId ? Number(selectedRoomId) : null,
        };

        try {
            const parsedTokens = JSON.parse(savedTokens);
            const response = await fetch(`http://127.0.0.1:8000/classes/${id}/`, {
                method: "PATCH",  
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${parsedTokens.access}`,
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                console.error("Backend error:", errData);
                throw new Error("Could not update class!");
            }

            const data = await response.json();
            navigate(-1);
        } catch (error) {
            console.error(error.message);
        }
    };

    return (
        <>
            <div className="ClassWholeContainer">
                {cls ? (
                    <div className="rounded shadow-lg p-15 flex flex-col">
                        <div className='flex justify-between items-center'>
                            <div className="space-y-3 text-sm md:text-base">
                                <h2>Name</h2>
                                <h2>subjects</h2>
                                <h2>start date</h2>
                                <h2>end date</h2>
                                <h2>Start time</h2>
                                <h2>End time</h2>
                                <h2>Room</h2>

                            </div>
                            <div className="space-y-3 text-sm md:text-base" >
                                <h2>{cls.name}</h2>
                                <h2>{cls.subjects}</h2>
                                <h2>{cls.startDate}</h2>
                                <h2>{cls.endDate}</h2>
                                <h2>{cls.start_time}</h2>
                                <h2>{cls.end_time}</h2>
                                {cls.roomOfClass_details && (<h2>{cls.roomOfClass_details.name}</h2>)}





                            </div>
                        </div>
                        <div className="inline-flex gap-2 space-x-4">
                            <button
                                onClick={() => window.confirm('Are you sure you want to delete the class?') ? handleDelete() : navigate('/admin/dashboard/classes')}
                                className="mt-6 inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow"
                            >
                                <Trash2 size={16} /> Delete
                            </button>
                            <button
                                onClick={() => setEditFormDisplay(!editFormDisplay)}
                                className="mt-6 inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow "
                            >
                                <Pencil size={16} /> Edit
                            </button>
                            <button
                                onClick={() => navigate('/admin/dashboard/classes')}
                                className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white rounded shadow px-4 py-2 mt-6"
                            >
                                <XCircle size={16} /> Cancel
                            </button>
                        </div>
                    </div>


                ) : (
                    <h2>loading</h2>
                )}
                {editFormDisplay && (
                    <div className="fixed bg-gray-300 inset-0 z-50 flex justify-center items-center">
                        <div

                            className="space-y-6 bg-white p-6 rounded-2xl shadow-lg max-w-2xl border border-gray-200"
                        >
                            <h2 className="text-2xl font-bold text-center mb-4">Edit Class</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <label className="mb-1 text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        name='name'
                                        type="text"
                                        placeholder={cls.name}
                                        value={cls.name || ""}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-lg focus:ouline-none focus:ringe-2 focus:ring-blue-400"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="mb-1 text-sm font-medium text-gray-700">Subjects</label>
                                    <input
                                        name='subjects'
                                        type="number"
                                        placeholder={cls.subjects}
                                        value={cls.subjects || ""}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-lg focus:ouline-none focus:ringe-2 focus:ring-blue-400"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="mb-1 text-sm font-medium text-gray-700">Start date</label>
                                    <input
                                        name='startDate'
                                        type="date"
                                        placeholder={cls.startDate}
                                        value={cls.startDate || ""}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-lg focus:ouline-none focus:ringe-2 focus:ring-blue-400"
                                    />
                                </div>
                                <div className="flex flex-col ">
                                    <label className="mb-1 text-sm font-medium text-gray-700">End date</label>
                                    <input
                                        name='endDate'
                                        type="date"
                                        placeholder={cls.endDate}
                                        value={cls.endDate || ""}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-lg focus:ouline-none focus:ringe-2 focus:ring-blue-400"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="mb-1 text-sm font-medium text-gray-700">Start time</label>
                                    <input
                                        name='start_time'
                                        type="time"
                                        placeholder={cls.start_time}
                                        value={cls.start_time || ""}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-lg focus:ouline-none focus:ringe-2 focus:ring-blue-400"
                                    />
                                </div>
                                <div className="flex flex-col ">
                                    <label className="mb-1 text-sm font-medium text-gray-700">End Time</label>
                                    <input
                                        name='end_time'
                                        type="time"
                                        placeholder={cls.end_time}
                                        value={cls.end_time || ""}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-lg focus:ouline-none focus:ringe-2 focus:ring-blue-400"
                                    />
                                </div>
                                <div className="flex flex-col ">
                                    <label className="mb-1 text-sm font-medium text-gray-700">Room</label>
                                    <select value={selectedRoomId || ""} onChange={(e) => setSelectedRoomId(e.target.value)}>
                                        <option value="">Select Room</option>
                                        {rooms.map((room) => (
                                            <option key={room.id} value={room.id}>{room.name}</option>
                                        ))}
                                    </select>

                                </div>

                            </div>

                            <div className="inline-flex items-center gap-3">
                                <button
                                    // type="submit"
                                    onClick={updateClass}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow flex justify-between items-center transition-colors duration-200 gap-2"
                                >
                                    <Save size={16} />Save
                                </button>
                                <button

                                    onClick={() => navigate(-1)}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded shadow flex justify-between items-center transition-colors duration-200 gap-2"
                                >
                                    <XCircle size={16} />Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </>
    )
}
export default IndividaulClass;