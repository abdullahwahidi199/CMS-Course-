import { useMemo, useState } from "react";
import { CalendarDays, Megaphone, Plus } from "lucide-react";
import instance from "../../../api/axiosInstance";
import { useApiResource } from "../../../hooks/useApiResource";
import { formatApiError } from "../../../utils/apiErrors";
import TeacherPageShell from "./TeacherPageShell";
import { EmptyState, ErrorState, LoadingSkeleton, Panel, SearchBox, StatTile, Toast } from "./TeacherUi";
import { buttonClass, formatDate, inputClass, normalizeList, todayValue } from "./teacherUtils.jsx";

export default function TeacherAnnouncementsPage() {
  const announcements = useApiResource("/events/");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ title: "", discription: "", date: todayValue(), image: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const rows = normalizeList(announcements.data).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? rows.filter((item) => [item.title, item.discription].join(" ").toLowerCase().includes(term)) : rows;
  }, [query, rows]);

  const createAnnouncement = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== "") payload.append(key, value);
      });
      await instance.post("/events/", payload);
      setForm({ title: "", discription: "", date: todayValue(), image: null });
      setToast({ message: "Announcement created." });
      await announcements.refetch();
    } catch (err) {
      setError(formatApiError(err, "Could not create announcement."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <TeacherPageShell title="Announcements" description="View center announcements and create updates when your role is permitted.">
      <ErrorState message={announcements.error || error} />
      {announcements.loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatTile icon={Megaphone} label="Announcements" value={rows.length} helper="Center updates" />
            <StatTile icon={CalendarDays} label="Upcoming" value={rows.filter((item) => item.date >= todayValue()).length} helper="Dated ahead" tone="emerald" />
            <StatTile icon={Plus} label="Visible" value={visible.length} helper="After search" tone="amber" />
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
            <Panel title="Create Announcement">
              <form onSubmit={createAnnouncement} className="grid gap-3">
                <input required className={inputClass()} placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
                <textarea required className={inputClass()} rows={4} placeholder="Announcement body" value={form.discription} onChange={(event) => setForm({ ...form, discription: event.target.value })} />
                <input required type="date" className={inputClass()} value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
                <input type="file" className={inputClass()} accept="image/*" onChange={(event) => setForm({ ...form, image: event.target.files?.[0] || null })} />
                <button className={buttonClass()} disabled={saving}><Plus size={16} /> Publish Announcement</button>
              </form>
            </Panel>

            <Panel title="Announcement Feed" description="Search current and past updates.">
              <div className="mb-4">
                <SearchBox value={query} onChange={setQuery} placeholder="Search announcements" />
              </div>
              {visible.length ? (
                <div className="space-y-3">
                  {visible.map((item) => (
                    <article key={item.id} className="rounded-md border border-slate-200 p-4">
                      <p className="font-semibold text-slate-950">{item.title}</p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{item.discription}</p>
                      <p className="mt-3 text-xs font-medium text-slate-500">{formatDate(item.date)}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="No announcements found" description="Try a different search term." />
              )}
            </Panel>
          </div>
        </>
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </TeacherPageShell>
  );
}
