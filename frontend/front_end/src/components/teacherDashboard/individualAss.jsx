import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Download, Save, Trash2 } from "lucide-react";
import instance from "../../api/axiosInstance";
import { formatApiError } from "../../utils/apiErrors";
import { mediaUrl } from "../../utils/mediaUrl";
import TeacherPageShell from "./pages/TeacherPageShell";
import { ConfirmDialog, EmptyState, ErrorState, LoadingSkeleton, Panel, Toast } from "./pages/TeacherUi";
import { buttonClass, formatDate, inputClass, statusBadge } from "./pages/teacherUtils.jsx";

export default function Assignment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [students, setStudents] = useState([]);
  const [local, setLocal] = useState({});
  const [editData, setEditData] = useState({ title: "", discription: "", due_date: "", total_marks: "", attachment: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const assignmentRes = await instance.get(`/assignments/${id}/`);
      const item = assignmentRes.data;
      const classRes = await instance.get(`/students/by-class/${item.class_assigned}/`);
      const roster = Array.isArray(classRes.data) ? classRes.data : classRes.data?.results || [];
      const initial = {};
      (item.submissions || []).forEach((submission) => {
        initial[submission.id] = {
          marks_obtained: submission.marks_obtained ?? "",
          suggestion: submission.suggestion || "",
          status: submission.status || "pending",
        };
      });
      setAssignment(item);
      setStudents(roster);
      setLocal(initial);
      setEditData({
        title: item.title || "",
        discription: item.discription || "",
        due_date: item.due_date || "",
        total_marks: item.total_marks || "",
        attachment: null,
      });
    } catch (err) {
      setError(formatApiError(err, "Could not load assignment."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const submissionFor = (studentId) => (assignment?.submissions || []).find((submission) => submission.student === studentId);

  const updateLocal = (key, field, value) => {
    setLocal((current) => ({ ...current, [key]: { ...current[key], [field]: value } }));
  };

  const saveSubmissions = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = students.map((student) => {
        const existing = submissionFor(student.id);
        const key = existing?.id || student.id;
        const entry = local[key] || {};
        return {
          id: existing?.id || null,
          student: existing ? null : student.id,
          assignment: assignment.id,
          marks_obtained: entry.marks_obtained === "" ? null : entry.marks_obtained,
          suggestion: entry.suggestion || "",
          status: entry.status || existing?.status || "pending",
        };
      });
      await instance.patch("/submissions/bulk_update/", payload);
      setToast({ message: "Submission grades and feedback saved." });
      await load();
    } catch (err) {
      setError(formatApiError(err, "Could not save submissions."));
    } finally {
      setSaving(false);
    }
  };

  const saveAssignment = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = new FormData();
      Object.entries(editData).forEach(([key, value]) => {
        if (value !== null && value !== "") payload.append(key, value);
      });
      await instance.patch(`/assignments/${id}/`, payload);
      setToast({ message: "Assignment updated." });
      await load();
    } catch (err) {
      setError(formatApiError(err, "Could not update assignment."));
    } finally {
      setSaving(false);
    }
  };

  const deleteAssignment = async () => {
    setSaving(true);
    try {
      await instance.delete(`/assignments/${id}/`);
      navigate("/teacher/dashboard/assignments");
    } catch (err) {
      setError(formatApiError(err, "Could not delete assignment."));
    } finally {
      setSaving(false);
      setConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <TeacherPageShell title="Assignment" description="Loading assignment workspace...">
        <LoadingSkeleton rows={5} />
      </TeacherPageShell>
    );
  }

  return (
    <TeacherPageShell
      title={assignment?.title || "Assignment"}
      description={`Due ${formatDate(assignment?.due_date)} / ${assignment?.total_marks || 0} marks`}
      actions={<Link className={buttonClass("secondary")} to="/teacher/dashboard/assignments">Back to Assignments</Link>}
    >
      <ErrorState message={error} />
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel title="Assignment Details" description="Update instructions, due date, marks, and attachment.">
          <form onSubmit={saveAssignment} className="grid gap-3">
            <input required className={inputClass()} value={editData.title} onChange={(event) => setEditData({ ...editData, title: event.target.value })} />
            <textarea required className={inputClass()} rows={5} value={editData.discription} onChange={(event) => setEditData({ ...editData, discription: event.target.value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input required type="date" className={inputClass()} value={editData.due_date} onChange={(event) => setEditData({ ...editData, due_date: event.target.value })} />
              <input required type="number" min="1" className={inputClass()} value={editData.total_marks} onChange={(event) => setEditData({ ...editData, total_marks: event.target.value })} />
            </div>
            {assignment?.attachment ? (
              <a className={buttonClass("secondary")} href={mediaUrl(assignment.attachment)} target="_blank" rel="noreferrer"><Download size={16} /> Download Current Attachment</a>
            ) : null}
            <input type="file" className={inputClass()} onChange={(event) => setEditData({ ...editData, attachment: event.target.files?.[0] || null })} />
            <div className="flex flex-wrap gap-2">
              <button className={buttonClass()} disabled={saving}><Save size={16} /> Save Assignment</button>
              <button type="button" className={buttonClass("danger")} onClick={() => setConfirmDelete(true)} disabled={saving}><Trash2 size={16} /> Delete</button>
            </div>
          </form>
        </Panel>

        <Panel title="Student Submissions" description="Grade submissions, leave comments, and download uploaded files.">
          {students.length ? (
            <div className="space-y-3">
              {students.map((student) => {
                const existing = submissionFor(student.id);
                const key = existing?.id || student.id;
                const entry = local[key] || {};
                return (
                  <article key={student.id} className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-white">{student.name}</p>
                        <p className="text-sm text-slate-500">{student.role_number || student.student_number_display || student.id}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {statusBadge(entry.status || existing?.status || "pending")}
                        {existing?.submitted_file ? (
                          <a className={buttonClass("secondary")} href={mediaUrl(existing.submitted_file)} target="_blank" rel="noreferrer"><Download size={16} /> Submission</a>
                        ) : null}
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[130px_180px_1fr]">
                      <input type="number" min="0" max={assignment.total_marks} className={inputClass()} placeholder="Marks" value={entry.marks_obtained ?? ""} onChange={(event) => updateLocal(key, "marks_obtained", event.target.value)} />
                      <select className={inputClass()} value={entry.status || existing?.status || "pending"} onChange={(event) => updateLocal(key, "status", event.target.value)}>
                        <option value="pending">Pending</option>
                        <option value="submitted">Submitted</option>
                        <option value="late">Late</option>
                        <option value="not_submitted">Not Submitted</option>
                      </select>
                      <input className={inputClass()} placeholder="Feedback / comment" value={entry.suggestion || ""} onChange={(event) => updateLocal(key, "suggestion", event.target.value)} />
                    </div>
                  </article>
                );
              })}
              <button type="button" className={buttonClass()} onClick={saveSubmissions} disabled={saving}><Save size={16} /> Save All Feedback</button>
            </div>
          ) : (
            <EmptyState title="No students found" description="No submissions were generated for this class." />
          )}
        </Panel>
      </div>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete assignment?"
        message="This removes the assignment and its generated submission rows. This action cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={deleteAssignment}
      />
    </TeacherPageShell>
  );
}
