import { useEffect, useMemo, useState } from "react";
import { GraduationCap, Plus, Printer, Send } from "lucide-react";
import instance from "../../../api/axiosInstance";
import { formatApiError } from "../../../utils/apiErrors";
import { formatBatchLabel } from "../../../utils/batchLabel";
import TeacherPageShell from "./TeacherPageShell";
import { EmptyState, ErrorState, LoadingSkeleton, Panel, SearchBox, StatTile, Toast } from "./TeacherUi";
import { buttonClass, formatDate, inputClass, normalizeList, statusBadge, todayValue } from "./teacherUtils.jsx";

export default function TeacherExamsPage() {
  const [profile, setProfile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [form, setForm] = useState({ title: "", description: "", batch: "", maximum_marks: 100, passing_marks: 50, assessment_date: todayValue(), status: "scheduled" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [profileRes, classRes, examRes] = await Promise.all([
        instance.get("/teacher/profile/"),
        instance.get("/classes/"),
        instance.get("/v1/assessments/", { params: { assessment_type: "final_exam" } }),
      ]);
      const classRows = normalizeList(classRes.data);
      setProfile(profileRes.data);
      setClasses(classRows);
      setExams(normalizeList(examRes.data));
      setForm((current) => ({ ...current, batch: current.batch || String(classRows[0]?.id || "") }));
    } catch (err) {
      setError(formatApiError(err, "Could not load exams."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return exams.filter((item) => {
      const matchesSearch = !term || [item.title, item.batch_name, item.course_name].join(" ").toLowerCase().includes(term);
      const matchesStatus = !filters.status || item.status === filters.status;
      return matchesSearch && matchesStatus;
    });
  }, [exams, filters]);

  const createExam = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const batch = classes.find((item) => String(item.id) === String(form.batch));
      await instance.post("/v1/assessments/", {
        ...form,
        assessment_type: "final_exam",
        batch: Number(form.batch),
        course: batch?.course || null,
        teacher: profile.id,
        maximum_marks: Number(form.maximum_marks),
        passing_marks: Number(form.passing_marks),
      });
      setToast({ message: "Final exam created." });
      setForm({ title: "", description: "", batch: form.batch, maximum_marks: 100, passing_marks: 50, assessment_date: todayValue(), status: "scheduled" });
      await load();
    } catch (err) {
      setError(formatApiError(err, "Could not create exam."));
    } finally {
      setSaving(false);
    }
  };

  const publish = async (exam) => {
    setSaving(true);
    setError("");
    try {
      await instance.post(`/v1/assessments/${exam.id}/publish/`);
      setToast({ message: "Exam results published." });
      await load();
    } catch (err) {
      setError(formatApiError(err, "Could not publish exam."));
    } finally {
      setSaving(false);
    }
  };

  const printResults = (exam) => {
    const rows = exam.results || [];
    const html = `
      <html><head><title>${exam.title}</title><style>
        body{font-family:Arial,sans-serif;padding:32px;color:#0f172a}
        h1{font-size:22px;margin:0 0 4px}
        p{margin:0 0 18px;color:#475569}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}
        th{background:#f1f5f9}
      </style></head><body>
      <h1>${exam.title}</h1><p>${formatBatchLabel(exam, "")} / ${formatDate(exam.assessment_date)}</p>
      <table><thead><tr><th>#</th><th>Student</th><th>Marks</th><th>Percentage</th><th>Grade</th><th>Status</th></tr></thead>
      <tbody>${rows.map((row, index) => `<tr><td>${index + 1}</td><td>${row.student_name}</td><td>${row.marks_obtained}</td><td>${row.percentage}%</td><td>${row.grade}</td><td>${row.is_passed ? "Pass" : "Fail"}</td></tr>`).join("")}</tbody></table>
      </body></html>`;
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.print();
  };

  const upcoming = exams.filter((item) => item.assessment_date >= todayValue()).length;
  const average = exams.flatMap((item) => item.results || []);

  return (
    <TeacherPageShell title="Exams" description="Final exams are managed through assessments with type Final Exam.">
      <ErrorState message={error} />
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile icon={GraduationCap} label="Final Exams" value={exams.length} helper="Created for your classes" />
            <StatTile icon={GraduationCap} label="Upcoming" value={upcoming} helper="Scheduled ahead" tone="emerald" />
            <StatTile icon={Send} label="Published" value={exams.filter((item) => item.status === "published").length} helper="Results released" tone="amber" />
            <StatTile icon={Printer} label="Marked Results" value={average.length} helper="Printable rows" tone="violet" />
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
            <Panel title="Create Final Exam">
              <form onSubmit={createExam} className="grid gap-3">
                <input required className={inputClass()} placeholder="Exam title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
                <textarea className={inputClass()} rows={3} placeholder="Exam description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select required className={inputClass()} value={form.batch} onChange={(event) => setForm({ ...form, batch: event.target.value })}>
                    {classes.map((item) => <option key={item.id} value={item.id}>{formatBatchLabel(item)}</option>)}
                  </select>
                  <input required type="date" className={inputClass()} value={form.assessment_date} onChange={(event) => setForm({ ...form, assessment_date: event.target.value })} />
                  <input required type="number" min="1" className={inputClass()} value={form.maximum_marks} onChange={(event) => setForm({ ...form, maximum_marks: event.target.value })} />
                  <input required type="number" min="0" className={inputClass()} value={form.passing_marks} onChange={(event) => setForm({ ...form, passing_marks: event.target.value })} />
                </div>
                <button className={buttonClass()} disabled={saving}><Plus size={16} /> Create Final Exam</button>
              </form>
            </Panel>

            <Panel title="Final Exam List">
              <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
                <SearchBox value={filters.search} onChange={(search) => setFilters({ ...filters, search })} placeholder="Search exams" />
                <select className={inputClass()} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
                  <option value="">All statuses</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              {visible.length ? (
                <div className="space-y-3">
                  {visible.map((exam) => (
                    <article key={exam.id} className="rounded-md border border-slate-200 p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-950">{exam.title}</p>
                          <p className="text-sm text-slate-500">{formatBatchLabel(exam)} / {formatDate(exam.assessment_date)} / {exam.results?.length || 0} results</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {statusBadge(exam.status)}
                          <button type="button" className={buttonClass("secondary")} onClick={() => printResults(exam)} disabled={!exam.results?.length}><Printer size={16} /> Print</button>
                          <button type="button" className={buttonClass()} onClick={() => publish(exam)} disabled={saving || exam.status === "published"}><Send size={16} /> Publish</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="No final exams found" description="Create a final exam to begin." />
              )}
            </Panel>
          </div>
        </>
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </TeacherPageShell>
  );
}
