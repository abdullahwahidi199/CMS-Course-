import { useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import instance from "../../../api/axiosInstance";
import DataTable from "../../shared/DataTable";
import StatCard from "../../shared/StatCard";
import TeacherPageShell from "./TeacherPageShell";
import { inputClass } from "./teacherUtils.jsx";
import { formatApiError } from "../../../utils/apiErrors";

export default function TeacherStudentsPage() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ search: "", classId: "" });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const profile = await instance.get("/teacher/profile/");
        const assigned = profile.data?.classes || [];
        const details = await Promise.all(assigned.map((item) => instance.get(`/classes/${item.id}/`).then((res) => res.data).catch(() => null)));
        const rows = [];
        details.filter(Boolean).forEach((detail) => {
          (detail.student || []).forEach((student) => {
            rows.push({
              ...student,
              class_id: detail.id,
              class_name: detail.name,
              course_name: detail.course_name,
            });
          });
        });
        setClasses(assigned);
        setStudents(rows);
      } catch (err) {
        setError(formatApiError(err, "Could not load students."));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const visible = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return students.filter((student) => {
      const matchesClass = !filters.classId || String(student.class_id) === String(filters.classId);
      const matchesSearch = term
        ? [student.name, student.role_number, student.parent_mobile_number, student.class_name, student.course_name].join(" ").toLowerCase().includes(term)
        : true;
      return matchesClass && matchesSearch;
    });
  }, [filters, students]);

  return (
    <TeacherPageShell title="My Students" description="Students from your assigned classes with quick profile inspection.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Students" value={students.length} accent="border-cyan-600" />
        <StatCard title="Visible" value={visible.length} accent="border-emerald-500" />
        <StatCard title="Classes" value={classes.length} accent="border-violet-500" />
        <StatCard title="Sections" value={new Set(students.map((row) => row.class_id)).size} accent="border-amber-500" />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm">
            <Search size={16} className="text-gray-400" />
            <input className="w-full outline-none" placeholder="Search students" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
          </label>
          <select className={inputClass()} value={filters.classId} onChange={(event) => setFilters({ ...filters, classId: event.target.value })}>
            <option value="">All classes</option>
            {classes.map((item) => <option key={item.id} value={item.id}>{item.course_name ? `${item.course_name} / ` : ""}{item.name}</option>)}
          </select>
        </div>
      </section>

      <DataTable
        title="Student Directory"
        rows={visible}
        loading={loading}
        error={error}
        empty="No students found."
        columns={[
          { key: "name", label: "Student" },
          { key: "role_number", label: "Roll No" },
          { key: "class_name", label: "Class" },
          { key: "course_name", label: "Course" },
          { key: "parent_mobile_number", label: "Parent Mobile" },
          { key: "address", label: "Address" },
        ]}
        actions={(row) => [{ label: "View", onClick: () => setSelected(row) }]}
      />

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-3 sm:items-center">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-cyan-100 text-cyan-700">
                <Users size={22} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-950">{selected.name}</h3>
                <p className="text-sm text-slate-500">{selected.course_name || "-"} / {selected.class_name || "-"}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-slate-700">
              <p><span className="font-medium">Roll No:</span> {selected.role_number || "-"}</p>
              <p><span className="font-medium">Guardian:</span> {selected.f_name || "-"}</p>
              <p><span className="font-medium">Parent Mobile:</span> {selected.parent_mobile_number || "-"}</p>
              <p><span className="font-medium">Address:</span> {selected.address || "-"}</p>
            </div>
            <button className="mt-5 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white" onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      ) : null}
    </TeacherPageShell>
  );
}
