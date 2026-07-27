import { useMemo, useState } from "react";
import { CalendarDays, Clock, GraduationCap, List } from "lucide-react";
import { useApiResource } from "../../../hooks/useApiResource";
import { formatBatchLabel } from "../../../utils/batchLabel";
import TeacherPageShell from "./TeacherPageShell";
import { EmptyState, ErrorState, LoadingSkeleton, Panel, StatTile } from "./TeacherUi";
import { formatDate, formatTime, normalizeList, todayValue } from "./teacherUtils.jsx";

const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const teachingDays = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

function parseDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function weekdayName(value) {
  if (!value) return "Unscheduled";
  const date = parseDateOnly(value);
  if (!date) return "Unscheduled";
  if (Number.isNaN(date.getTime())) return "Unscheduled";
  return weekdayNames[date.getDay()];
}

function isActiveBatch(item) {
  return item.is_active !== false && item.is_archived !== true;
}

function ScheduleCard({ item }) {
  return (
    <article className="rounded-md border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-950">{formatBatchLabel(item)}</p>
          <p className="mt-1 text-sm text-slate-500">{formatTime(item.start_time)} - {formatTime(item.end_time)}</p>
        </div>
        <Clock size={18} className="text-cyan-700" />
      </div>
      <p className="mt-3 text-sm text-slate-600">{formatDate(item.startDate)} to {formatDate(item.endDate)}</p>
    </article>
  );
}

export default function TeacherTimetablePage() {
  const classes = useApiResource("/classes/");
  const assessments = useApiResource("/v1/assessments/", { params: { assessment_type: "final_exam" } });
  const [view, setView] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(todayValue());
  const classRows = normalizeList(classes.data).sort((a, b) => String(a.start_time || "").localeCompare(String(b.start_time || "")));
  const activeClassRows = classRows.filter(isActiveBatch);
  const examRows = normalizeList(assessments.data).filter((item) => item.assessment_type === "final_exam");
  const selectedDay = weekdayName(selectedDate);
  const isFriday = selectedDay === "Friday";
  const dailyRows = isFriday ? [] : activeClassRows;

  const byDay = useMemo(() => {
    const grouped = Object.fromEntries(teachingDays.map((day) => [day, []]));
    teachingDays.forEach((day) => {
      grouped[day] = activeClassRows;
    });
    return grouped;
  }, [activeClassRows]);

  const loading = classes.loading || assessments.loading;
  const error = classes.error || assessments.error;

  return (
    <TeacherPageShell title="Schedule" description="Daily and weekly timetable, agenda view, upcoming classes, and final exam schedules.">
      <ErrorState message={error} />
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile icon={CalendarDays} label="Weekly Classes" value={activeClassRows.length} helper="Assigned active batches" />
            <StatTile icon={Clock} label="Today" value={dailyRows.length} helper={isFriday ? "Friday off" : selectedDay} tone="emerald" />
            <StatTile icon={GraduationCap} label="Exam Schedules" value={examRows.length} helper="Final exams" tone="amber" />
            <StatTile icon={List} label="Upcoming" value={activeClassRows.length} helper="Active classes" tone="violet" />
          </div>

          <Panel title="Calendar Controls">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <input type="date" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm sm:w-56" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
              <div className="grid grid-cols-4 rounded-md border border-slate-200 p-1 text-sm">
                {["daily", "weekly", "agenda", "exams"].map((item) => (
                  <button key={item} type="button" className={`rounded px-3 py-2 font-semibold capitalize ${view === item ? "bg-cyan-700 text-white" : "text-slate-600"}`} onClick={() => setView(item)}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </Panel>

          {view === "daily" ? (
            <Panel title={isFriday ? "Friday Off" : `${selectedDay} Schedule`} description={isFriday ? "Friday is kept clear for Afghanistan's weekly off day." : "Active assigned batches for the selected teaching day."}>
              {dailyRows.length ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {dailyRows.map((item) => <ScheduleCard key={item.id} item={item} />)}
                </div>
              ) : (
                <EmptyState title={isFriday ? "Friday is off" : "No active batches"} description={isFriday ? "No regular classes are shown on Friday." : "Active assigned batches will appear here."} />
              )}
            </Panel>
          ) : null}

          {view === "weekly" ? (
            <div className="grid gap-4 xl:grid-cols-6">
              {teachingDays.map((day) => (
                <Panel key={day} title={day} className="min-h-48">
                  {byDay[day]?.length ? <div className="space-y-3">{byDay[day].map((item) => <ScheduleCard key={`${day}-${item.id}`} item={item} />)}</div> : <p className="text-sm text-slate-500">No active batches</p>}
                </Panel>
              ))}
            </div>
          ) : null}

          {view === "agenda" ? (
            <Panel title="Agenda" description="Active assigned batches sorted by time.">
              {activeClassRows.length ? <div className="space-y-3">{activeClassRows.map((item) => <ScheduleCard key={item.id} item={item} />)}</div> : <EmptyState title="No agenda entries" description="Assigned active batches will appear here." />}
            </Panel>
          ) : null}

          {view === "exams" ? (
            <Panel title="Exam Schedule" description="Final exam assessments.">
              {examRows.length ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {examRows.map((exam) => (
                    <article key={exam.id} className="rounded-md border border-slate-200 p-3">
                      <p className="font-semibold text-slate-950">{exam.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{formatBatchLabel(exam)} / {formatDate(exam.assessment_date)}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="No final exams scheduled" description="Create final exams from the Exams page." />
              )}
            </Panel>
          ) : null}
        </>
      )}
    </TeacherPageShell>
  );
}
