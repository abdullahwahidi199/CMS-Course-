import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

export default function ClassDetails() {
  const { id } = useParams();

  const [classDetails, setClassDetails] = useState(null);
  const [assignments, setAssignments] = useState([]);

  const [marks, setMarks] = useState({});
  const [examType, setExamType] = useState("final");
  const [exam_date,setExamDate]=useState(null)
  const [assignmentsDisplay, setAssignmetsDisplay] = useState(false);
  const [assAddFormDisplay, setAssFormDisplay] = useState(false);
  const [title, setTitle] = useState("");
  const [discription, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const savedTokens = localStorage.getItem("tokens");

  const handleAddAssignment = async (e) => {
    const parsedTokens = JSON.parse(savedTokens);
    e.preventDefault();
    const payload = {
      title,
      discription,
      due_date: dueDate,
      class_assigned: Number(id),
      total_marks: 100,
    };

    const response = await fetch("http://127.0.0.1:8000/assignments/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${parsedTokens.access}`,
      },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      // alert("Assignment added successfully!");
      setTitle("");
      setDescription("");
      setDueDate("");
      fetchAssignments();
      handleAssAddFormDisplay();
    } else {
      
      alert("Failed to add assignment.");
    }
  };

  const fetchClass = async () => {
    try {
      const parsedTokens = JSON.parse(savedTokens);
      const response = await fetch(`http://127.0.0.1:8000/classes/${id}/`, {
        headers: {
          Authorization: `Bearer ${parsedTokens.access}`,
        },
      });
      if (!response.ok) throw new Error("could not get the class");
      const data = await response.json();
      setClassDetails(data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const parsedTokens = JSON.parse(savedTokens);
      setLoading(true);
      const response = await fetch(
        `http://127.0.0.1:8000/assignments/?class_id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${parsedTokens.access}`,
          },
        }
      );
      if (!response.ok) throw new Error("Could not fetch assignments");
      const data = await response.json();
      setAssignments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarks = async () => {
    try {
      const parsedTokens = JSON.parse(savedTokens);
      const response = await fetch(`http://127.0.0.1:8000/marks/?class_id=${id}`, {
        headers: {
          Authorization: `Bearer ${parsedTokens.access}`,
        },
      });
      if (!response.ok) throw new Error("Could not fetch marks");
      const data = await response.json();
      const marksMap = {};
      data.forEach((m) => {
        marksMap[m.student] = {
          id: m.id,
          marks_obtained: m.marks_obtained,
          status: m.status,       
          remarks: m.remarks,    
        };
      });
      setMarks(marksMap);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchClass();
    fetchMarks();
    fetchAssignments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedTokens = JSON.parse(savedTokens);

    for (const s of classDetails.student) {
      const studentMark = marks[s.id];
      const payload = {
        student: s.id,
        exam_type: examType,
        exam_date:exam_date,
        marks_obtained: Number(studentMark?.marks_obtained || 0),
        total_marks: 100,
        status: studentMark?.status || "present",   
        remarks: studentMark?.remarks || "",
        className: classDetails.name,
      };

      if (studentMark?.id) {
        await fetch(`http://127.0.0.1:8000/marks/${studentMark.id}/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${parsedTokens.access}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        const res = await fetch("http://127.0.0.1:8000/marks/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${parsedTokens.access}`,
          },
          body: JSON.stringify(payload),
        });
        const newMark = await res.json();
        setMarks((prev) => ({
          ...prev,
          [s.id]: { id: newMark.id, marks_obtained: newMark.marks_obtained },
        }));
      }
    }

    alert("Marks saved successfully!");
    fetchMarks();
  };

  const handleChange = (studentID, field, value) => {
    setMarks({
      ...marks,
      [studentID]: {
        ...marks[studentID],
        [field]: value
      },
    });
  };


  const handleAssignmentsDisplay = () => {
    setAssignmetsDisplay(!assignmentsDisplay);
  };
  const handleAssAddFormDisplay = () => {
    setAssFormDisplay(!assAddFormDisplay);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto relative">

      <button
        onClick={handleAssignmentsDisplay}
        className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-xl hover:opacity-90 transition"
      >
        📂 Assignments
      </button>

      {classDetails ? (
        <div className="space-y-10">

          <div className="relative bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-3xl shadow-2xl p-10 overflow-hidden">
            <div className="absolute inset-0 bg-black/20 rounded-3xl backdrop-blur-md"></div>
            <div className="relative z-10">
              <h2 className="text-4xl font-extrabold tracking-tight mb-2">
                {classDetails.name}
              </h2>
              <p className="text-lg font-medium opacity-90">
                Room {classDetails.roomOfClass_details && (classDetails.roomOfClass_details.name)} • {classDetails.startDate} →{" "}
                {classDetails.endDate}
              </p>
              <p className="mt-2 text-sm font-light opacity-80">
                {classDetails.start_time} – {classDetails.end_time}
              </p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl shadow-xl rounded-2xl p-8 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              📊 Class Overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { label: "Name", value: classDetails.name },
                { label: "Room", value: classDetails.roomOfClass_details && (classDetails.roomOfClass_details.name) },
                { label: "Start Date", value: classDetails.startDate },
                { label: "End Date", value: classDetails.endDate },
                { label: "Start Time", value: classDetails.start_time },
                { label: "End Time", value: classDetails.end_time },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 shadow-sm hover:shadow-md transition"
                >
                  <span className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                    {item.label}
                  </span>
                  <span className="mt-1 text-lg font-semibold text-gray-900">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl border border-gray-100 p-8"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                Enter / Update Marks
              </h3>
              <input type='date' value={exam_date} onChange={(e)=>setExamDate(e.target.value)}/>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="border border-gray-300 rounded-xl px-4 py-2 bg-white shadow-sm text-gray-700 text-sm focus:ring-2 focus:ring-indigo-400"
              >
                <option value="final">Final</option>
                <option value="midterm">Midterm</option>
                <option value="quiz">Quiz</option>
              </select>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-inner">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 text-gray-700">
                  <tr>
                    <th className="p-3 border">Student</th>
                    <th className="p-3 border">Status</th>
                    <th className="p-3 border">Marks</th>
                    <th className="p-3 border">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {classDetails.student.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="p-3 border">{s.name}</td>
                      <td className="p-3 border">
                        <select
                          value={marks[s.id]?.status || "present"}
                          onChange={(e) => handleChange(s.id, "status", e.target.value)}
                          className="border rounded px-2 py-1"
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="excused">Excused</option>
                        </select>
                      </td>
                      <td className="p-4 border text-center">
                        <input
                          type="number"
                          value={marks[s.id]?.marks_obtained || ""}
                          onChange={(e) => handleChange(s.id, "marks_obtained", e.target.value)}
                          className="w-28 border border-gray-300 rounded-xl px-3 py-2 shadow-sm text-center focus:ring-2 focus:ring-indigo-400"
                          min="0"
                          max="100"
                        />
                      </td>
                      <td className="p-3 border">
                        <input
                          
                          value={marks[s.id]?.remarks || ""}
                          onChange={(e) => handleChange(s.id, "remarks", e.target.value)}
                          className="w-full border rounded-lg px-2 py-1"
                          placeholder="Optional"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition"
              >
                Save Marks
              </button>
            </div>
          </form>
        </div>
      ) : (
        <h2 className="text-center text-red-600 font-semibold text-xl">
          ❌ Error! Could not get the class
        </h2>
      )}


      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 z-50 ${assignmentsDisplay ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">📂 Assignments</h3>
            <button
              onClick={handleAssignmentsDisplay}
              className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 transition"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : assignments.length === 0 ? (
              <p className="text-gray-500">No Assignments yet!</p>
            ) : (
              assignments.map((a) => (
                <div
                  key={a.id}
                  className="p-3 bg-gray-50 rounded-xl shadow-sm  cursor-pointer hover:bg-gray-300"
                >
                  <Link to={`/teacher/dashboard/assignment/${a.id}`} className="flex flex-col">
                    <span className="font-medium text-gray-800">{a.title}</span>
                    <span className="text-sm text-gray-500">
                      Click to view Submissions
                    </span></Link>
                </div>
              ))
            )}
          </div>

          <button
            onClick={handleAssAddFormDisplay}
            className="mt-4 w-full py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition"
          >
            ➕ Add Assignment
          </button>

          {assAddFormDisplay && (
            <form onSubmit={handleAddAssignment} className="mt-4 space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Title"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400"
              />
              <textarea
                placeholder="Description"
                value={discription}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400"
                rows="3"
                required
              />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400"
                required
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleAssAddFormDisplay}
                  className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow hover:opacity-90 transition"
                >
                  Add Assignment
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
