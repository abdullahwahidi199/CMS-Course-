import { useEffect, useState } from "react";
import instance from "../api/axiosInstance";

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState({ name: "" });
  const [addRoomDisplay, setAddRoomDisplay] = useState(false);

  const fetchRooms = async () => {
    try {
      const response = await instance.get("/rooms/");
      setRooms(response.data);
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const addNewRoom = async (e) => {
    e.preventDefault();
    try {
      await instance.post("/rooms/", newRoom);
      setNewRoom({ name: "" });
      fetchRooms();
      setAddRoomDisplay(false);
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await instance.delete(`/rooms/${id}/`);
      setRooms((prev) => prev.filter((room) => room.id !== id));
    } catch (error) {
      console.log(error);
    }
  };

  const handleAddRoomDisplay = () => {
    setAddRoomDisplay(!addRoomDisplay);
  };

  const handleInfoChange = (e) => {
    setNewRoom((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Rooms</h1>
        <button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
          onClick={handleAddRoomDisplay}
        >
          Add +
        </button>
      </div>

      {addRoomDisplay && (
        <div className="mt-6 bg-white shadow-md rounded-2xl p-6 border border-gray-200 max-w-md">
          <h2 className="text-lg font-semibold mb-4">Add New Room</h2>
          <form onSubmit={addNewRoom} className="space-y-4">
            <input
              type="text"
              name="name"
              value={newRoom.name}
              onChange={handleInfoChange}
              placeholder="Enter room name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleAddRoomDisplay}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
              >
                Add Room
              </button>
            </div>
          </form>
        </div>
      )}

      <div>
        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-white shadow-md rounded-2xl p-4 border border-gray-200"
          >
            <h2 className="text-xl font-semibold mb-2">{room.name}</h2>

            <h2 className="text-xl font-semibold mb-2">Classes</h2>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {room.classes && room.classes.length > 0 ? (
                room.classes.map((cls) => (
                  <li key={cls.id}>
                    {cls.name} ({cls.start_time} - {cls.end_time})
                  </li>
                ))
              ) : (
                <h2 className="text-red-600">No classes assigned</h2>
              )}
            </ul>

            <button
              className="bg-red-500 mt-[15px] hover:bg-red-600 text-white rounded-[5px] px-5 py-1"
              onClick={() => handleDelete(room.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
