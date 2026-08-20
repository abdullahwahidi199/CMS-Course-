export function normalizeList(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

export function classIds(profile) {
  return new Set((profile?.classes || []).map((item) => Number(item.id)));
}

export function statusBadge(value) {
  const label = value || "unknown";
  const styles = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    open: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    approved: "bg-cyan-50 text-cyan-700 ring-cyan-200",
    submitted: "bg-violet-50 text-violet-700 ring-violet-200",
    scheduled: "bg-amber-50 text-amber-700 ring-amber-200",
    published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    draft: "bg-gray-100 text-gray-600 ring-gray-200",
    closed: "bg-slate-100 text-slate-700 ring-slate-200",
    locked: "bg-gray-100 text-gray-600 ring-gray-200",
  };
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ${styles[label] || styles.draft}`}>{label}</span>;
}

export function inputClass() {
  return "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-700 focus:ring-4 focus:ring-cyan-50";
}

export function buttonClass(variant = "primary") {
  const variants = {
    primary: "bg-cyan-700 text-white hover:bg-cyan-800",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
  };
  return `inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant] || variants.primary}`;
}

export function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatTime(value) {
  if (!value) return "-";
  return String(value).slice(0, 5);
}

export function studentDisplayId(student) {
  return student?.student_number_display || student?.formatted_student_number || student?.role_number || student?.student_number || student?.id || "-";
}

export function attendancePercentage(student) {
  if (student?.attendance_percentage !== undefined && student?.attendance_percentage !== null) {
    return Math.round(Number(student.attendance_percentage) || 0);
  }
  const records = student?.attendances || [];
  const counted = records.filter((record) => record.status !== "holiday");
  if (!counted.length) return 0;
  const present = counted.filter((record) => ["present", "late", "excused"].includes(record.status)).length;
  return Math.round((present / counted.length) * 100);
}

export function performanceSummary(student) {
  if (student?.performance_average !== undefined && student?.performance_average !== null) {
    const average = Number(student.performance_average);
    if (!Number.isFinite(average)) return "No grades yet";
    if (average >= 80) return `Strong / ${average.toFixed(1)}%`;
    if (average >= 60) return `Steady / ${average.toFixed(1)}%`;
    return `Needs support / ${average.toFixed(1)}%`;
  }
  const results = student?.assessment_results || student?.marks || [];
  if (!results.length) return "No grades yet";
  const values = results
    .map((row) => Number(row.percentage ?? row.marks_obtained ?? 0))
    .filter((value) => Number.isFinite(value));
  if (!values.length) return "No grades yet";
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (average >= 80) return `Strong / ${average.toFixed(1)}%`;
  if (average >= 60) return `Steady / ${average.toFixed(1)}%`;
  return `Needs support / ${average.toFixed(1)}%`;
}

export function todayValue() {
  return new Date().toISOString().slice(0, 10);
}
