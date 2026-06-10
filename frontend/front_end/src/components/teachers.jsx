import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import instance from "../api/axiosInstance";

function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [addTeacherDisplay, setAddTeacherDisply] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    full_name: "",
    phone_number: "",
    email_address: "",
    subject: "",
    department: "",
  });

  const [editTeacherId, setEditTeacherId] = useState(null);
  const [selectedTeacherInfo, setSelectedTeacherInfo] = useState(null);

  const getTeachers = async () => {
    try {
      const response = await instance.get("/teachers/");
      setTeachers(response.data);
    } catch (error) {
      console.error(error.message);
    }
  };

  useEffect(() => {
    getTeachers();
  }, []);

  const postTeacher = async (e) => {
    e.preventDefault();
    try {
      await instance.post("/teachers/", newTeacher);
      getTeachers();
      handleAddTeacherDisplay();
    } catch (error) {
      console.error(error.message);
    }
  };

  const getSelectedTeacher = async (teacherID) => {
    try {
      const response = await instance.get(`/teachers/${teacherID}/`);
      setSelectedTeacherInfo(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const updateTeacher = async (e) => {
    e.preventDefault();
    const payload = {
      full_name: selectedTeacherInfo.full_name,
      phone_number: selectedTeacherInfo.phone_number,
      email_address: selectedTeacherInfo.email_address,
      subject: selectedTeacherInfo.subject,
      department: selectedTeacherInfo.department,
    };
    try {
      await instance.patch(`/teachers/${editTeacherId}/`, payload);
      setEditTeacherId(null);
      getTeachers();
    } catch (error) {
      console.error(error.message);
    }
  };

  const deleteTeacher = async () => {
    try {
      await instance.delete(`/teachers/${editTeacherId}/`);
      setEditTeacherId(null);
      getTeachers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleTeacherInfo = (e) => {
    setNewTeacher((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  function handleAddTeacherDisplay() {
    setAddTeacherDisply(!addTeacherDisplay);
  }

  function handleEditTeacherInfoChange(e) {
    setSelectedTeacherInfo((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  return (
    <div className="teachersWholeContainer p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">👩‍🏫 All Teachers</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((teacher) => (
          <div
            key={teacher.id}
            className="bg-white shadow-md rounded-2xl p-4 border border-gray-200"
          >
            <h2 className="text-xl font-semibold mb-2">{teacher.full_name}</h2>
            <p className="text-gray-700 mb-1">
              <strong>Email:</strong> {teacher.email_address}
            </p>
            <p className="text-gray-700 mb-1">
              <strong>Phone:</strong> {teacher.phone_number}
            </p>
            <p className="text-gray-700 mb-1">
              <strong>Department:</strong> {teacher.department}
            </p>
            <p className="text-gray-700 mb-1">
              <strong>Subject:</strong> {teacher.subject}
            </p>
            <div className="mb-2">
              <strong>Classes:</strong>
              {teacher.classes.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {teacher.classes.map((cls) => (
                    <li key={cls.id}>{cls.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-red-500">No classes assigned</p>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  setEditTeacherId(teacher.id);
                  getSelectedTeacher(teacher.id);
                }}
                className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {editTeacherId && (
        <div className="fixed bg-gray-300 inset-0 z-50 flex justify-center items-center">
          <div className="w-full max-w-xl mt-10 p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mg-4">Edit Teacher</h2>
            <form onSubmit={updateTeacher} className="space-y-4 mt-[20px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  required
                  type="text"
                  name="full_name"
                  className="w-full p-2 border rounded"
                  value={selectedTeacherInfo?.full_name || ""}
                  onChange={handleEditTeacherInfoChange}
                />
                <input
                  required
                  type="email"
                  name="email_address"
                  className="w-full p-2 border rounded"
                  value={selectedTeacherInfo?.email_address || ""}
                  onChange={handleEditTeacherInfoChange}
                />
                <input
                  required
                  name="subject"
                  className="w-full p-2 border rounded"
                  value={selectedTeacherInfo?.subject || ""}
                  onChange={handleEditTeacherInfoChange}
                />
                <input
                  required
                  type="tel"
                  name="phone_number"
                  className="w-full p-2 border rounded"
                  value={selectedTeacherInfo?.phone_number || ""}
                  onChange={handleEditTeacherInfoChange}
                />
                <input
                  required
                  name="department"
                  className="w-full p-2 border rounded"
                  value={selectedTeacherInfo?.department || ""}
                  onChange={handleEditTeacherInfoChange}
                />
              </div>

              <div className="flex space-x-4 mt-4">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() =>
                    window.confirm(
                      "Are you sure you want to delete the teacher?",
                    )
                      ? deleteTeacher()
                      : setEditTeacherId(null)
                  }
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setEditTeacherId(null)}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-10 text-center">
        <button
          onClick={handleAddTeacherDisplay}
          className="addTeacherBtn bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
        >
          ➕ Add New Teacher
        </button>
      </div>

      {addTeacherDisplay && (
        <div className="formDisplay mt-6 p-4 bg-gray-100 rounded-xl shadow-md">
          <form onSubmit={postTeacher} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Full Name:</label>
                <input
                  required
                  type="text"
                  name="full_name"
                  className="w-full p-2 border rounded"
                  value={newTeacher.full_name}
                  onChange={handleTeacherInfo}
                />
              </div>
              <div>
                <label className="block mb-1">Phone Number:</label>
                <input
                  required
                  type="tel"
                  name="phone_number"
                  className="w-full p-2 border rounded"
                  value={newTeacher.phone_number}
                  onChange={handleTeacherInfo}
                />
              </div>
              <div>
                <label className="block mb-1">Email Address:</label>
                <input
                  required
                  type="email"
                  name="email_address"
                  className="w-full p-2 border rounded"
                  value={newTeacher.email_address}
                  onChange={handleTeacherInfo}
                />
              </div>
              <div>
                <label className="block mb-1">Subjects:</label>
                <input
                  required
                  name="subject"
                  className="w-full p-2 border rounded"
                  value={newTeacher.subject}
                  onChange={handleTeacherInfo}
                />
              </div>
              <div>
                <label className="block mb-1">Department:</label>
                <input
                  required
                  name="department"
                  className="w-full p-2 border rounded"
                  value={newTeacher.department}
                  onChange={handleTeacherInfo}
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={handleAddTeacherDisplay}
                type="button"
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Teachers;
