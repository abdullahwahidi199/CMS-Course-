import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Lock, Printer, RefreshCcw, Save, Search, ShieldCheck } from "lucide-react";
import DataTable from "./shared/DataTable";
import PageHeader from "./shared/PageHeader";
import StatCard from "./shared/StatCard";
import CalendarDatePicker from "./shared/CalendarDatePicker";
import instance from "../api/axiosInstance";

const today = () => new Date().toISOString().slice(0, 10);
const statuses = [
  ["present", "Present"],
  ["absent", "Absent"],
  ["late", "Late"],
  ["excused", "Excused"],
  ["sick_leave", "Sick Leave"],
  ["holiday", "Holiday"],
];

function inputClass() {
  return "w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-cyan-600";
}

function normalize(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

function statusLabel(value) {
  return statuses.find(([key]) => key === value)?.[1] || value || "-";
}

export default function Attendance() {
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [dashboard, setDashboard] = useState({});
  const [session, setSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ course: "", batch: "", teacher: "", date: today(), session_topic: "" });
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [courseRes, batchRes, teacherRes, sessionRes, dashboardRes] = await Promise.all([
        instance.get("/courses/"),
        instance.get("/classes/"),
        instance.get("/teachers/"),
        instance.get("/attendance-sessions/"),
        instance.get("/attendance-sessions/dashboard/"),
      ]);
      setCourses(normalize(courseRes.data));
      setBatches(normalize(batchRes.data));
      setTeachers(normalize(teacherRes.data));
      setSessions(normalize(sessionRes.data));
      setDashboard(dashboardRes.data || {});
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not load attendance data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredBatches = useMemo(
    () => batches.filter((batch) => batch.is_active !== false && !batch.is_archived && (!filters.course || String(batch.course) === String(filters.course))),
    [batches, filters.course],
  );

  const visibleRecords = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term
      ? records.filter((row) => `${row.student_number} ${row.student_name} ${row.guardian_name}`.toLowerCase().includes(term))
      : records;
  }, [query, records]);

  const openSession = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await instance.post("/attendance-sessions/open/", {
        batch: filters.batch,
        teacher: filters.teacher || null,
        date: filters.date,
        session_topic: filters.session_topic,
      });
      setSession(response.data);
      setRecords(response.data.records || []);
      setMessage("Attendance session opened.");
      await fetchData();
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "Could not open attendance session.");
    } finally {
      setSaving(false);
    }
  };

  const updateRecord = (id, patch) => {
    setRecords((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const bulkMark = (status) => {
    setRecords((current) => current.map((row) => ({ ...row, status })));
  };

  const saveAttendance = async () => {
    if (!session?.id) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await instance.post(`/attendance-sessions/${session.id}/mark/`, {
        records: records.map((row) => ({
          id: row.id,
          status: row.status,
          check_in_time: row.check_in_time || null,
          check_out_time: row.check_out_time || null,
          remarks: row.remarks || "",
          reason_for_absence: row.reason_for_absence || "",
        })),
      });
      setSession(response.data);
      setRecords(response.data.records || []);
      setMessage("Attendance saved.");
      await fetchData();
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "Could not save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const sessionAction = async (action) => {
    if (!session?.id) return;
    setSaving(true);
    try {
      const response = await instance.post(`/attendance-sessions/${session.id}/${action}/`);
      setSession(response.data);
      setRecords(response.data.records || []);
      setMessage(`Attendance ${action} complete.`);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || `Could not ${action} attendance.`);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "student_number", label: "Student Number" },
    { key: "student_name", label: "Student Name" },
    { key: "guardian_name", label: "Guardian" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <select className={inputClass()} value={row.status || "absent"} onChange={(event) => updateRecord(row.id, { status: event.target.value })}>
          {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      ),
    },
    {
      key: "check_in_time",
      label: "Check-in",
      render: (row) => <input type="time" className={inputClass()} value={row.check_in_time || ""} onChange={(event) => updateRecord(row.id, { check_in_time: event.target.value })} />,
    },
    {
      key: "remarks",
      label: "Remarks",
      render: (row) => <input className={inputClass()} value={row.remarks || ""} onChange={(event) => updateRecord(row.id, { remarks: event.target.value })} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance Management" description="Open batch attendance sessions, mark daily status, approve records, and monitor attendance analytics." />

      {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Today's Attendance" value={dashboard.today_total || 0} accent="border-sky-500" />
        <StatCard title="Present Students" value={dashboard.present || 0} accent="border-emerald-500" />
        <StatCard title="Absent Students" value={dashboard.absent || 0} accent="border-red-500" />
        <StatCard title="Late Students" value={dashboard.late || 0} accent="border-amber-500" />
        <StatCard title="Attendance %" value={`${dashboard.percentage || 0}%`} accent="border-cyan-600" />
      </div>

      <form onSubmit={openSession} className="grid gap-4 rounded-md bg-white p-4 shadow-sm md:grid-cols-5">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">Course</span>
          <select className={inputClass()} value={filters.course} onChange={(event) => setFilters({ ...filters, course: event.target.value, batch: "" })}>
            <option value="">All courses</option>
            {courses.filter((course) => course.is_active !== false && !course.is_archived).map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">Batch</span>
          <select required className={inputClass()} value={filters.batch} onChange={(event) => setFilters({ ...filters, batch: event.target.value })}>
            <option value="">Select batch</option>
            {filteredBatches.map((batch) => <option key={batch.id} value={batch.id}>{batch.course_name ? `${batch.course_name} - ` : ""}{batch.name}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">Teacher</span>
          <select className={inputClass()} value={filters.teacher} onChange={(event) => setFilters({ ...filters, teacher: event.target.value })}>
            <option value="">Select teacher</option>
            {teachers.filter((teacher) => teacher.is_active !== false).map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">Date</span>
          <CalendarDatePicker module="attendance" className={inputClass()} value={filters.date} onChange={(value) => setFilters({ ...filters, date: value })} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">Session Topic</span>
          <input className={inputClass()} value={filters.session_topic} onChange={(event) => setFilters({ ...filters, session_topic: event.target.value })} />
        </label>
        <div className="md:col-span-5">
          <button disabled={saving || loading} className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            <CheckCircle size={16} /> Open Attendance Session
          </button>
        </div>
      </form>

      {session ? (
        <section className="space-y-4 rounded-md bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">{session.course_name || "-"} / {session.batch_name || "-"}</h2>
              <p className="text-sm text-gray-500">{session.date} · {statusLabel(session.status)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => bulkMark("present")} className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">Bulk Present</button>
              <button type="button" onClick={() => bulkMark("absent")} className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">Bulk Absent</button>
              <button type="button" onClick={saveAttendance} disabled={saving || session.status === "locked"} className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"><Save size={16} /> Save Attendance</button>
              <button type="button" onClick={() => sessionAction("approve")} disabled={saving || session.status === "locked"} className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700"><ShieldCheck size={16} /> Approve</button>
              <button type="button" onClick={() => sessionAction("lock")} disabled={saving || session.status === "locked"} className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700"><Lock size={16} /> Lock</button>
              <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700"><Printer size={16} /> Print Report</button>
            </div>
          </div>
          <label className="flex max-w-md items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm">
            <Search size={16} className="text-gray-400" />
            <input className="w-full outline-none" placeholder="Search students" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <DataTable title="Student Attendance" columns={columns} rows={visibleRecords} loading={false} pageSize={20} calendarModule="attendance" />
        </section>
      ) : null}

      <DataTable
        title="Attendance Sessions"
        rows={sessions}
        loading={loading}
        error={error}
        columns={[
          { key: "date", label: "Date" },
          { key: "course_name", label: "Course" },
          { key: "batch_name", label: "Batch" },
          { key: "teacher_name", label: "Teacher" },
          { key: "session_topic", label: "Topic" },
          { key: "status", label: "Status", render: (row) => statusLabel(row.status) },
          { key: "attendance_percentage", label: "Attendance %" },
        ]}
        actions={(row) => [
          {
            label: "Open",
            onClick: () => {
              setSession(row);
              setRecords(row.records || []);
            },
          },
        ]}
        calendarModule="attendance"
      />
    </div>
  );
}
