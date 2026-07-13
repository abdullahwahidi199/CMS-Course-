import { useMemo, useState } from "react";
import { CalendarDays, Clock, GraduationCap, List } from "lucide-react";
import { useApiResource } from "../../../hooks/useApiResource";
import TeacherPageShell from "./TeacherPageShell";
import { EmptyState, ErrorState, LoadingSkeleton, Panel, StatTile } from "./TeacherUi";
import { formatDate, formatTime, normalizeList, todayValue } from "./teacherUtils.jsx";

const days = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function weekdayName(value) {
  if (!value) return "Unscheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unscheduled";
  return days[date.getDay()];
}

function dateValue(date) {
  return date.toISOString().slice(0, 10);
}

function dateForWeekday(selectedDate, dayName) {
  const selected = new Date(selectedDate);
  const targetIndex = days.indexOf(dayName);
  const selectedIndex = days.indexOf(weekdayName(selectedDate));
  selected.setDate(selected.getDate() + targetIndex - selectedIndex);
  return dateValue(selected);
}

function classIsActiveOn(item, value) {
  if (!value) return true;
  const start = item.startDate || value;
  const end = item.endDate || value;
  return start <= value && value <= end;
}

function ScheduleCard({ item }) {
  return (
    <article className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-950 dark:text-white">{item.course_name ? `${item.course_name} / ` : ""}{item.name}</p>
          <p className="mt-1 text-sm text-slate-500">{formatTime(item.start_time)} - {formatTime(item.end_time)}</p>
        </div>
        <Clock size={18} className="text-cyan-700" />
      </div>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{formatDate(item.startDate)} to {formatDate(item.endDate)}</p>
    </article>
  );
}

export default function TeacherTimetablePage() {
  const classes = useApiResource("/classes/");
  const assessments = useApiResource("/v1/assessments/", { params: { assessment_type: "final_exam" } });
  const [view, setView] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(todayValue());
  const classRows = normalizeList(classes.data).sort((a, b) => String(a.start_time || "").localeCompare(String(b.start_time || "")));
  const examRows = normalizeList(assessments.data).filter((item) => item.assessment_type === "final_exam");
  const selectedDay = weekdayName(selectedDate);
  const dailyRows = classRows.filter((item) => classIsActiveOn(item, selectedDate));

  const byDay = useMemo(() => {
    const grouped = Object.fromEntries(days.map((day) => [day, []]));
    days.forEach((day) => {
      const dayDate = dateForWeekday(selectedDate, day);
      grouped[day] = classRows.filter((item) => classIsActiveOn(item, dayDate));
    });
    return grouped;
  }, [classRows, selectedDate]);

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
            <StatTile icon={CalendarDays} label="Weekly Classes" value={classRows.length} helper="Assigned schedule" />
            <StatTile icon={Clock} label="Today" value={dailyRows.length} helper={selectedDay} tone="emerald" />
            <StatTile icon={GraduationCap} label="Exam Schedules" value={examRows.length} helper="Final exams" tone="amber" />
            <StatTile icon={List} label="Upcoming" value={classRows.filter((item) => item.endDate >= todayValue()).length} helper="Active classes" tone="violet" />
          </div>

          <Panel title="Calendar Controls">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <input type="date" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm sm:w-56 dark:border-slate-700 dark:bg-slate-950" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
              <div className="grid grid-cols-4 rounded-md border border-slate-200 p-1 text-sm dark:border-slate-700">
                {["daily", "weekly", "agenda", "exams"].map((item) => (
                  <button key={item} type="button" className={`rounded px-3 py-2 font-semibold capitalize ${view === item ? "bg-cyan-700 text-white" : "text-slate-600 dark:text-slate-300"}`} onClick={() => setView(item)}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </Panel>

          {view === "daily" ? (
            <Panel title={`${selectedDay} Schedule`} description="Classes for the selected day.">
              {dailyRows.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{dailyRows.map((item) => <ScheduleCard key={item.id} item={item} />)}</div> : <EmptyState title="No classes for this day" description="Select another day or check weekly view." />}
            </Panel>
          ) : null}

          {view === "weekly" ? (
            <div className="grid gap-4 xl:grid-cols-7">
              {days.map((day) => (
                <Panel key={day} title={day} className="min-h-48">
                  {byDay[day]?.length ? <div className="space-y-3">{byDay[day].map((item) => <ScheduleCard key={item.id} item={item} />)}</div> : <p className="text-sm text-slate-500">No classes</p>}
                </Panel>
              ))}
            </div>
          ) : null}

          {view === "agenda" ? (
            <Panel title="Agenda" description="Upcoming classes sorted by time.">
              {classRows.length ? <div className="space-y-3">{classRows.map((item) => <ScheduleCard key={item.id} item={item} />)}</div> : <EmptyState title="No agenda entries" description="Assigned classes will appear here." />}
            </Panel>
          ) : null}

          {view === "exams" ? (
            <Panel title="Exam Schedule" description="Final exam assessments.">
              {examRows.length ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {examRows.map((exam) => (
                    <article key={exam.id} className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
                      <p className="font-semibold text-slate-950 dark:text-white">{exam.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{exam.batch_name || "-"} / {formatDate(exam.assessment_date)}</p>
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
