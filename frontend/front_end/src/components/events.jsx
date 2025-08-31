import { useState, useEffect } from "react"
import { useParams } from 'react-router-dom'
import { HiUserGroup, HiUser, HiAcademicCap } from 'react-icons/hi';
function Events() {

    const [students, setStudents] = useState(null)
    const [teachers, setTeachers] = useState(null)
    const [classes, setClasses] = useState(null)
    const [events, setEvents] = useState([])
    const [formDisplay, setFormDisplay] = useState(false)


    // for the event form
    const [title, setTitle] = useState("")
    const [discription, setDiscription] = useState("")
    const [image, setImage] = useState(null)
    const [date, setDate] = useState("")

    const [editEvent, setEditEvent] = useState(null)
    const savedTokens = localStorage.getItem("tokens");
    const fetchStudents = async () => {
        
        try {
            const parsedTokens = JSON.parse(savedTokens);
            const response = await fetch('http://127.0.0.1:8000/students/',{
                headers: {
          Authorization: `Bearer ${parsedTokens.access}`,
        },
            });
            if (!response.ok) {
                throw new Error('failed to fetch students')
            }
            const data = await response.json()
            setStudents(data)
            console.log(data)
        }
        catch (error) {
            console.error(error.message)
        }
    }
    const fetchTeachers = async () => {
        try {
            const parsedTokens = JSON.parse(savedTokens);

            const response = await fetch('http://127.0.0.1:8000/teachers/',{
                headers:{ Authorization: `Bearer ${parsedTokens.access}`},
            });
            if (!response.ok) {
                throw new Error('failed to fetch teachers')
            }
            const data = await response.json()
            setTeachers(data)

        }
        catch (error) {
            console.error(error.message)
        }
    }
    const fetchClasses = async () => {

        try {
            const parsedTokens = JSON.parse(savedTokens);

            const response = await fetch('http://127.0.0.1:8000/classes/',{
                headers:{ Authorization: `Bearer ${parsedTokens.access}`},
            });
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
    const fetchEvents = async () => {
        try {
            const parsedTokens = JSON.parse(savedTokens);

            const response = await fetch('http://127.0.0.1:8000/events/',{
                headers:{ Authorization: `Bearer ${parsedTokens.access}`},
            });
            if (!response.ok) {
                throw new Error('could not fetch events')
            }
            const data = await response.json();
            setEvents(data)

            console.log(data)
        }
        catch (error) {
            console.error(error.message)
        }
    }
    const handleEventPost = async (e) => {
        e.preventDefault();


        let formData = new FormData();
        formData.append("title", title);
        formData.append("discription", discription);
        formData.append("image", image);
        formData.append("date", date)

        try {
            const parsedTokens = JSON.parse(savedTokens);

            const response = await fetch(`http://127.0.0.1:8000/events/`, {
                method: 'POST',
                body: formData,
                headers:{ Authorization: `Bearer ${parsedTokens.access}`},
            });
            if (!response.ok) {
                throw new Error('could not post event')
            };

            const result = await response.json();

            fetchEvents();
            setTitle('');
            setDiscription('');
            setDate('');
            setImage(null);
            handleFormDisplay();
        }
        catch (error) {
            console.error(error.message)
        }
    }


    useEffect(() => {
        fetchStudents();
        fetchTeachers();
        fetchEvents();
        fetchClasses();

    }, [])

    function handleFormDisplay() {
        setFormDisplay(!formDisplay)
    }

    const handleUpdate = async () => {
        const formData = new FormData();
        formData.append('title', editEvent.title);
        formData.append('discription', editEvent.discription);
        formData.append('date', editEvent.date)
        if (editEvent.image && editEvent.image instanceof File) {
            formData.append('image', editEvent.image)
        }
        formData.append('image', editEvent.image);
        console.log(formData)
        const parsedTokens = JSON.parse(savedTokens);

        const response = await fetch(`http://127.0.0.1:8000/events/${editEvent.id}/`, {
            method: 'PUT',
            body: formData,
            headers:{ Authorization: `Bearer ${parsedTokens.access}`},
        })
        if (response.ok) {
            setEditEvent(null);
            fetchEvents();
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm('are you sure u want to delete the event!')) {
            const parsedTokens = JSON.parse(savedTokens);

            const response = await fetch(`http://127.0.0.1:8000/events/${id}/`, {
                method: 'DELETE',
                headers:{ Authorization: `Bearer ${parsedTokens.access}`},
            })
            if (response.ok) {
                fetchEvents()
            }
        }

    }
    function handleCancel() {
        setEditEvent(null)
        handleFormDisplay();
    }
    return (

        <div className="p-6 space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-gray-300 shadow-md rounded-lg p-6 flex justify-between items-center space-x-4">
                    <HiUserGroup className="text-blue-500 text-7xl" />
                    <div className="flex flex-col justify-between items-center">
                        <h2 className="text-2xl font-bold">
                            {students ? students.length : 0}
                        </h2>
                        <h2>Students</h2>
                    </div>

                </div>
                <div className="bg-gray-300 shadow-md rounded-lg p-6 flex justify-between items-center space-x-4">
                    <HiUser className="text-green-500 text-7xl" />
                    <div className="flex flex-col justify-between items-center">
                        <h2 className="text-2xl font-bold">
                            {teachers ? teachers.length : 0}
                        </h2>
                        <h2>Teachers</h2>
                    </div>

                </div>


                <div className="bg-gray-300 shadow-md rounded-lg p-6 flex justify-between items-center space-x-4">
                    <HiAcademicCap className="text-purple-500 text-7xl" />
                    <div className="flex flex-col justify-between items-center">
                        <h2 className="text-2xl font-bold">
                            {classes ? classes.length : 0}
                        </h2>
                        <h2>Classes</h2>
                    </div>
                </div>
            </div>
            <div className="bg-white shadow-md rounded-lg p-6">
                <div className="flex justify-between items-center p-4">
                    <h1 className="text-2xl font-bold">Recent Anouncements</h1>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        onClick={handleFormDisplay}>Add +</button>
                </div>
                <hr/>
                <div className="bg-white shadow-md rounded-lg p-6" style={{ display: formDisplay ? 'block' : 'none' }}>
                <form onSubmit={handleEventPost} encType="multipart/form-data">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                        <div >
                            <label className="block mb-1 font-medium">title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full border border-gray-300 p-2 rounded"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block mb-1 font-medium">Discription</label>
                            <textarea
                                maxLength={500}
                                value={discription}
                                onChange={(e) => setDiscription(e.target.value)}
                                className="w-full border border-gray-300 p-2 rounded"
                            />
                        </div>

                        <div>
                            <label className="block mb-1 font-medium">photo</label>
                            <input
                                type='file'
                                // value={editEvent.image}
                                onChange={(e) => setImage(e.target.files[0])}
                                className="block mb-1 font-medium"
                            ></input>
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">Date</label>
                            <input
                                type="date"
                                value={date} onChange={(e) => setDate(e.target.value)}
                                className="w-full border border-gray-300 p-2 rounded"
                            />

                        </div>

                        <div className="flex space-x-2 mt-4">
                            <button 
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >Save</button>

                            <button 
                                onClick={handleCancel}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >Cancel</button>
                        </div>
                    </div>


                </form>

            </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => (
                        <div key={event.id} className="bg-gray-100 rounded-lg p=4 shadow">
                            <h2 className="text-lg font-bold mb-2">{event.title}</h2>
                            <p className="text-sm text-gray-700 mb04">{event.discription}</p>
                            <img
                                src={`http://127.0.0.1:8000/${event.image}`}
                                className="w-full h-40 object-cover rounded mb-4"
                            />
                            <p className="text-sm text-gray-500 mb-2">{event.date}</p>
                            <div className="flext space-x-2">
                                <button
                                    onClick={() => setEditEvent(event)}
                                    className=" bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">
                                    Update
                                </button>
                                <button
                                    onClick={() => handleDelete(event.id)}
                                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                                >Delete</button>
                            </div>

                        </div>
                    ))}

                </div>



            </div>

            

            {editEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-300">
                <div className="bg-white p-6 rounded-lg w-full max-w-xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4">Edit event</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                        type="text"
                        value={editEvent.title}
                        onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })}
                        placeholder="title"
                        className="border border-gray-300 p-2 rounded"
                    />
                    <input
                        type="text"
                        value={editEvent.discription}
                        onChange={(e) => setEditEvent({ ...editEvent, discription: e.target.value })}
                        placeholder="discription"
                        className="border border-gray-300 p-2 rounded"
                    />
                    <input
                        type="file"
                        className="border border-gray-300 p-2 rounded"
                        onChange={(e) => setEditEvent({ ...editEvent, image: e.target.files[0] })}

                    />
                    <input
                        type="date"
                        value={editEvent.date}
                        onChange={(e) => setEditEvent({ ...editEvent, edit: e.target.value })}
                        placeholder="date"
                        className="border border-gray-300 p-2 rounded"
                    />
                    <div className="flex  space-x-3">
                        <button onClick={handleUpdate} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
                        <button onClick={(e) => setEditEvent(null)} className="bg-gray-500 text-white px-4 py-2 rounded">cancel</button>
                    </div>
                    
                    </div>
                </div>
                </div>
            )}
        </div>

    )
}
export default Events;