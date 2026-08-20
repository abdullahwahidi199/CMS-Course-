import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CalendarDays, Clock, Filter, MapPin, Users } from "lucide-react";
import { useApiResource } from "../../../hooks/useApiResource";
import { formatBatchLabel } from "../../../utils/batchLabel";
import TeacherPageShell from "./TeacherPageShell";
import { EmptyState, ErrorState, LoadingSkeleton, Panel, SearchBox, StatTile } from "./TeacherUi";
import { formatDate, formatTime, inputClass, normalizeList } from "./teacherUtils.jsx";

export default function TeacherClassesPage() {
  const classes = useApiResource("/classes/", { params: { summary: 1 } });
  const [filters, setFilters] = useState({ search: "", course: "", status: "active" });
  const rows = normalizeList(classes.data);
  const courseOptions = [...new Set(rows.map((item) => item.course_name || item.subjects || item.name).filter(Boolean))];

  const visible = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return rows.filter((item) => {
      const haystack = [item.name, item.course_name, item.subjects, item.roomOfClass_details?.name].join(" ").toLowerCase();
      const matchesSearch = !term || haystack.includes(term);
      const matchesCourse = !filters.course || (item.course_name || item.subjects || item.name) === filters.course;
      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "active" && item.is_active && !item.is_archived) ||
        (filters.status === "archived" && item.is_archived);
      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [filters, rows]);

  return (
    <TeacherPageShell title="My Classes" description="Classes assigned to you with roster size, course, room, and schedule details.">
      <ErrorState message={classes.error} />
      {classes.loading ? (
        <LoadingSkeleton rows={5} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile icon={BookOpen} label="Assigned Classes" value={rows.length} helper="Visible by permission" />
            <StatTile icon={Users} label="Students" value={rows.reduce((sum, row) => sum + Number(row.student_count || 0), 0)} helper="Active enrollments" tone="emerald" />
            <StatTile icon={CalendarDays} label="Active Classes" value={rows.filter((row) => row.is_active && !row.is_archived).length} helper="Currently available" tone="amber" />
            <StatTile icon={Filter} label="Filtered" value={visible.length} helper="Matching your filters" tone="violet" />
          </div>

          <Panel title="Search And Filters">
            <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
              <SearchBox value={filters.search} onChange={(search) => setFilters({ ...filters, search })} placeholder="Search class, course, room" />
              <select className={inputClass()} value={filters.course} onChange={(event) => setFilters({ ...filters, course: event.target.value })}>
                <option value="">All courses</option>
                {courseOptions.map((course) => <option key={course} value={course}>{course}</option>)}
              </select>
              <select className={inputClass()} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="all">All statuses</option>
              </select>
            </div>
          </Panel>

          {visible.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((item) => (
                <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase text-cyan-700">{item.course_name || item.subjects || "Course"}</p>
                      <h3 className="mt-1 truncate text-lg font-semibold text-slate-950">{formatBatchLabel(item)}</h3>
                    </div>
                    <span className="rounded-md bg-cyan-50 p-2 text-cyan-700">
                      <BookOpen size={20} />
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p className="flex items-center gap-2"><Users size={16} /> {item.student_count || 0} students</p>
                    <p className="flex items-center gap-2"><Clock size={16} /> {formatTime(item.start_time)} - {formatTime(item.end_time)}</p>
                    <p className="flex items-center gap-2"><MapPin size={16} /> {item.roomOfClass_details?.name || "No room assigned"}</p>
                    <p className="flex items-center gap-2"><CalendarDays size={16} /> {formatDate(item.startDate)} to {formatDate(item.endDate)}</p>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <Link className="rounded-md bg-cyan-700 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-cyan-800" to={`/teacher/dashboard/classes/${item.id}`}>
                      Open
                    </Link>
                    <Link className="rounded-md border border-slate-200 px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50" to={`/teacher/dashboard/students?class=${item.id}`}>
                      Students
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No classes found" description="Try changing your search or filter settings." />
          )}
        </>
      )}
    </TeacherPageShell>
  );
}
