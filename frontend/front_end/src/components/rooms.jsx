import { useEffect, useState } from "react";

export default function Rooms(){

    const [rooms,setRooms]=useState([])
    const fetchRooms=async ()=>{
        const response=await fetch('http://127.0.0.1:8000/rooms/')
        if (response.ok){
            const data=await response.json();
            setRooms(data)
        }
        
    }
    useEffect(()=>{
            fetchRooms();
        },[])
    return(
        <div className='p-6 space-y-6'>
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Rooms</h1>
                <button className='px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white'>Add +</button>
            </div>
            <div>
                {rooms.map((room)=>(
                <div key={room.id} className="bg-white shadow-md rounded-2xl p-4 border border-gray-200">
                    <h2 className="text-xl font-semibold mb-2">{room.name}</h2>
                    

                    <h2 className="text-xl font-semibold mb-2">Classes</h2>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                        {room.classes.map((cls)=>(
                            <li key={cls.id}>{cls.name} ({cls.start_time} - {cls.end_time})</li>
                        ))}
                    </ul>
                </div>
            ))}
            </div>
            
        </div>
    )
}