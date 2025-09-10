import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function Assignment() {
  const { id } = useParams();
  const navigate = useNavigate()

  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState(null);
  const [local, setLocal] = useState({});
  const savedTokens = localStorage.getItem("tokens");
  const [editingDisplay, setEditingDisplay] = useState(false)


  const [editData, setEditData] = useState({
    title: "",
    discription: "",
    due_date: "",
    total_marks: ""
  })

  const fetchAssignment = async () => {
    try {
      const parsedTokens = JSON.parse(savedTokens);
      const response = await fetch(`http://127.0.0.1:8000/assignments/${id}/`, {
        headers: {
          Authorization: `Bearer ${parsedTokens.access}`,
        },
      });
      if (!response.ok) throw new Error("Could not get the assignment!");
      const data = await response.json();
      setAssignment(data);
      setSubmissions(data.submissions);
      setEditData({
        title: data.title,
        discription: data.discription,
        due_date: data.due_date,
        total_marks: data.total_marks
      })
    } catch (error) {
      setError(error);
    }
  };

  useEffect(() => {
    fetchAssignment();
  }, []);

  const handleChange = (submissionId, field, value) => {
    setLocal((prev) => ({
      ...prev,
      [submissionId]: { ...prev[submissionId], [field]: value },
    }));
  };

  const handleSaveAll = async () => {
    try {
      const parsedTokens = JSON.parse(savedTokens);
      const payload = Object.keys(local).map((id) => ({
        id: parseInt(id),
        status: local[id].status,
        marks_obtained: local[id].marks_obtained,
        suggestion: local[id].suggestion,
      }));

      const res = await fetch(
        "http://127.0.0.1:8000/submissions/bulk_update/",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${parsedTokens.access}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Failed to save submissions!");
      await res.json();

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
      const parsedTokens = JSON.parse(savedTokens);
      const response = await fetch(`http://127.0.0.1:8000/assignments/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": 'application/json',
          Authorization: `Bearer ${parsedTokens.access}`,
        },
        body: JSON.stringify(editData)

      })
      if (!response.ok) {
        throw new Error("Could not update the assignment!")
      }
      alert("Assignment Edited!")
      setEditingDisplay(false)
      fetchAssignment();


    }
    catch (error) {
      console.log(error)
      setError(error)
    }
  }

  const handleDelete = async () => {
    const parsedTokens = JSON.parse(savedTokens);
    const res = await fetch(`http://127.0.0.1:8000/assignments/${id}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${parsedTokens.access}`,
      }
    })
    if (res.ok) {
      fetchAssignment();
      navigate(-1)

    }
  }
  return (
    <div className="max-w-6xl mx-auto p-8 font-sans">
      {!assignment ? (
        <div className="text-center text-gray-500 text-lg animate-pulse">
          Loading assignment...
        </div>
      ) : (
        <>

          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-2xl rounded-3xl p-8 mb-10">
            <h2 className="text-4xl font-extrabold tracking-tight mb-3">
              {assignment.title}
            </h2>
            <p className="text-lg opacity-90 mb-2">
              Due: <span className="font-semibold">{assignment.due_date}</span>
            </p>
            <p className="opacity-95">{assignment.discription}</p>
            <div className="mt-5">
              <button onClick={() => setEditingDisplay(true)} className="bg-yellow-500 text-white px-3 py-1 rounded mr-2">Edit</button>
              <button
                className="bg-red-600 text-white px-3 py-1 rounded"
                onClick={() => window.confirm("Are u sure u want to delete the assignmet") ? handleDelete() : setEditingDisplay(false)}>Delete</button>
            </div>
          </div>

          {editingDisplay && (
            <div className="fixed inset-0 bg-gray-300 bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white w-full max-w-lg p-8 rounded-3xl shadow-2xl transform transition-all duration-300 scale-95 hover:scale-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">✏️ Edit Assignment</h3>
                <form onSubmit={handleEditSubmit} className="space-y-6">


                  <div className="relative">
                    <label className="absolute -top-3 left-3 bg-white px-2 text-sm text-gray-500">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      className="w-full border rounded-xl py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
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
                      className="w-full border rounded-xl py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      rows="3"
                    ></textarea>
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
                      className="w-full border rounded-xl py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
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
                      className="w-full border rounded-xl py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    />
                  </div>


                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setEditingDisplay(false)}
                      className="px-6 py-3 rounded-xl font-semibold border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md transform transition duration-300 hover:-translate-y-1"
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

            <div className="grid md:grid-cols-2 gap-8">
              {submissions.map((s) => (
                <div
                  key={s.id}
                  className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition duration-300"
                >
                  <h2 className="text-3xl font-semibold text-gray-800 mb-10">
                    {s.student_name}' submission
                  </h2>


                  <div className="relative mb-6">
                    <label className="absolute -top-3 left-2 text-sm text-gray-500 bg-white px-2 transition-all">
                      Status
                    </label>
                    <select
                      className="w-full rounded-xl border border-gray-300 py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      value={local[s.id]?.status ?? s.status ?? ""}
                      onChange={(e) =>
                        handleChange(s.id, "status", e.target.value)
                      }
                    >
                      <option value="pending">Pending</option>
                      <option value="submitted">Submitted</option>
                      <option value="late">Late</option>
                      <option value="not_submitted">Not Submitted</option>
                    </select>
                  </div>


                  <div className="relative mb-6">
                    <label className="absolute -top-3 left-2 text-sm text-gray-500 bg-white px-2 transition-all">
                      Marks Obtained
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-gray-300 py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      value={local[s.id]?.marks_obtained ?? s.marks_obtained ?? ""}
                      onChange={(e) =>
                        handleChange(s.id, "marks_obtained", e.target.value)
                      }
                      disabled={local[s.id]?.status === "not_submitted"}
                      min="0"
                      max={assignment.total_marks}
                    />
                  </div>


                  <div className="relative mb-4">
                    <label className="absolute -top-3 left-2 text-sm text-gray-500 bg-white px-2 transition-all">
                      Suggestion
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-gray-300 py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      value={local[s.id]?.suggestion ?? s.suggestion ?? ""}
                      onChange={(e) =>
                        handleChange(s.id, "suggestion", e.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Save button */}
            <div className="mt-10 text-center">
              <button
                onClick={handleSaveAll}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-10 py-4 rounded-2xl font-bold shadow-lg transform transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                💾 Save All Changes
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
