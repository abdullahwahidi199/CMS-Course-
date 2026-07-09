import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ClipboardPlus, Save } from "lucide-react";
import instance from "../../api/axiosInstance";
import DataTable from "../shared/DataTable";
import StatCard from "../shared/StatCard";
import TeacherPageShell from "./pages/TeacherPageShell";
import { inputClass, statusBadge } from "./pages/teacherUtils.jsx";
import { formatApiError } from "../../utils/apiErrors";

const today = () => new Date().toISOString().slice(0, 10);

export default function ClassDetails() {
  const { id } = useParams();
  const [classDetails, setClassDetails] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [marks, setMarks] = useState({});
  const [examType, setExamType] = useState("quiz");
  const [examDate, setExamDate] = useState(today());
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    discription: "",
    due_date: today(),
    total_marks: 100,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [classRes, assignmentRes, marksRes] = await Promise.all([
        instance.get(`/classes/${id}/`),
        instance.get("/assignments/", { params: { class_id: id } }),
        instance.get("/marks/", { params: { class_id: id } }),
      ]);
      setClassDetails(classRes.data);
      setAssignments(Array.isArray(assignmentRes.data) ? assignmentRes.data : assignmentRes.data?.results || []);
      const nextMarks = {};
      (Array.isArray(marksRes.data) ? marksRes.data : marksRes.data?.results || []).forEach((mark) => {
        nextMarks[mark.student] = {
          id: mark.id,
          marks_obtained: mark.marks_obtained,
          status: mark.status,
          remarks: mark.remarks || "",
        };
      });
      setMarks(nextMarks);
    } catch (err) {
      setError(formatApiError(err, "Could not load class details."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const students = classDetails?.student || [];
  const stats = useMemo(() => {
    const graded = students.filter((student) => marks[student.id]?.marks_obtained !== undefined && marks[student.id]?.marks_obtained !== "").length;
    const average = graded ? students.reduce((total, student) => total + Number(marks[student.id]?.marks_obtained || 0), 0) / graded : 0;
    return { students: students.length, assignments: assignments.length, graded, average };
  }, [assignments.length, marks, students]);

  const updateMark = (studentId, field, value) => {
    setMarks((current) => ({ ...current, [studentId]: { ...current[studentId], [field]: value } }));
  };

  const saveMarks = async (event) => {
    event.preventDefault();
    if (!classDetails) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      for (const student of students) {
        const mark = marks[student.id];
        if (!mark?.marks_obtained && !mark?.id) continue;
        const payload = {
          student: student.id,
          exam_type: examType,
          exam_date: examDate,
          marks_obtained: Number(mark?.marks_obtained || 0),
          total_marks: 100,
          status: mark?.status || "present",
          remarks: mark?.remarks || "",
          className: classDetails.name,
        };
        if (mark?.id) await instance.patch(`/marks/${mark.id}/`, payload);
        else await instance.post("/marks/", payload);
      }
      setMessage("Marks saved.");
      await fetchData();
    } catch (err) {
      setError(formatApiError(err, "Could not save marks."));
    } finally {
      setSaving(false);
    }
  };

  const createAssignment = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await instance.post("/assignments/", {
        ...assignmentForm,
        class_assigned: Number(id),
        total_marks: Number(assignmentForm.total_marks || 100),
      });
      setAssignmentForm({ title: "", discription: "", due_date: today(), total_marks: 100 });
      setMessage("Assignment created.");
      await fetchData();
    } catch (err) {
      setError(formatApiError(err, "Could not create assignment."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <TeacherPageShell title="Class Details" description="Loading class workspace...">
        <div className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">Loading...</div>
      </TeacherPageShell>
    );
  }

  return (
    <TeacherPageShell
      title={classDetails?.name || "Class Details"}
      description={`${classDetails?.course_name || "Course"} / ${classDetails?.start_time || "-"} - ${classDetails?.end_time || "-"}`}
    >
      {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Students" value={stats.students} accent="border-cyan-600" />
        <StatCard title="Assignments" value={stats.assignments} accent="border-violet-500" />
        <StatCard title="Marked Students" value={stats.graded} accent="border-emerald-500" />
        <StatCard title="Average Marks" value={stats.average.toFixed(1)} accent="border-amber-500" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <form onSubmit={saveMarks} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="font-semibold text-slate-950">Marks Entry</h3>
              <p className="text-sm text-slate-500">Enter or update marks for this class.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input type="date" className={inputClass()} value={examDate} onChange={(event) => setExamDate(event.target.value)} />
              <select className={inputClass()} value={examType} onChange={(event) => setExamType(event.target.value)}>
                <option value="quiz">Quiz</option>
                <option value="midterm">Midterm</option>
                <option value="final">Final</option>
              </select>
            </div>
          </div>
          <div className="max-h-[32rem] overflow-auto rounded-xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Student</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Marks</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-3 py-2 font-medium text-slate-800">{student.name}</td>
                    <td className="px-3 py-2">
                      <select className={inputClass()} value={marks[student.id]?.status || "present"} onChange={(event) => updateMark(student.id, "status", event.target.value)}>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="excused">Excused</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min="0" max="100" className={inputClass()} value={marks[student.id]?.marks_obtained || ""} onChange={(event) => updateMark(student.id, "marks_obtained", event.target.value)} />
                    </td>
                    <td className="px-3 py-2">
                      <input className={inputClass()} value={marks[student.id]?.remarks || ""} onChange={(event) => updateMark(student.id, "remarks", event.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            <Save size={16} /> Save Marks
          </button>
        </form>

        <section className="space-y-5">
          <form onSubmit={createAssignment} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 font-semibold text-slate-950">Create Assignment</h3>
            <div className="space-y-3">
              <input required className={inputClass()} placeholder="Title" value={assignmentForm.title} onChange={(event) => setAssignmentForm({ ...assignmentForm, title: event.target.value })} />
              <textarea required className={inputClass()} rows={3} placeholder="Description" value={assignmentForm.discription} onChange={(event) => setAssignmentForm({ ...assignmentForm, discription: event.target.value })} />
              <div className="grid gap-2 sm:grid-cols-2">
                <input required type="date" className={inputClass()} value={assignmentForm.due_date} onChange={(event) => setAssignmentForm({ ...assignmentForm, due_date: event.target.value })} />
                <input required type="number" min="1" className={inputClass()} value={assignmentForm.total_marks} onChange={(event) => setAssignmentForm({ ...assignmentForm, total_marks: event.target.value })} />
              </div>
              <button disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                <ClipboardPlus size={16} /> Create
              </button>
            </div>
          </form>

          <DataTable
            title="Assignments"
            rows={assignments}
            pageSize={5}
            columns={[
              { key: "title", label: "Title" },
              { key: "due_date", label: "Due" },
              { key: "total_marks", label: "Marks" },
              { key: "status", label: "Status", accessor: (row) => (new Date(row.due_date) < new Date() ? "closed" : "active"), render: (row) => statusBadge(new Date(row.due_date) < new Date() ? "closed" : "active") },
            ]}
            actions={(row) => [{ label: "Open", onClick: () => { window.location.href = `/teacher/dashboard/assignment/${row.id}`; } }]}
          />
        </section>
      </div>

      <DataTable
        title="Student Roster"
        rows={students}
        pageSize={10}
        columns={[
          { key: "name", label: "Student" },
          { key: "role_number", label: "Roll No" },
          { key: "parent_mobile_number", label: "Parent Mobile" },
          { key: "address", label: "Address" },
        ]}
      />
    </TeacherPageShell>
  );
}
