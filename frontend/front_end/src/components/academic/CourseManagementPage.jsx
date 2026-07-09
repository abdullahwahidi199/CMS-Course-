import { useEffect, useMemo, useState } from "react";
import { Archive, BookOpen, Eye, Pencil, Plus, RefreshCcw, RotateCcw, Save, XCircle } from "lucide-react";
import DataTable from "../shared/DataTable";
import PageHeader from "../shared/PageHeader";
import instance from "../../api/axiosInstance";

const emptyCourse = {
  name: "",
  code: "",
  description: "",
  duration_weeks: 0,
  fee: "0.00",
  is_active: true,
};

function inputClass() {
  return "w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-cyan-600";
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function CourseModal({ course, onClose, onSaved }) {
  const [form, setForm] = useState(course || emptyCourse);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        duration_weeks: Number(form.duration_weeks || 0),
        fee: String(form.fee || "0.00"),
      };
      if (course?.id) {
        await instance.patch(`/courses/${course.id}/`, payload);
      } else {
        await instance.post("/courses/", payload);
      }
      await onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "Could not save course.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
      <form onSubmit={submit} className="w-full max-w-2xl rounded-md bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{course?.id ? "Edit Course" : "Create Course"}</h2>
          <button type="button" onClick={onClose} className="text-gray-500">
            <XCircle size={20} />
          </button>
        </div>
        {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Course Name</span>
            <input required className={inputClass()} value={form.name || ""} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Code</span>
            <input className={inputClass()} value={form.code || ""} onChange={(event) => setForm({ ...form, code: event.target.value })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Duration Weeks</span>
            <input type="number" min="0" className={inputClass()} value={form.duration_weeks || 0} onChange={(event) => setForm({ ...form, duration_weeks: event.target.value })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Default Fee</span>
            <input type="number" min="0" step="0.01" className={inputClass()} value={form.fee || ""} onChange={(event) => setForm({ ...form, fee: event.target.value })} />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block font-medium text-gray-700">Description</span>
            <textarea rows={3} className={inputClass()} value={form.description || ""} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.is_active !== false} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
            Active
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">Cancel</button>
          <button disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            <Save size={16} /> {saving ? "Saving..." : "Save Course"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CourseManagementPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await instance.get("/courses/");
      setCourses(Array.isArray(response.data) ? response.data : response.data?.results || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not load courses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const lifecycle = async (course, action) => {
    setMessage("");
    if (action === "activate" || action === "deactivate") {
      await instance.patch(`/courses/${course.id}/`, { is_active: action === "activate" });
    } else {
      await instance.post(`/courses/${course.id}/${action}/`);
    }
    setMessage(`Course ${action} complete.`);
    await fetchCourses();
  };

  const columns = useMemo(
    () => [
      { key: "name", label: "Course" },
      { key: "code", label: "Code", render: (row) => row.code || "-" },
      { key: "duration_weeks", label: "Duration", render: (row) => `${row.duration_weeks || 0} weeks` },
      { key: "batch_count", label: "Batches", render: (row) => row.batch_count ?? row.batches?.length ?? 0 },
      { key: "active_student_count", label: "Active Students", render: (row) => row.active_student_count ?? 0 },
      { key: "total_revenue", label: "Revenue", render: (row) => money(row.total_revenue) },
      { key: "status", label: "Status", render: (row) => (row.is_archived ? "Archived" : row.is_active ? "Active" : "Inactive") },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="Manage academic programs and course templates. Batches are scheduled under each course."
        actions={
          <>
            <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white">
              <Plus size={16} /> Create Course
            </button>
            <button onClick={fetchCourses} className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700">
              <RefreshCcw size={16} /> Refresh
            </button>
          </>
        }
      />

      {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}

      <DataTable
        title="All Courses"
        rows={courses}
        columns={columns}
        loading={loading}
        error={error}
        pageSize={15}
        actions={(row) => [
          { label: "View Batches", onClick: () => setSelected(row), icon: Eye },
          { label: "Edit", onClick: () => setEditing(row), icon: Pencil },
          { label: row.is_active ? "Deactivate" : "Activate", onClick: () => lifecycle(row, row.is_active ? "deactivate" : "activate") },
          { label: "Archive", onClick: () => lifecycle(row, "archive"), icon: Archive },
          { label: "Restore", onClick: () => lifecycle(row, "restore"), icon: RotateCcw },
        ]}
      />

      {selected ? (
        <section className="rounded-md bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              <BookOpen size={16} className="mr-2 inline" />
              {selected.name} Batches
            </h2>
            <button onClick={() => setSelected(null)} className="text-sm font-medium text-gray-600">Close</button>
          </div>
          <DataTable
            title="Course Batches"
            rows={selected.batches || []}
            columns={[
              { key: "name", label: "Batch" },
              { key: "startDate", label: "Start Date" },
              { key: "endDate", label: "End Date" },
              { key: "schedule", label: "Schedule", render: (row) => [row.start_time, row.end_time].filter(Boolean).join(" - ") || "-" },
              { key: "capacity", label: "Capacity", render: (row) => row.capacity || 0 },
              { key: "status", label: "Status", render: (row) => (row.is_archived ? "Archived" : row.is_active ? "Active" : "Inactive") },
            ]}
            pageSize={8}
          />
        </section>
      ) : null}

      {showCreate ? <CourseModal onClose={() => setShowCreate(false)} onSaved={fetchCourses} /> : null}
      {editing ? <CourseModal course={editing} onClose={() => setEditing(null)} onSaved={fetchCourses} /> : null}
    </div>
  );
}
