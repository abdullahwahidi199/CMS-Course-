import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import instance from "../../api/axiosInstance";

export default function Assignment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [local, setLocal] = useState({});
  const [error, setError] = useState(null);
  const [editingDisplay, setEditingDisplay] = useState(false);
  const [classId, setClassId] = useState(null);

  const [editData, setEditData] = useState({
    title: "",
    discription: "",
    due_date: "",
    total_marks: "",
  });

  const fetchAssignment = async () => {
    try {
      const response = await instance.get(`/assignments/${id}/`);
      const data = response.data;
      setAssignment(data);
      setSubmissions(data.submissions);
      setClassId(data.class_assigned);

      setEditData({
        title: data.title,
        discription: data.discription,
        due_date: data.due_date,
        total_marks: data.total_marks,
      });
    } catch (error) {
      setError(error);
    }
  };

  useEffect(() => {
    if (!classId) return;

    const fetchClass = async () => {
      try {
        const response = await instance.get(`/classes/${classId}/`);
        setStudents(response.data.student);
      } catch (error) {
        console.log(error.message);
      }
    };

    fetchClass();
  }, [classId]);

  useEffect(() => {
    const initial = {};
    submissions.forEach((s) => {
      initial[s.id] = {
        marks_obtained: s.marks_obtained || "",
        suggestion: s.suggestion || "",
        status: s.status || "pending",
      };
    });
    setLocal(initial);
  }, [submissions]);

  useEffect(() => {
    fetchAssignment();
  }, []);

  const handleSubmissionChange = (submissionId, field, value) => {
    setLocal((prev) => ({
      ...prev,
      [submissionId]: { ...prev[submissionId], [field]: value },
    }));
  };

  const handleSaveAll = async () => {
    try {
      const payload = students.map((student) => {
        const existing = submissions.find((s) => s.student === student.id);
        const key = existing?.id || student.id;
        const entry = local[key] || {
          marks_obtained: "",
          suggestion: "",
          status: "pending",
        };

        return {
          id: existing?.id || null,
          student: existing ? null : student.id,
          assignment: assignment.id,
          marks_obtained: entry.marks_obtained || null,
          suggestion: entry.suggestion || "",
          status: entry.status || "pending",
        };
      });

      await instance.patch("/submissions/bulk_update/", payload);

      alert("Submissions updated successfully!");
      fetchAssignment();
    } catch (err) {
      console.log(err);
      alert("Error updating submissions");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await instance.patch(`/assignments/${id}/`, editData);
      setEditingDisplay(false);
      fetchAssignment();
    } catch (error) {
      console.log(error);
      setError(error);
    }
  };

  const handleDelete = async () => {
    try {
      await instance.delete(`/assignments/${id}/`);
      navigate(-1);
    } catch (error) {
      console.log(error.message);
    }
  };

  const today = new Date();

  if (!assignment)
    return (
      <div className="text-center text-gray-500 text-lg animate-pulse">
        Loading assignment...
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-8 font-sans">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-2xl rounded-3xl p-8 mb-10">
        <h2 className="text-4xl font-extrabold tracking-tight mb-3">
          {assignment.title}
        </h2>
        <p className="text-lg opacity-90 mb-2">
          Due: <span className="font-semibold">{assignment.due_date}</span>
        </p>
        <p className="opacity-95">{assignment.discription}</p>
        <div className="mt-5">
          <button
            onClick={() => setEditingDisplay(true)}
            className="bg-yellow-500 text-white px-3 py-1 rounded mr-2"
          >
            Edit
          </button>
          <button
            className="bg-red-600 text-white px-3 py-1 rounded"
            onClick={() =>
              window.confirm(
                "Are you sure you want to delete this assignment?",
              ) && handleDelete()
            }
          >
            Delete
          </button>
        </div>
      </div>

      {editingDisplay && (
        <div className="fixed inset-0 bg-gray-300 bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg p-8 rounded-3xl shadow-2xl transform transition-all duration-300 scale-95 hover:scale-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              ✏️ Edit Assignment
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="relative">
                <label className="absolute -top-3 left-3 bg-white px-2 text-sm text-gray-500">
                  Title
                </label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) =>
                    setEditData({ ...editData, title: e.target.value })
                  }
                  className="w-full border rounded-xl py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>
              <div className="relative">
                <label className="absolute -top-3 left-3 bg-white px-2 text-sm text-gray-500">
                  Description
                </label>
                <textarea
                  value={editData.discription}
                  onChange={(e) =>
                    setEditData({ ...editData, discription: e.target.value })
                  }
                  className="w-full border rounded-xl py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  rows="3"
                />
              </div>
              <div className="relative">
                <label className="absolute -top-3 left-3 bg-white px-2 text-sm text-gray-500">
                  Due Date
                </label>
                <input
                  type="date"
                  value={editData.due_date}
                  onChange={(e) =>
                    setEditData({ ...editData, due_date: e.target.value })
                  }
                  className="w-full border rounded-xl py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>
              <div className="relative">
                <label className="absolute -top-3 left-3 bg-white px-2 text-sm text-gray-500">
                  Total Marks
                </label>
                <input
                  type="number"
                  value={editData.total_marks}
                  onChange={(e) =>
                    setEditData({ ...editData, total_marks: e.target.value })
                  }
                  className="w-full border rounded-xl py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setEditingDisplay(false)}
                  className="px-6 py-3 rounded-xl font-semibold border text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md"
                >
                  💾 Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-3xl font-bold text-gray-800 mb-8">
          Student Submissions
        </h3>
        {new Date(assignment.due_date) < today && (
          <div className="mb-6 p-4 rounded-xl bg-red-100 border border-red-300 text-red-700 font-medium shadow-sm">
            ⚠️ Submissions are locked. You cannot edit because the assignment
            due date has already passed.
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-8">
          {students.map((student) => {
            const existing = submissions.find((s) => s.student === student.id);
            const key = existing?.id || student.id;
            const subData = local[key] || {
              marks_obtained: "",
              suggestion: "",
              status: "pending",
            };
            const dueDate = new Date(assignment.due_date);
            return (
              <div
                key={student.id}
                className="bg-gradient-to-r from-white to-gray-50 shadow-md hover:shadow-xl rounded-2xl p-5 mb-5 border border-gray-100 transition-all duration-300"
              >
                <p className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  {student.name}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="number"
                    value={subData.marks_obtained}
                    onChange={(e) =>
                      handleSubmissionChange(
                        key,
                        "marks_obtained",
                        e.target.value,
                      )
                    }
                    placeholder="Marks"
                    disabled={dueDate < today}
                    className="w-full rounded-xl border border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-4 py-2 transition duration-200"
                  />

                  <input
                    value={subData.suggestion}
                    onChange={(e) =>
                      handleSubmissionChange(key, "suggestion", e.target.value)
                    }
                    placeholder="Suggestion"
                    disabled={dueDate < today}
                    className="w-full rounded-xl border border-gray-300 bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 px-4 py-2 transition duration-200 resize-none"
                  />

                  <select
                    value={subData.status}
                    disabled={dueDate < today}
                    onChange={(e) =>
                      handleSubmissionChange(key, "status", e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 px-4 py-2 transition duration-200"
                  >
                    <option value="pending">Pending</option>
                    <option value="graded">Graded</option>
                    <option value="not_submitted">Not Submitted</option>
                    <option value="late">Late</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          {new Date(assignment.due_date) > today && (
            <button
              onClick={handleSaveAll}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-10 py-4 rounded-2xl font-bold shadow-lg transform transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              💾 Save All Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
