import { useEffect, useMemo, useState } from "react";
import { Archive, CalendarClock, Pencil, Plus, RefreshCcw, RotateCcw, Save, XCircle } from "lucide-react";
import DataTable from "../shared/DataTable";
import PageHeader from "../shared/PageHeader";
import instance from "../../api/axiosInstance";

const emptyBatch = {
  name: "",
  course: "",
  subjects: "",
  teachers: [],
  roomOfClass: "",
  startDate: "",
  endDate: "",
  start_time: "",
  end_time: "",
  capacity: 0,
  is_active: true,
};

function inputClass() {
  return "w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-cyan-600";
}

function normalizeList(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

function teacherName(teacher) {
  return teacher.full_name || teacher.name || teacher.username || `Teacher ${teacher.id}`;
}

function BatchModal({ batch, courses, teachers, rooms, onClose, onSaved }) {
  const [form, setForm] = useState({
    ...emptyBatch,
    ...(batch || {}),
    course: batch?.course || "",
    teachers: batch?.teachers || batch?.teachers_details?.map((teacher) => teacher.id) || [],
    roomOfClass: batch?.roomOfClass || "",
    capacity: batch?.capacity || 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      name: form.name,
      course: form.course || null,
      subjects: form.subjects || "",
      teachers: form.teachers.map((id) => Number(id)),
      roomOfClass: form.roomOfClass ? Number(form.roomOfClass) : null,
      startDate: form.startDate,
      endDate: form.endDate,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      capacity: Number(form.capacity || 0),
      is_active: form.is_active !== false,
    };
    try {
      if (batch?.id) {
        await instance.patch(`/classes/${batch.id}/`, payload);
      } else {
        await instance.post("/classes/", payload);
      }
      await onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "Could not save batch.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
      <form onSubmit={submit} className="w-full max-w-3xl rounded-md bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{batch?.id ? "Edit Batch" : "Create Batch"}</h2>
          <button type="button" onClick={onClose} className="text-gray-500">
            <XCircle size={20} />
          </button>
        </div>
        {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Batch Name</span>
            <input required className={inputClass()} value={form.name || ""} onChange={(event) => setValue("name", event.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Course</span>
            <select className={inputClass()} value={form.course || ""} onChange={(event) => setValue("course", event.target.value)}>
              <option value="">Select course</option>
              {courses.filter((course) => course.is_active !== false).map((course) => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Subjects</span>
            <input className={inputClass()} value={form.subjects || ""} onChange={(event) => setValue("subjects", event.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Room</span>
            <select className={inputClass()} value={form.roomOfClass || ""} onChange={(event) => setValue("roomOfClass", event.target.value)}>
              <option value="">No room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Start Date</span>
            <input required type="date" className={inputClass()} value={form.startDate || ""} onChange={(event) => setValue("startDate", event.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">End Date</span>
            <input required type="date" className={inputClass()} value={form.endDate || ""} onChange={(event) => setValue("endDate", event.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Start Time</span>
            <input type="time" className={inputClass()} value={form.start_time || ""} onChange={(event) => setValue("start_time", event.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">End Time</span>
            <input type="time" className={inputClass()} value={form.end_time || ""} onChange={(event) => setValue("end_time", event.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Capacity</span>
            <input type="number" min="0" className={inputClass()} value={form.capacity || 0} onChange={(event) => setValue("capacity", event.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Teachers</span>
            <select
              multiple
              className={`${inputClass()} min-h-28`}
              value={form.teachers.map(String)}
              onChange={(event) => setValue("teachers", Array.from(event.target.selectedOptions).map((option) => option.value))}
            >
              {teachers.filter((teacher) => teacher.is_active !== false).map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacherName(teacher)}</option>
              ))}
            </select>
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.is_active !== false} onChange={(event) => setValue("is_active", event.target.checked)} />
            Active
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">Cancel</button>
          <button disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            <Save size={16} /> {saving ? "Saving..." : "Save Batch"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function BatchManagementPage() {
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filters, setFilters] = useState({ course: "", teacher: "", status: "all" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [batchRes, courseRes, teacherRes, roomRes] = await Promise.all([
        instance.get("/classes/"),
        instance.get("/courses/"),
        instance.get("/teachers/"),
        instance.get("/rooms/"),
      ]);
      setBatches(normalizeList(batchRes.data));
      setCourses(normalizeList(courseRes.data));
      setTeachers(normalizeList(teacherRes.data));
      setRooms(normalizeList(roomRes.data));
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not load batches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const lifecycle = async (batch, action) => {
    setMessage("");
    await instance.post(`/classes/${batch.id}/${action}/`);
    setMessage(`Batch ${action} complete.`);
    await fetchData();
  };

  const filteredBatches = useMemo(
    () =>
      batches.filter((batch) => {
        const teacherIds = (batch.teachers || batch.teachers_details?.map((teacher) => teacher.id) || []).map(String);
        const matchesCourse = !filters.course || String(batch.course || "") === filters.course;
        const matchesTeacher = !filters.teacher || teacherIds.includes(filters.teacher);
        const matchesStatus =
          filters.status === "all" ||
          (filters.status === "active" && batch.is_active !== false && !batch.is_archived) ||
          (filters.status === "inactive" && batch.is_active === false && !batch.is_archived) ||
          (filters.status === "archived" && batch.is_archived);
        return matchesCourse && matchesTeacher && matchesStatus;
      }),
    [batches, filters],
  );

  const columns = useMemo(
    () => [
      { key: "name", label: "Batch Name" },
      { key: "course_name", label: "Course", render: (row) => row.course_name || "-" },
      { key: "teachers", label: "Teachers", render: (row) => row.teachers_details?.map(teacherName).join(", ") || "-" },
      { key: "room", label: "Room", render: (row) => row.roomOfClass_details?.name || "-" },
      { key: "schedule", label: "Schedule", render: (row) => [row.start_time, row.end_time].filter(Boolean).join(" - ") || "-" },
      { key: "capacity", label: "Capacity", render: (row) => row.capacity || 0 },
      { key: "student_count", label: "Active Students", render: (row) => row.student_count || 0 },
      { key: "status", label: "Status", render: (row) => (row.is_archived ? "Archived" : row.is_active ? "Active" : "Inactive") },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batches"
        description="Manage scheduled class batches, teachers, rooms, dates, capacity, and active status."
        actions={
          <>
            <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white">
              <Plus size={16} /> Create Batch
            </button>
            <button onClick={fetchData} className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700">
              <RefreshCcw size={16} /> Refresh
            </button>
          </>
        }
      />

      <div className="grid gap-3 rounded-md bg-white p-4 shadow-sm md:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">Course</span>
          <select className={inputClass()} value={filters.course} onChange={(event) => setFilters({ ...filters, course: event.target.value })}>
            <option value="">All courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">Teacher</span>
          <select className={inputClass()} value={filters.teacher} onChange={(event) => setFilters({ ...filters, teacher: event.target.value })}>
            <option value="">All teachers</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>{teacherName(teacher)}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">Status</span>
          <select className={inputClass()} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}

      <DataTable
        title="All Batches"
        rows={filteredBatches}
        columns={columns}
        loading={loading}
        error={error}
        pageSize={15}
        actions={(row) => [
          { label: "Edit", onClick: () => setEditing(row), icon: Pencil },
          { label: row.is_active ? "Deactivate" : "Activate", onClick: () => lifecycle(row, row.is_active ? "deactivate" : "activate"), icon: CalendarClock },
          { label: "Archive", onClick: () => lifecycle(row, "archive"), icon: Archive },
          { label: "Restore", onClick: () => lifecycle(row, "restore"), icon: RotateCcw },
        ]}
      />

      {showCreate ? <BatchModal courses={courses} teachers={teachers} rooms={rooms} onClose={() => setShowCreate(false)} onSaved={fetchData} /> : null}
      {editing ? <BatchModal batch={editing} courses={courses} teachers={teachers} rooms={rooms} onClose={() => setEditing(null)} onSaved={fetchData} /> : null}
    </div>
  );
}
