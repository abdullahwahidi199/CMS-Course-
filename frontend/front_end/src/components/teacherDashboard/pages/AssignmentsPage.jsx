import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, FileText, Plus, Send, Users } from "lucide-react";
import instance from "../../../api/axiosInstance";
import { formatApiError } from "../../../utils/apiErrors";
import { formatBatchLabel } from "../../../utils/batchLabel";
import { mediaUrl } from "../../../utils/mediaUrl";
import TeacherPageShell from "./TeacherPageShell";
import { EmptyState, ErrorState, LoadingSkeleton, Panel, SearchBox, StatTile, Toast } from "./TeacherUi";
import { buttonClass, formatDate, inputClass, normalizeList, statusBadge, todayValue } from "./teacherUtils.jsx";

export default function TeacherAssignmentsPage() {
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [filters, setFilters] = useState({ search: "", classId: "", status: "" });
  const [form, setForm] = useState({ title: "", discription: "", due_date: todayValue(), total_marks: 100, class_assigned: "", attachment: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [classRes, assignmentRes] = await Promise.all([
        instance.get("/classes/", { params: { summary: 1, active_only: 1 } }),
        instance.get("/assignments/"),
      ]);
      const classRows = normalizeList(classRes.data);
      setClasses(classRows);
      setAssignments(normalizeList(assignmentRes.data));
      setForm((current) => ({ ...current, class_assigned: current.class_assigned || String(classRows[0]?.id || "") }));
    } catch (err) {
      setError(formatApiError(err, "Could not load assignments."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return assignments.filter((item) => {
      const classInfo = classes.find((row) => row.id === item.class_assigned);
      const className = formatBatchLabel(classInfo, "");
      const closed = new Date(item.due_date) < new Date();
      const matchesSearch = !term || [item.title, item.discription, className].join(" ").toLowerCase().includes(term);
      const matchesClass = !filters.classId || String(item.class_assigned) === String(filters.classId);
      const matchesStatus = !filters.status || (filters.status === "closed" ? closed : !closed);
      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [assignments, classes, filters]);

  const createAssignment = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== "") payload.append(key, value);
      });
      await instance.post("/assignments/", payload);
      setToast({ message: "Assignment created and submissions prepared." });
      setForm({ title: "", discription: "", due_date: todayValue(), total_marks: 100, class_assigned: form.class_assigned, attachment: null });
      await load();
    } catch (err) {
      setError(formatApiError(err, "Could not create assignment."));
    } finally {
      setSaving(false);
    }
  };

  const pendingGrades = assignments.reduce((sum, item) => sum + (item.submissions || []).filter((submission) => submission.status !== "pending" && submission.marks_obtained == null).length, 0);

  return (
    <TeacherPageShell title="Assignment Management" description="Create coursework, attach files, receive submissions, grade work, and leave feedback.">
      <ErrorState message={error} />
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile icon={FileText} label="Assignments" value={assignments.length} helper="Created for your classes" />
            <StatTile icon={Users} label="Submissions" value={assignments.reduce((sum, item) => sum + (item.submissions?.length || 0), 0)} helper="Student rows generated" tone="emerald" />
            <StatTile icon={Send} label="Pending Grades" value={pendingGrades} helper="Need teacher review" tone="amber" />
            <StatTile icon={Plus} label="Classes" value={classes.length} helper="Available targets" tone="violet" />
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
            <Panel title="Create Assignment" description="Attach an optional file for students.">
              <form onSubmit={createAssignment} className="grid gap-3">
                <input required className={inputClass()} placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
                <textarea required className={inputClass()} rows={4} placeholder="Instructions / description" value={form.discription} onChange={(event) => setForm({ ...form, discription: event.target.value })} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select required className={inputClass()} value={form.class_assigned} onChange={(event) => setForm({ ...form, class_assigned: event.target.value })}>
                    {classes.map((item) => <option key={item.id} value={item.id}>{formatBatchLabel(item)}</option>)}
                  </select>
                  <input required type="date" className={inputClass()} value={form.due_date} onChange={(event) => setForm({ ...form, due_date: event.target.value })} />
                  <input required type="number" min="1" className={inputClass()} value={form.total_marks} onChange={(event) => setForm({ ...form, total_marks: event.target.value })} />
                  <input type="file" className={inputClass()} onChange={(event) => setForm({ ...form, attachment: event.target.files?.[0] || null })} />
                </div>
                <button className={buttonClass()} disabled={saving}><Plus size={16} /> Create Assignment</button>
              </form>
            </Panel>

            <Panel title="Assignments" description="Search and open submissions.">
              <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_160px]">
                <SearchBox value={filters.search} onChange={(search) => setFilters({ ...filters, search })} placeholder="Search assignments" />
                <select className={inputClass()} value={filters.classId} onChange={(event) => setFilters({ ...filters, classId: event.target.value })}>
                  <option value="">All classes</option>
                  {classes.map((item) => <option key={item.id} value={item.id}>{formatBatchLabel(item)}</option>)}
                </select>
                <select className={inputClass()} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
                  <option value="">All statuses</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              {visible.length ? (
                <div className="space-y-3">
                  {visible.map((item) => {
                    const classInfo = classes.find((row) => row.id === item.class_assigned);
                    const closed = new Date(item.due_date) < new Date();
                    return (
                      <article key={item.id} className="rounded-md border border-slate-200 p-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-slate-950">{item.title}</p>
                            <p className="text-sm text-slate-500">{formatBatchLabel(classInfo, `Class ${item.class_assigned}`)} / Due {formatDate(item.due_date)} / {item.total_marks} marks</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {statusBadge(closed ? "closed" : "active")}
                            {item.attachment ? (
                              <a className={buttonClass("secondary")} href={mediaUrl(item.attachment)} target="_blank" rel="noreferrer"><Download size={16} /> File</a>
                            ) : null}
                            <Link className={buttonClass()} to={`/teacher/dashboard/assignment/${item.id}`}>Open</Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title="No assignments found" description="Create an assignment or adjust filters." />
              )}
            </Panel>
          </div>
        </>
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </TeacherPageShell>
  );
}
