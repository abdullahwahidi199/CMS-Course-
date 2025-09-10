import { useEffect, useState } from "react";

export default function Rooms() {

    const [rooms, setRooms] = useState([])
    const savedTokens = localStorage.getItem("tokens");
    const [newRoom, setNewRoom] = useState({ 'name': '' })
    const [addRoomDisplay, setAddRoomDisplay] = useState(false)
    const fetchRooms = async () => {
        const parsedTokens = JSON.parse(savedTokens);
        const response = await fetch('http://127.0.0.1:8000/rooms/', {
            headers: {
                Authorization: `Bearer ${parsedTokens.access}`,
            },
        })
        if (response.ok) {
            const data = await response.json();
            setRooms(data)
        }

    }
    useEffect(() => {
        fetchRooms();
    }, [])


    const addNewRoom = async (e) => {
        e.preventDefault();
        try {
            const parsedTokens = JSON.parse(savedTokens);
            const response = await fetch(`http://127.0.0.1:8000/rooms/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json',
                    Authorization: `Bearer ${parsedTokens.access}`
                 },
                body: JSON.stringify(newRoom)
            })
            if (!response.ok) {
                throw new Error('could not add new room')
            }
            setNewRoom({ 'name': '' });
            fetchRooms();
            setAddRoomDisplay(false);
        }
        catch (error) {
            console.log(error.message)
        }

    }
    const handleAddRoomDisplay = () => {
        setAddRoomDisplay(!addRoomDisplay)
    }
    const handleInfoChange=(e)=>{
        setNewRoom(prev=>({
            ...prev,[e.target.name]:e.target.value
        }))
    }
    return (
        <div className='p-6 space-y-6'>
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Rooms</h1>
                <button className='px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white' onClick={handleAddRoomDisplay}>Add +</button>
            </div>
            <div>
                {rooms.map((room) => (
                    <div key={room.id} className="bg-white shadow-md rounded-2xl p-4 border border-gray-200">
                        <h2 className="text-xl font-semibold mb-2">{room.name}</h2>


                        <h2 className="text-xl font-semibold mb-2">Classes</h2>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                            { room .classes && room.classes.length>0 ?(
                                room.classes.map((cls) => (
                                <li key={cls.id}>{cls.name} ({cls.start_time} - {cls.end_time})</li>
                            ))
                       
                            ):(<h2 className="text-red-600">No classes assigend </h2>)}
                            
                         </ul>
                    </div>
                ))}
            </div>
            {addRoomDisplay && (

                <form
                    onClick={(e) => addNewRoom(e)}
                >
                    <input type="text" name="name" value={newRoom.name} onChange={handleInfoChange}/>
                    <button type="submit">Add Room</button>
                </form>

            )}
        </div>
    )
}