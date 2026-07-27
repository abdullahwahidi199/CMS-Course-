import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Eye, Mail, Phone, UserRound, Users } from "lucide-react";
import instance from "../../../api/axiosInstance";
import { formatApiError } from "../../../utils/apiErrors";
import { formatBatchLabel } from "../../../utils/batchLabel";
import TeacherPageShell from "./TeacherPageShell";
import { EmptyState, ErrorState, LoadingSkeleton, Panel, SearchBox, StatTile } from "./TeacherUi";
import { attendancePercentage, inputClass, performanceSummary, studentDisplayId } from "./teacherUtils.jsx";

export default function TeacherStudentsPage() {
  const [searchParams] = useSearchParams();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ search: "", classId: searchParams.get("class") || "" });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const classRes = await instance.get("/classes/");
        const assigned = Array.isArray(classRes.data) ? classRes.data : classRes.data?.results || [];
        const details = await Promise.all(
          assigned.map((item) =>
            instance.get(`/students/by-class/${item.id}/`).then((res) => ({
              classInfo: item,
              students: Array.isArray(res.data) ? res.data : res.data?.results || [],
            })),
          ),
        );
        const rows = [];
        details.forEach((detail) => {
          (detail.students || []).forEach((student) => {
            rows.push({
              ...student,
              class_id: detail.classInfo.id,
              class_name: detail.classInfo.name,
              course_name: detail.classInfo.course_name,
            });
          });
        });
        setClasses(assigned);
        setStudents(rows);
      } catch (err) {
        setError(formatApiError(err, "Could not load assigned students."));
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
      const haystack = [student.name, student.role_number, student.student_number_display, student.parent_mobile_number, student.class_name, student.course_name].join(" ").toLowerCase();
      return matchesClass && (!term || haystack.includes(term));
    });
  }, [filters, students]);

  const averageAttendance = visible.length
    ? Math.round(visible.reduce((sum, student) => sum + attendancePercentage(student), 0) / visible.length)
    : 0;

  return (
    <TeacherPageShell title="Students" description="Read-only student records from your assigned classes. Admission data is protected from teacher edits.">
      <ErrorState message={error} />
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile icon={Users} label="Assigned Students" value={students.length} helper="Across your classes" />
            <StatTile icon={UserRound} label="Visible" value={visible.length} helper="After filters" tone="emerald" />
            <StatTile icon={Users} label="Classes" value={classes.length} helper="Assigned classes" tone="amber" />
            <StatTile icon={Eye} label="Avg Attendance" value={`${averageAttendance}%`} helper="Visible students" tone="violet" />
          </div>

          <Panel title="Search And Filters">
            <div className="grid gap-3 md:grid-cols-[1fr_240px]">
              <SearchBox value={filters.search} onChange={(search) => setFilters({ ...filters, search })} placeholder="Search name, ID, phone, class" />
              <select className={inputClass()} value={filters.classId} onChange={(event) => setFilters({ ...filters, classId: event.target.value })}>
                <option value="">All classes</option>
                {classes.map((item) => <option key={item.id} value={item.id}>{formatBatchLabel(item)}</option>)}
              </select>
            </div>
          </Panel>

          <Panel title="Student Directory" description={`${visible.length} students`}>
            {visible.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                      <th className="px-3 py-3">Name</th>
                      <th className="px-3 py-3">Student ID</th>
                      <th className="px-3 py-3">Contact</th>
                      <th className="px-3 py-3">Class</th>
                      <th className="px-3 py-3">Attendance</th>
                      <th className="px-3 py-3">Performance</th>
                      <th className="px-3 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visible.map((student) => (
                      <tr key={`${student.class_id}-${student.id}`} className="text-slate-700">
                        <td className="px-3 py-3 font-semibold text-slate-950">{student.name || "-"}</td>
                        <td className="px-3 py-3">{studentDisplayId(student)}</td>
                        <td className="px-3 py-3">{student.parent_mobile_number || student.phone || "-"}</td>
                        <td className="px-3 py-3">{formatBatchLabel(student)}</td>
                        <td className="px-3 py-3">{attendancePercentage(student)}%</td>
                        <td className="px-3 py-3">{performanceSummary(student)}</td>
                        <td className="px-3 py-3 text-right">
                          <button type="button" className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50" onClick={() => setSelected(student)}>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No students found" description="Try changing class or search filters." />
            )}
          </Panel>
        </>
      )}

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-3 sm:items-center">
          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
            <div className="mb-5 flex items-start gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-md bg-cyan-50 text-cyan-700">
                <UserRound size={22} />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-slate-950">{selected.name}</h3>
                <p className="text-sm text-slate-500">{selected.course_name || "-"} / {selected.class_name || "-"}</p>
              </div>
            </div>
            <div className="grid gap-3 text-sm text-slate-700">
              <p><span className="font-semibold">Student ID:</span> {studentDisplayId(selected)}</p>
              <p><span className="font-semibold">Guardian:</span> {selected.f_name || "-"}</p>
              <p className="flex items-center gap-2"><Phone size={16} /> {selected.parent_mobile_number || selected.phone || "-"}</p>
              <p className="flex items-center gap-2"><Mail size={16} /> {selected.email || "-"}</p>
              <p><span className="font-semibold">Attendance:</span> {attendancePercentage(selected)}%</p>
              <p><span className="font-semibold">Performance:</span> {performanceSummary(selected)}</p>
              <p><span className="font-semibold">Address:</span> {selected.address || "-"}</p>
            </div>
            <button className="mt-5 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white" onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      ) : null}
    </TeacherPageShell>
  );
}
