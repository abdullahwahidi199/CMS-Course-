import { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  Layers,
  List,
  MapPin,
  Timer,
} from "lucide-react";
import { useApiResource } from "../../../hooks/useApiResource";
import { formatBatchLabel } from "../../../utils/batchLabel";
import TeacherPageShell from "./TeacherPageShell";
import { EmptyState, ErrorState, LoadingSkeleton } from "./TeacherUi";
import { formatDate, formatTime, normalizeList, todayValue } from "./teacherUtils.jsx";

const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const teachingDays = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

const viewOptions = [
  { id: "daily", label: "Daily", icon: CalendarClock },
  { id: "weekly", label: "Weekly", icon: CalendarDays },
  { id: "agenda", label: "Agenda", icon: List },
  { id: "exams", label: "Exams", icon: GraduationCap },
];

const toneStyles = {
  cyan: {
    accent: "bg-cyan-500",
    border: "border-cyan-200",
    text: "text-cyan-700",
    soft: "bg-cyan-50",
    hover: "hover:border-cyan-200 hover:shadow-cyan-100",
    ring: "ring-cyan-200",
  },
  emerald: {
    accent: "bg-emerald-500",
    border: "border-emerald-200",
    text: "text-emerald-700",
    soft: "bg-emerald-50",
    hover: "hover:border-emerald-200 hover:shadow-emerald-100",
    ring: "ring-emerald-200",
  },
  amber: {
    accent: "bg-amber-500",
    border: "border-amber-200",
    text: "text-amber-700",
    soft: "bg-amber-50",
    hover: "hover:border-amber-200 hover:shadow-amber-100",
    ring: "ring-amber-200",
  },
  violet: {
    accent: "bg-violet-500",
    border: "border-violet-200",
    text: "text-violet-700",
    soft: "bg-violet-50",
    hover: "hover:border-violet-200 hover:shadow-violet-100",
    ring: "ring-violet-200",
  },
  slate: {
    accent: "bg-slate-400",
    border: "border-slate-200",
    text: "text-slate-600",
    soft: "bg-slate-50",
    hover: "hover:border-slate-300 hover:shadow-slate-100",
    ring: "ring-slate-200",
  },
};

const statusTones = {
  Upcoming: "cyan",
  Ongoing: "emerald",
  Completed: "slate",
  Scheduled: "amber",
  Published: "emerald",
  Closed: "slate",
  Draft: "slate",
  Archived: "slate",
};

function parseDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function dateValue(date) {
  if (!date || Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(value, amount) {
  const date = parseDateOnly(value) || new Date();
  date.setDate(date.getDate() + amount);
  return dateValue(date);
}

function weekdayName(value) {
  if (!value) return "Unscheduled";
  const date = parseDateOnly(value);
  if (!date || Number.isNaN(date.getTime())) return "Unscheduled";
  return weekdayNames[date.getDay()];
}

function dateForTeachingDay(selectedDate, dayName) {
  const selected = parseDateOnly(selectedDate) || new Date();
  const daysSinceSaturday = (selected.getDay() + 1) % 7;
  const weekStart = new Date(selected);
  weekStart.setDate(selected.getDate() - daysSinceSaturday);
  const target = new Date(weekStart);
  target.setDate(weekStart.getDate() + teachingDays.indexOf(dayName));
  return dateValue(target);
}

function compactDate(value) {
  const date = parseDateOnly(value);
  if (!date || Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function shiftTeachingDay(dayName, amount) {
  const currentIndex = teachingDays.indexOf(dayName);
  const nextIndex = (currentIndex + amount + teachingDays.length) % teachingDays.length;
  return teachingDays[nextIndex];
}

function minutesFromTime(value) {
  if (!value) return null;
  const [hours, minutes] = String(value).split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function currentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function formatMinutes(value) {
  if (!Number.isFinite(value)) return "Time not set";
  const hours = String(Math.floor(value / 60)).padStart(2, "0");
  const minutes = String(value % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function durationLabel(item) {
  const start = minutesFromTime(item.start_time);
  const end = minutesFromTime(item.end_time);
  if (start === null || end === null) return "Duration not set";
  const total = end >= start ? end - start : end + 1440 - start;
  if (!total) return "0 min";
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (!hours) return `${minutes} min`;
  if (!minutes) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

function timeRangeLabel(item) {
  if (!item.start_time && !item.end_time) return "Time not set";
  return `${formatTime(item.start_time)} - ${formatTime(item.end_time)}`;
}

function sortClassesByTime(a, b) {
  const aStart = minutesFromTime(a.start_time);
  const bStart = minutesFromTime(b.start_time);
  if (aStart === null && bStart === null) return String(a.name || "").localeCompare(String(b.name || ""));
  if (aStart === null) return 1;
  if (bStart === null) return -1;
  return aStart - bStart || String(a.name || "").localeCompare(String(b.name || ""));
}

function isActiveBatch(item) {
  return item.is_active !== false && item.is_archived !== true;
}

function normalizeDayName(value) {
  const lowered = String(value || "").trim().toLowerCase();
  return weekdayNames.find((day) => day.toLowerCase() === lowered) || null;
}

function daysForClass(item) {
  const rawDays = item.days || item.weekdays || item.schedule_days || item.scheduleDays || item.day || item.weekday;
  const values = Array.isArray(rawDays) ? rawDays : rawDays ? String(rawDays).split(",") : [];
  const normalized = [...new Set(values.map(normalizeDayName).filter((day) => teachingDays.includes(day)))];
  return normalized.length ? normalized : teachingDays;
}

function buildByDay(rows) {
  const grouped = Object.fromEntries(teachingDays.map((day) => [day, []]));
  rows.forEach((item) => {
    daysForClass(item).forEach((day) => {
      grouped[day].push(item);
    });
  });
  teachingDays.forEach((day) => {
    grouped[day] = grouped[day].slice().sort(sortClassesByTime);
  });
  return grouped;
}

function classTone(item) {
  const tones = ["cyan", "violet", "emerald", "amber"];
  const seed = Number(item.id || 0);
  return tones[Math.abs(seed) % tones.length];
}

function getClassSubject(item) {
  return item.course_name || item.subjects || item.name || "Class";
}

function getBatchName(item) {
  if (item.name && item.name !== item.course_name) return item.name;
  return item.batch_name || item.class_name || "Batch";
}

function getRoomName(item) {
  return item.roomOfClass_details?.name || item.room_name || item.room || "Room not set";
}

function getClassStatus(item, scheduleDate) {
  const today = todayValue();
  if (scheduleDate < today) return "Completed";
  if (scheduleDate > today) return "Upcoming";
  const start = minutesFromTime(item.start_time);
  const end = minutesFromTime(item.end_time);
  if (start === null || end === null) return "Upcoming";
  const now = currentMinutes();
  if (now >= start && now <= end) return "Ongoing";
  return now < start ? "Upcoming" : "Completed";
}

function getSlotKey(item) {
  return `${item.start_time || "unscheduled"}-${item.end_time || "open"}`;
}

function buildTimeSlots(rows) {
  const slots = new Map();
  rows.forEach((item) => {
    const key = getSlotKey(item);
    if (!slots.has(key)) {
      slots.set(key, {
        key,
        start: minutesFromTime(item.start_time),
        end: minutesFromTime(item.end_time),
        label: timeRangeLabel(item),
      });
    }
  });
  return [...slots.values()].sort((a, b) => {
    if (a.start === null && b.start === null) return a.label.localeCompare(b.label);
    if (a.start === null) return 1;
    if (b.start === null) return -1;
    return a.start - b.start;
  });
}

function buildDaySegments(rows) {
  const segments = [];
  let previousEnd = null;
  rows.forEach((item) => {
    const start = minutesFromTime(item.start_time);
    const end = minutesFromTime(item.end_time);
    if (previousEnd !== null && start !== null && start - previousEnd >= 30) {
      segments.push({ type: "gap", key: `gap-${previousEnd}-${start}`, start: previousEnd, end: start });
    }
    segments.push({ type: "class", key: `class-${item.id}`, item });
    if (end !== null) previousEnd = previousEnd === null ? end : Math.max(previousEnd, end);
  });
  return segments;
}

function findNextClassForDate(rows, scheduleDate) {
  if (!rows.length) return null;
  if (scheduleDate !== todayValue()) return rows[0];
  const now = currentMinutes();
  return rows.find((item) => {
    const start = minutesFromTime(item.start_time);
    return start !== null && start > now;
  }) || null;
}

function findNextClass(rowsByDay, todayRows) {
  const today = todayValue();
  const todayDay = weekdayName(today);
  const now = currentMinutes();
  const upcomingToday = todayRows.find((item) => {
    const start = minutesFromTime(item.start_time);
    return start !== null && start > now;
  });
  if (upcomingToday) return { item: upcomingToday, day: todayDay };

  const currentIndex = teachingDays.indexOf(todayDay);
  for (let offset = 1; offset <= teachingDays.length; offset += 1) {
    const nextIndex = currentIndex === -1 ? offset - 1 : (currentIndex + offset) % teachingDays.length;
    const day = teachingDays[nextIndex];
    const dayRows = rowsByDay[day] || [];
    if (dayRows.length) return { item: dayRows[0], day };
  }
  return null;
}

function normalizeStatusLabel(value) {
  const text = String(value || "scheduled").replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getExamStatus(exam) {
  const today = todayValue();
  const rawStatus = normalizeStatusLabel(exam.status);
  if (exam.assessment_date >= today && !["Published", "Closed", "Archived"].includes(rawStatus)) {
    return "Upcoming";
  }
  return rawStatus;
}

function getExamTime(exam) {
  return formatTime(exam.start_time || exam.exam_time || exam.time) || "Time not set";
}

function getExamDuration(exam) {
  if (exam.duration) return String(exam.duration);
  if (exam.duration_minutes) return `${exam.duration_minutes} min`;
  return "Duration not set";
}

function sortExams(rows) {
  const today = todayValue();
  const upcoming = rows
    .filter((item) => item.assessment_date >= today)
    .sort((a, b) => String(a.assessment_date || "").localeCompare(String(b.assessment_date || "")));
  const previous = rows
    .filter((item) => item.assessment_date < today)
    .sort((a, b) => String(b.assessment_date || "").localeCompare(String(a.assessment_date || "")));
  return [...upcoming, ...previous];
}

const StatusBadge = memo(function StatusBadge({ label, tone = "slate" }) {
  const style = toneStyles[tone] || toneStyles.slate;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${style.soft} ${style.text} ${style.ring}`}>
      {label}
    </span>
  );
});

function SectionSurface({ title, description, icon: Icon, children, id }) {
  return (
    <section id={id} role="tabpanel" aria-label={title} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {Icon ? (
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
              <Icon size={20} />
            </span>
          ) : null}
          <div>
            <h3 className="text-base font-semibold text-slate-950">{title}</h3>
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

const StatSummary = memo(function StatSummary({ stats }) {
  return (
    <section aria-label="Schedule summary" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
      {stats.map(({ label, value, description, icon: Icon, tone }) => {
        const style = toneStyles[tone] || toneStyles.cyan;
        return (
          <article key={label} className={`group rounded-lg border bg-white p-3 shadow-sm transition duration-200 active:scale-[0.99] hover:-translate-y-0.5 hover:shadow-md sm:p-4 ${style.border} ${style.hover}`}>
            <div className="flex items-start justify-between gap-3">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-md sm:h-11 sm:w-11 ${style.soft} ${style.text}`}>
                <Icon size={20} />
              </span>
              <span className={`mt-1 h-2 w-2 rounded-full ${style.accent}`} aria-hidden="true" />
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-500 sm:text-sm">{label}</p>
            <p className="mt-1 truncate text-xl font-semibold text-slate-950 sm:text-2xl">{value}</p>
            <p className="mt-1 truncate text-xs text-slate-500">{description}</p>
          </article>
        );
      })}
    </section>
  );
});

const TimetableHeader = memo(function TimetableHeader({ view, selectedDate, selectedDay, onViewChange, onDateChange, onPreviousDay, onNextDay, onToday }) {
  return (
    <section className="sticky top-0 z-30 rounded-lg border border-slate-200 bg-white/95 px-3 py-3 shadow-sm backdrop-blur sm:p-4" style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 0.75rem)" }}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-cyan-700">Selected day</p>
          <h3 className="mt-1 truncate text-lg font-semibold text-slate-950 sm:text-2xl">{selectedDay}, {formatDate(selectedDate)}</h3>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="grid gap-2 sm:flex sm:items-center">
            <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] gap-2 sm:w-auto">
              <button type="button" onClick={onPreviousDay} className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition active:scale-95 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-cyan-100" aria-label="Previous day">
              <ChevronLeft size={18} />
              </button>
              <label className="sr-only" htmlFor="teacher-timetable-date">Schedule date</label>
              <input
                id="teacher-timetable-date"
                type="date"
                className="h-11 min-w-0 rounded-md border border-slate-200 bg-white px-3 text-center text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-700 focus:ring-4 focus:ring-cyan-50 sm:w-44"
                value={selectedDate}
                onChange={(event) => onDateChange(event.target.value)}
              />
              <button type="button" onClick={onNextDay} className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition active:scale-95 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-cyan-100" aria-label="Next day">
                <ChevronRight size={18} />
              </button>
            </div>
            <button type="button" onClick={onToday} className="inline-flex h-11 w-full items-center justify-center rounded-md border border-cyan-200 bg-cyan-50 px-4 text-sm font-semibold text-cyan-700 transition active:scale-[0.99] hover:bg-cyan-100 focus:outline-none focus:ring-4 focus:ring-cyan-100 sm:w-auto">
              Today
            </button>
          </div>

          <div role="tablist" aria-label="Timetable views" className="grid grid-cols-4 rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm">
            {viewOptions.map(({ id, label, icon: Icon }) => {
              const active = view === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`timetable-panel-${id}`}
                  className={`inline-flex h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-md px-1 text-[11px] font-semibold transition duration-200 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-cyan-100 sm:h-11 sm:flex-row sm:gap-2 sm:px-3 sm:text-sm ${active ? "bg-white text-cyan-700 shadow-sm" : "text-slate-600 hover:bg-white/70 hover:text-slate-950"}`}
                  onClick={() => onViewChange(id)}
                >
                  <Icon size={16} />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
});

const ScheduleCard = memo(function ScheduleCard({ item, scheduleDate, compact = false, isNext = false }) {
  const status = getClassStatus(item, scheduleDate);
  const statusTone = statusTones[status] || "slate";
  const accentTone = classTone(item);
  const accent = toneStyles[accentTone] || toneStyles.cyan;
  const highlighted = status === "Ongoing";
  const subject = getClassSubject(item);
  const batch = getBatchName(item);

  return (
    <article
      aria-label={`${subject} ${batch} ${timeRangeLabel(item)} ${status}`}
      className={`group relative overflow-hidden rounded-lg border bg-white p-4 shadow-sm transition duration-200 active:scale-[0.99] hover:-translate-y-0.5 hover:shadow-md ${highlighted ? "border-emerald-300 bg-emerald-50/50 ring-1 ring-emerald-200" : isNext ? "border-cyan-300 bg-cyan-50/40 ring-1 ring-cyan-100" : "border-slate-200 hover:border-cyan-200"}`}
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${accent.accent}`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${accent.soft} ${accent.text}`}>
              <BookOpen size={16} />
            </span>
            <div className="min-w-0">
              <h4 className={`${compact ? "text-sm" : "text-base"} truncate font-semibold text-slate-950`}>{subject}</h4>
              <p className="truncate text-sm text-slate-500">{batch}</p>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusBadge label={status} tone={statusTone} />
          {isNext && status !== "Ongoing" ? <span className="text-xs font-semibold text-cyan-700">Next</span> : null}
        </div>
      </div>

      <div className={`mt-4 grid gap-3 pl-2 text-sm text-slate-600 ${compact ? "grid-cols-1" : "sm:grid-cols-2 xl:grid-cols-4"}`}>
        <p className="flex items-center gap-2"><Clock size={15} className="text-cyan-700" /> {timeRangeLabel(item)}</p>
        <p className="flex items-center gap-2"><Timer size={15} className="text-violet-700" /> {durationLabel(item)}</p>
        <p className="flex items-center gap-2"><MapPin size={15} className="text-slate-500" /> {getRoomName(item)}</p>
        {!compact ? <p className="flex items-center gap-2"><CalendarDays size={15} className="text-slate-500" /> {formatDate(item.startDate)} to {formatDate(item.endDate)}</p> : null}
      </div>
    </article>
  );
});

function TimeSlot({ label, sublabel }) {
  return (
    <div className="flex h-full flex-col justify-start rounded-lg bg-slate-50 px-3 py-3 text-sm md:rounded-none">
      <time className="font-semibold text-slate-700">{label}</time>
      {sublabel ? <span className="mt-1 text-xs text-slate-500">{sublabel}</span> : null}
    </div>
  );
}

const DailySchedule = memo(function DailySchedule({ rows, selectedDate, selectedDay, isFriday }) {
  const segments = useMemo(() => buildDaySegments(rows), [rows]);
  const nextClass = useMemo(() => findNextClassForDate(rows, selectedDate), [rows, selectedDate]);

  return (
    <SectionSurface
      id="timetable-panel-daily"
      title={isFriday ? "Friday Off" : `${selectedDay} Schedule`}
      description={isFriday ? "Friday is kept clear for Afghanistan's weekly off day." : `${rows.length} active class${rows.length === 1 ? "" : "es"} on this teaching day.`}
      icon={CalendarClock}
    >
      {rows.length ? (
        <div className="space-y-3">
          {segments.map((segment) => {
            if (segment.type === "gap") {
              return (
                <div key={segment.key} className="grid gap-2 md:grid-cols-[96px_minmax(0,1fr)] md:gap-3">
                  <TimeSlot label={formatMinutes(segment.start)} sublabel={formatMinutes(segment.end)} />
                  <div className="flex min-h-16 items-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-500">
                    Free period
                  </div>
                </div>
              );
            }
            return (
              <div key={segment.key} className="grid gap-2 md:grid-cols-[96px_minmax(0,1fr)] md:gap-3">
                <TimeSlot label={formatTime(segment.item.start_time)} sublabel={formatTime(segment.item.end_time)} />
                <ScheduleCard item={segment.item} scheduleDate={selectedDate} isNext={nextClass?.id === segment.item.id} />
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title={isFriday ? "Friday is off" : "No active batches"} description={isFriday ? "No regular classes are shown on Friday." : "Assigned active batches will appear here."} />
      )}
    </SectionSurface>
  );
});

const MobileDaySelector = memo(function MobileDaySelector({ selectedDay, weekDates, byDay, onSelectDay }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-1" aria-label="Teaching days">
      <div role="tablist" aria-label="Weekly teaching days" className="flex gap-2">
        {teachingDays.map((day) => {
          const active = selectedDay === day;
          const count = byDay[day]?.length || 0;
          return (
            <button
              key={day}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelectDay(day)}
              className={`min-h-16 min-w-[76px] rounded-lg border px-3 py-2 text-left transition duration-200 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-cyan-100 ${active ? "border-cyan-300 bg-cyan-50 text-cyan-900 shadow-sm" : "border-slate-200 bg-white text-slate-600"}`}
            >
              <span className="block text-xs font-semibold uppercase">{day.slice(0, 3)}</span>
              <span className="mt-1 block text-sm font-semibold">{compactDate(weekDates[day])}</span>
              <span className="mt-1 block text-xs text-slate-500">{count} class{count === 1 ? "" : "es"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

const WeeklyTimetable = memo(function WeeklyTimetable({ byDay, selectedDate }) {
  const weekDates = useMemo(() => Object.fromEntries(teachingDays.map((day) => [day, dateForTeachingDay(selectedDate, day)])), [selectedDate]);
  const allRows = useMemo(() => teachingDays.flatMap((day) => byDay[day] || []), [byDay]);
  const timeSlots = useMemo(() => buildTimeSlots(allRows), [allRows]);
  const selectedDateDay = weekdayName(selectedDate);
  const initialDay = teachingDays.includes(selectedDateDay) ? selectedDateDay : "Saturday";
  const [selectedWeekDay, setSelectedWeekDay] = useState(initialDay);
  const touchStartX = useRef(null);
  const today = todayValue();
  const selectedRows = byDay[selectedWeekDay] || [];
  const selectedWeekDate = weekDates[selectedWeekDay];

  const selectAdjacentDay = useCallback((amount) => {
    setSelectedWeekDay((current) => shiftTeachingDay(current, amount));
  }, []);

  const handleTouchStart = useCallback((event) => {
    touchStartX.current = event.changedTouches?.[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback((event) => {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches?.[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 45) return;
    selectAdjacentDay(delta < 0 ? 1 : -1);
  }, [selectAdjacentDay]);

  return (
    <SectionSurface id="timetable-panel-weekly" title="Weekly Timetable" description="Teaching days are organized by time and class period." icon={CalendarDays}>
      {timeSlots.length ? (
        <>
          <div className="space-y-4 md:hidden">
            <MobileDaySelector selectedDay={selectedWeekDay} weekDates={weekDates} byDay={byDay} onSelectDay={setSelectedWeekDay} />
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
              <button type="button" onClick={() => selectAdjacentDay(-1)} className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm transition active:scale-95 focus:outline-none focus:ring-4 focus:ring-cyan-100" aria-label="Previous teaching day">
                <ChevronLeft size={18} />
              </button>
              <div className="min-w-0 text-center">
                <p className="truncate text-sm font-semibold text-slate-950">{selectedWeekDay}</p>
                <p className="text-xs text-slate-500">{formatDate(selectedWeekDate)}</p>
              </div>
              <button type="button" onClick={() => selectAdjacentDay(1)} className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm transition active:scale-95 focus:outline-none focus:ring-4 focus:ring-cyan-100" aria-label="Next teaching day">
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="touch-pan-y space-y-3" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} aria-live="polite" aria-label={`${selectedWeekDay} schedule`}>
              {selectedRows.length ? (
                selectedRows.map((item) => <ScheduleCard key={`mobile-week-${selectedWeekDay}-${item.id}`} item={item} scheduleDate={selectedWeekDate} />)
              ) : (
                <EmptyState title="No classes" description="This teaching day has no active batches." />
              )}
            </div>
          </div>

          <div className="hidden overflow-x-auto rounded-lg border border-slate-200 md:block">
            <div className="min-w-[1040px]">
              <div className="sticky top-0 z-10 grid border-b border-slate-200 bg-white" style={{ gridTemplateColumns: "92px repeat(6, minmax(158px, 1fr))" }}>
                <div className="bg-slate-50 px-3 py-3 text-xs font-semibold uppercase text-slate-500">Time</div>
                {teachingDays.map((day) => {
                  const isCurrentDay = weekDates[day] === today;
                  return (
                    <div key={day} className={`border-l border-slate-200 px-3 py-3 ${isCurrentDay ? "bg-cyan-50 text-cyan-900" : "bg-white text-slate-800"}`}>
                      <p className="text-sm font-semibold">{day}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{formatDate(weekDates[day])}</p>
                    </div>
                  );
                })}
              </div>

              {timeSlots.map((slot) => (
                <div key={slot.key} className="grid border-b border-slate-100 last:border-b-0" style={{ gridTemplateColumns: "92px repeat(6, minmax(158px, 1fr))" }}>
                  <TimeSlot label={slot.label} />
                  {teachingDays.map((day) => {
                    const entries = (byDay[day] || []).filter((item) => getSlotKey(item) === slot.key);
                    const isCurrentDay = weekDates[day] === today;
                    return (
                      <div key={`${slot.key}-${day}`} className={`min-h-[132px] border-l border-slate-100 p-2 transition ${isCurrentDay ? "bg-cyan-50/40" : "bg-white hover:bg-slate-50/80"}`}>
                        <div className="space-y-2">
                          {entries.map((item) => (
                            <ScheduleCard key={`${day}-${slot.key}-${item.id}`} item={item} scheduleDate={weekDates[day]} compact />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <EmptyState title="No active timetable entries" description="Assigned active batches will appear in the weekly grid." />
      )}
    </SectionSurface>
  );
});

const AgendaTimeline = memo(function AgendaTimeline({ byDay, selectedDate }) {
  const groups = useMemo(
    () => teachingDays.map((day) => ({ day, date: dateForTeachingDay(selectedDate, day), rows: byDay[day] || [] })),
    [byDay, selectedDate],
  );

  return (
    <SectionSurface id="timetable-panel-agenda" title="Agenda Timeline" description="Classes grouped by teaching day and sorted by time." icon={List}>
      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.day} className="grid gap-3 md:grid-cols-[128px_minmax(0,1fr)]">
            <div>
              <h4 className="text-sm font-semibold text-slate-950">{group.day}</h4>
              <p className="mt-1 text-xs text-slate-500">{formatDate(group.date)}</p>
            </div>
            <div className="relative space-y-3 border-l border-slate-200 pl-4">
              {group.rows.length ? (
                group.rows.map((item) => {
                  const status = getClassStatus(item, group.date);
                  const tone = classTone(item);
                  const style = toneStyles[tone] || toneStyles.cyan;
                  return (
                    <article key={`${group.day}-agenda-${item.id}`} className="group relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition duration-200 active:scale-[0.99] hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md">
                      <span className={`absolute -left-[21px] top-5 h-3 w-3 rounded-full ring-4 ring-white ${style.accent}`} aria-hidden="true" />
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase text-slate-500">{timeRangeLabel(item)}</p>
                          <h4 className="mt-1 truncate text-base font-semibold text-slate-950">{getClassSubject(item)}</h4>
                          <p className="mt-1 truncate text-sm text-slate-500">{getBatchName(item)} / {group.day} / {formatDate(group.date)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge label={status} tone={statusTones[status] || "slate"} />
                          <StatusBadge label={durationLabel(item)} tone="violet" />
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">No classes</div>
              )}
            </div>
          </section>
        ))}
      </div>
    </SectionSurface>
  );
});

const ExamCard = memo(function ExamCard({ exam }) {
  const status = getExamStatus(exam);
  const tone = statusTones[status] || "amber";
  const style = toneStyles[tone] || toneStyles.amber;
  const upcoming = status === "Upcoming";

  return (
    <article className={`group relative overflow-hidden rounded-lg border bg-white p-4 shadow-sm transition duration-200 active:scale-[0.99] hover:-translate-y-0.5 hover:shadow-md ${upcoming ? "border-amber-300 bg-amber-50/30 ring-1 ring-amber-100" : "border-slate-200 hover:border-amber-200"}`}>
      <span className={`absolute inset-y-0 left-0 w-1.5 ${style.accent}`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-amber-700">Final exam</p>
          <h4 className="mt-1 truncate text-base font-semibold text-slate-950">{exam.title}</h4>
          <p className="mt-1 truncate text-sm text-slate-500">{formatBatchLabel(exam)}</p>
        </div>
        <StatusBadge label={status} tone={tone} />
      </div>
      <div className="mt-4 grid gap-3 pl-2 text-sm text-slate-600 sm:grid-cols-2">
        <p className="flex items-center gap-2"><CalendarDays size={15} className="text-amber-700" /> {formatDate(exam.assessment_date)}</p>
        <p className="flex items-center gap-2"><Clock size={15} className="text-cyan-700" /> {getExamTime(exam)}</p>
        <p className="flex items-center gap-2"><Timer size={15} className="text-violet-700" /> {getExamDuration(exam)}</p>
        <p className="flex items-center gap-2"><Layers size={15} className="text-slate-500" /> {normalizeStatusLabel(exam.status)}</p>
      </div>
    </article>
  );
});

const ExamSchedule = memo(function ExamSchedule({ rows }) {
  return (
    <SectionSurface id="timetable-panel-exams" title="Exam Schedule" description="Final exams sorted by nearest upcoming date." icon={GraduationCap}>
      {rows.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((exam) => <ExamCard key={exam.id} exam={exam} />)}
        </div>
      ) : (
        <EmptyState title="No final exams scheduled" description="Create final exams from the Exams page." />
      )}
    </SectionSurface>
  );
});

export default function TeacherTimetablePage() {
  const classes = useApiResource("/classes/");
  const assessments = useApiResource("/v1/assessments/", { params: { assessment_type: "final_exam" } });
  const [view, setView] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(todayValue());

  const classRows = useMemo(
    () => normalizeList(classes.data).slice().sort(sortClassesByTime),
    [classes.data],
  );
  const activeClassRows = useMemo(() => classRows.filter(isActiveBatch), [classRows]);
  const examRows = useMemo(
    () => sortExams(normalizeList(assessments.data).filter((item) => item.assessment_type === "final_exam")),
    [assessments.data],
  );
  const byDay = useMemo(() => buildByDay(activeClassRows), [activeClassRows]);
  const selectedDay = weekdayName(selectedDate);
  const isFriday = selectedDay === "Friday";
  const dailyRows = useMemo(() => (isFriday ? [] : (byDay[selectedDay] || []).slice().sort(sortClassesByTime)), [byDay, isFriday, selectedDay]);

  const today = todayValue();
  const todayDay = weekdayName(today);
  const todayRows = todayDay === "Friday" ? [] : (byDay[todayDay] || []);
  const upcomingTodayRows = todayRows.filter((item) => getClassStatus(item, today) === "Upcoming");
  const nextClass = findNextClass(byDay, todayRows);
  const weeklyClassCount = teachingDays.reduce((sum, day) => sum + (byDay[day]?.length || 0), 0);

  const stats = useMemo(() => [
    {
      label: "Today's Classes",
      value: todayRows.length,
      description: todayDay === "Friday" ? "Friday off" : `${todayDay} schedule`,
      icon: CalendarCheck,
      tone: "cyan",
    },
    {
      label: "Weekly Classes",
      value: weeklyClassCount,
      description: "Teaching-day entries",
      icon: CalendarDays,
      tone: "violet",
    },
    {
      label: "Upcoming Classes",
      value: upcomingTodayRows.length,
      description: "Still ahead today",
      icon: Clock,
      tone: "emerald",
    },
    {
      label: "Final Exams",
      value: examRows.length,
      description: "Exam schedule",
      icon: GraduationCap,
      tone: "amber",
    },
    {
      label: "Next Class Time",
      value: nextClass ? formatTime(nextClass.item.start_time) : "-",
      description: nextClass ? `${nextClass.day} / ${formatBatchLabel(nextClass.item)}` : "No active batches",
      icon: Timer,
      tone: "slate",
    },
  ], [examRows.length, nextClass, todayDay, todayRows.length, upcomingTodayRows.length, weeklyClassCount]);

  const handleViewChange = useCallback((nextView) => setView(nextView), []);
  const handleDateChange = useCallback((nextDate) => setSelectedDate(nextDate), []);
  const handlePreviousDay = useCallback(() => setSelectedDate((current) => addDays(current, -1)), []);
  const handleNextDay = useCallback(() => setSelectedDate((current) => addDays(current, 1)), []);
  const handleToday = useCallback(() => setSelectedDate(todayValue()), []);

  const loading = classes.loading || assessments.loading;
  const error = classes.error || assessments.error;

  return (
    <TeacherPageShell title="Schedule" description="Daily timetable, weekly grid, agenda timeline, and final exam schedule.">
      <ErrorState message={error} />
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : (
        <div className="space-y-5">
          <StatSummary stats={stats} />
          <TimetableHeader
            view={view}
            selectedDate={selectedDate}
            selectedDay={selectedDay}
            onViewChange={handleViewChange}
            onDateChange={handleDateChange}
            onPreviousDay={handlePreviousDay}
            onNextDay={handleNextDay}
            onToday={handleToday}
          />

          <div key={view} className="transition duration-200">
            {view === "daily" ? <DailySchedule rows={dailyRows} selectedDate={selectedDate} selectedDay={selectedDay} isFriday={isFriday} /> : null}
            {view === "weekly" ? <WeeklyTimetable key={selectedDate} byDay={byDay} selectedDate={selectedDate} /> : null}
            {view === "agenda" ? <AgendaTimeline byDay={byDay} selectedDate={selectedDate} /> : null}
            {view === "exams" ? <ExamSchedule rows={examRows} /> : null}
          </div>
        </div>
      )}
    </TeacherPageShell>
  );
}
