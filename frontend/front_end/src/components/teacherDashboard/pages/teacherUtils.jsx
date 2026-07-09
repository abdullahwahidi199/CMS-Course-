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
  return "w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-cyan-600";
}
