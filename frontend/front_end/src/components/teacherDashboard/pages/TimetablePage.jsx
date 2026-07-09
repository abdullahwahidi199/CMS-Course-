import { CalendarDays, Clock } from "lucide-react";
import { useApiResource } from "../../../hooks/useApiResource";
import TeacherPageShell from "./TeacherPageShell";

function weekdayFromDate(value) {
  if (!value) return "Schedule";
  return new Date(value).toLocaleDateString(undefined, { weekday: "long" });
}

export default function TeacherTimetablePage() {
  const profile = useApiResource("/teacher/profile/");
  const rows = [...(profile.data?.classes || [])].sort((a, b) => String(a.start_time || "").localeCompare(String(b.start_time || "")));

  return (
    <TeacherPageShell title="Timetable" description="Weekly schedule for your assigned batches.">
      {profile.loading ? <div className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">Loading timetable...</div> : null}
      {profile.error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{profile.error}</div> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase text-cyan-700">{weekdayFromDate(item.startDate)}</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">{item.course_name ? `${item.course_name} / ` : ""}{item.name}</h3>
              </div>
              <div className="rounded-xl bg-cyan-50 p-2 text-cyan-700">
                <CalendarDays size={20} />
              </div>
            </div>
            <p className="flex items-center gap-2 text-sm text-slate-600"><Clock size={16} /> {item.start_time || "-"} - {item.end_time || "-"}</p>
            <p className="mt-2 text-sm text-slate-500">{item.startDate || "-"} to {item.endDate || "-"}</p>
            <div className="mt-4 h-2 rounded-full bg-slate-100">
              <div className="h-2 w-2/3 rounded-full bg-cyan-600" />
            </div>
          </article>
        ))}
      </div>
      {!profile.loading && !rows.length ? <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No timetable entries found.</div> : null}
    </TeacherPageShell>
  );
}
