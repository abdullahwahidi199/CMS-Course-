import { useEffect, useState } from "react";
import { HiPencil } from "react-icons/hi";
import { Pencil, Trash2, Save, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import instance from "../api/axiosInstance";

function Staff() {
  const [formDisplay, setFormDisplay] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone_number, setPhoneNum] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState(null);

  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [editStaff, setEditStaff] = useState(null);

  const fetchStaff = async () => {
    try {
      const response = await instance.get("/staff/");
      setStaff(response.data);
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const addStaff = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("role", role);
    formData.append("phone_number", phone_number);
    formData.append("email", email);
    if (photo) formData.append("photo", photo);

    try {
      await instance.post("/staff/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchStaff();
      setName("");
      setRole("");
      setPhoneNum("");
      setEmail("");
      setPhoto(null);
      handleFormdisplay();
    } catch (error) {
      console.log(error.response?.data || error.message);
    }
  };

  const updateStaff = async () => {
    const formData = new FormData();
    formData.append("name", editStaff.name);
    formData.append("role", editStaff.role);
    formData.append("phone_number", editStaff.phone_number);
    formData.append("email", editStaff.email);

    if (editStaff.photo && editStaff.photo instanceof File) {
      formData.append("photo", editStaff.photo);
    }

    try {
      await instance.put(`/staff/${editStaff.id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchStaff();
      setEditStaff(null);
    } catch (error) {
      console.log(error);
    }
  };

  const deleteStaff = async (id) => {
    if (window.confirm("Are you sure u want to delete?")) {
      try {
        await instance.delete(`/staff/${id}/`);
        fetchStaff();
      } catch (error) {
        console.log(error.message);
      }
    }
  };

  const handleFormdisplay = () => {
    setFormDisplay(!formDisplay);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">All staff</h1>
        <button
          className="bg-blue-600 hover:bg-blue-700 cursor-pointer rounded p-2 text-white"
          onClick={handleFormdisplay}
        >
          + Add Staff
        </button>
      </div>
      {formDisplay && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <form onSubmit={addStaff} encType="multipart/form-data">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 font-medium">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Role</label>
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">photo</label>
                <div>
                  <input
                    type="file"
                    onChange={(e) => setPhoto(e.target.files[0])}
                    className="block mb-1 font-medium cursor-pointer border-1 p-2 h-10 w-54"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1 font-medium">email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">phone number</label>
                <input
                  type="tel"
                  value={phone_number}
                  onChange={(e) => setPhoneNum(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>
              <br />

              <div className=" inline-flex gap-3 items-center mt-[25px]">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 rounded text-white inline-flex gap-2 p-2 py-1 items-center"
                >
                  <Save size={16} />
                  Save
                </button>
                <button
                  onClick={handleFormdisplay}
                  className="bg-gray-600 hover:bg-gray-700 rounded text-white inline-flex gap-2 items-center p-2 py-1"
                >
                  <XCircle size={16} />
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((s) => (
            <div
              key={s.id}
              className="bg-white shadow-md rounded-2xl p-4 border border-gray-200"
            >
              <div className="flex justify-center items-center ">
                <img
                  src={`http://127.0.0.1:8000/${s.photo}`}
                  className="rounded-full w-55 h-55 shadow-lg mb-4"
                />
              </div>
              <h1 className="text-xl font-bold mb-2">{s.name}</h1>
              <p className="text-gray-700 mb-1">
                <strong>Role: </strong>
                {s.role}
              </p>
              <p className="text-gray-700 mb-1">
                <strong>phone number: </strong> {s.phone_number}
              </p>
              <p className="text-gray-700 mb-1">
                <strong>Email: </strong>
                {s.email}
              </p>
              <div className="inline-flex gap-3 items-center">
                <button
                  className="inline-flex items-center gap-1 cursor-pointer px-4 p-1 bg-blue-600 hover:bg-blue-700 rounded text-white"
                  onClick={() => setEditStaff(s)}
                >
                  <HiPencil size={16} />
                  Edit
                </button>
                <button
                  onClick={() => deleteStaff(s.id)}
                  className="bg-red-600 hover:bg-red-700 cursor-pointer rounded inline-flex items-center gap-2 p-2 py-1"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {editStaff && (
        <div className="fixed inset-0 z-50 bg-gray-300 flex justify-center items-center">
          <div className="w-full max-w-xl mt-10 rounded-lg bg-white p-6 shadow-lg">
            <h2 className="font-bold text-xl mg-4 text-center mb-[20px] ">
              Edit Staff
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                value={editStaff.name}
                onChange={(e) =>
                  setEditStaff({ ...editStaff, name: e.target.value })
                }
                className="border border-gray-300 p-2 rounded"
                placeholder="Name"
              />
              <input
                type="text"
                value={editStaff.role}
                onChange={(e) =>
                  setEditStaff({ ...editStaff, role: e.target.value })
                }
                placeholder="New Role"
                className="border border-gray-300 p-2 rounded"
              />
              <input
                type="email"
                value={editStaff.email}
                onChange={(e) =>
                  setEditStaff({ ...editStaff, email: e.target.value })
                }
                placeholder="New Email"
                className="border border-gray-300 p-2 rounded"
              />
              <input
                type="tel"
                value={editStaff.phone_number}
                onChange={(e) =>
                  setEditStaff({ ...editStaff, phone_number: e.target.value })
                }
                placeholder="New mobile number"
                className="border border-gray-300 p-2 rounded"
              />
              <input
                type="file"
                onChange={(e) =>
                  setEditStaff({ ...editStaff, photo: e.target.files[0] })
                }
                className="border border-gray-300 p-2 rounded"
              />
              <br />
              <div className="flex gap-3 items-center">
                <button
                  onClick={updateStaff}
                  className="bg-blue-600 hover:bg-blue-700 rounded text-white inline-flex gap-2 p-2 py-1 items-center"
                >
                  <Save size={16} />
                  Save
                </button>
                <button
                  onClick={() =>
                    window.confirm("Are you sure") ? setEditStaff(null) : ""
                  }
                  className="bg-gray-600 hover:bg-gray-700 rounded text-white inline-flex gap-2 items-center py-1 p-2"
                >
                  <XCircle size={16} />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Staff;
