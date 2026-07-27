import { useEffect, useMemo, useState } from "react";
import { Award, BarChart3, ClipboardCheck, Plus, Save, Send } from "lucide-react";
import instance from "../../../api/axiosInstance";
import { formatApiError } from "../../../utils/apiErrors";
import { formatBatchLabel } from "../../../utils/batchLabel";
import TeacherPageShell from "./TeacherPageShell";
import { EmptyState, ErrorState, LoadingSkeleton, Panel, SearchBox, StatTile, Toast } from "./TeacherUi";
import { buttonClass, formatDate, inputClass, normalizeList, statusBadge, todayValue } from "./teacherUtils.jsx";

const emptyAssessment = {
  title: "",
  description: "",
  assessment_type: "quiz",
  batch: "",
  maximum_marks: 100,
  passing_marks: 50,
  assessment_date: todayValue(),
  status: "draft",
};

const assessmentTypes = [
  ["quiz", "Quiz"],
  ["assignment", "Assignment"],
  ["midterm", "Midterm"],
  ["final_exam", "Final Exam"],
  ["monthly_test", "Monthly Test"],
  ["practical_exam", "Practical Exam"],
  ["custom", "Custom"],
];

function average(results = []) {
  if (!results.length) return 0;
  return results.reduce((sum, row) => sum + Number(row.percentage || 0), 0) / results.length;
}

export default function TeacherAssessmentsPage() {
  const [profile, setProfile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [marks, setMarks] = useState({});
  const [form, setForm] = useState(emptyAssessment);
  const [filters, setFilters] = useState({ search: "", type: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [profileRes, classRes, assessmentRes] = await Promise.all([
        instance.get("/teacher/profile/"),
        instance.get("/classes/"),
        instance.get("/v1/assessments/"),
      ]);
      const classRows = normalizeList(classRes.data);
      setProfile(profileRes.data);
      setClasses(classRows);
      setAssessments(normalizeList(assessmentRes.data));
      setForm((current) => ({ ...current, batch: current.batch || String(classRows[0]?.id || "") }));
    } catch (err) {
      setError(formatApiError(err, "Could not load assessments."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return assessments.filter((item) => {
      const matchesSearch = !term || [item.title, item.batch_name, item.course_name].join(" ").toLowerCase().includes(term);
      const matchesType = !filters.type || item.assessment_type === filters.type;
      const matchesStatus = !filters.status || item.status === filters.status;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [assessments, filters]);

  const openAssessment = async (assessment) => {
    setSelected(assessment);
    setError("");
    try {
      const classRes = await instance.get(`/classes/${assessment.batch}/`);
      const classEnrollments = classRes.data.enrollments || [];
      const existing = {};
      (assessment.results || []).forEach((result) => {
        existing[result.enrollment] = { marks_obtained: result.marks_obtained, remarks: result.remarks || "" };
      });
      setEnrollments(classEnrollments);
      setMarks(existing);
    } catch (err) {
      setError(formatApiError(err, "Could not load assessment roster."));
    }
  };

  const createAssessment = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const batch = classes.find((item) => String(item.id) === String(form.batch));
      await instance.post("/v1/assessments/", {
        ...form,
        batch: Number(form.batch),
        course: batch?.course || null,
        teacher: profile.id,
        maximum_marks: Number(form.maximum_marks),
        passing_marks: Number(form.passing_marks),
      });
      setForm({ ...emptyAssessment, batch: form.batch });
      setToast({ message: "Assessment created." });
      await load();
    } catch (err) {
      setError(formatApiError(err, "Could not create assessment."));
    } finally {
      setSaving(false);
    }
  };

  const saveMarks = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const payload = enrollments
        .map((enrollment) => ({
          enrollment: enrollment.id,
          marks_obtained: marks[enrollment.id]?.marks_obtained,
          remarks: marks[enrollment.id]?.remarks || "",
        }))
        .filter((row) => row.marks_obtained !== undefined && row.marks_obtained !== "");
      await instance.post(`/v1/assessments/${selected.id}/bulk-results/`, { results: payload });
      setToast({ message: "Marks saved with percentages, grades, and pass/fail status." });
      await load();
      const refreshed = await instance.get(`/v1/assessments/${selected.id}/`);
      await openAssessment(refreshed.data);
    } catch (err) {
      setError(formatApiError(err, "Could not save marks."));
    } finally {
      setSaving(false);
    }
  };

  const publish = async (assessment) => {
    setSaving(true);
    setError("");
    try {
      await instance.post(`/v1/assessments/${assessment.id}/publish/`);
      setToast({ message: "Results published." });
      await load();
    } catch (err) {
      setError(formatApiError(err, "Could not publish assessment."));
    } finally {
      setSaving(false);
    }
  };

  const rankings = [...(selected?.results || [])].sort((a, b) => Number(b.percentage) - Number(a.percentage));

  return (
    <TeacherPageShell title="Assessments & Grades" description="Create quizzes, assignments, and exams, enter marks, calculate grades, and publish results.">
      <ErrorState message={error} />
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile icon={ClipboardCheck} label="Assessments" value={assessments.length} helper="Created by you" />
            <StatTile icon={Award} label="Published" value={assessments.filter((item) => item.status === "published").length} helper="Visible results" tone="emerald" />
            <StatTile icon={BarChart3} label="Class Average" value={`${average(assessments.flatMap((item) => item.results || [])).toFixed(1)}%`} helper="Across marked work" tone="amber" />
            <StatTile icon={Plus} label="Final Exams" value={assessments.filter((item) => item.assessment_type === "final_exam").length} helper="Exam feature via assessments" tone="violet" />
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
            <Panel title="Create Assessment" description="Use Final Exam type for exam management.">
              <form onSubmit={createAssessment} className="grid gap-3">
                <input required className={inputClass()} placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
                <textarea className={inputClass()} rows={3} placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select required className={inputClass()} value={form.batch} onChange={(event) => setForm({ ...form, batch: event.target.value })}>
                    {classes.map((item) => <option key={item.id} value={item.id}>{formatBatchLabel(item)}</option>)}
                  </select>
                  <select className={inputClass()} value={form.assessment_type} onChange={(event) => setForm({ ...form, assessment_type: event.target.value })}>
                    {assessmentTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <input type="date" className={inputClass()} value={form.assessment_date} onChange={(event) => setForm({ ...form, assessment_date: event.target.value })} />
                  <select className={inputClass()} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                  <input type="number" min="1" className={inputClass()} value={form.maximum_marks} onChange={(event) => setForm({ ...form, maximum_marks: event.target.value })} placeholder="Maximum marks" />
                  <input type="number" min="0" className={inputClass()} value={form.passing_marks} onChange={(event) => setForm({ ...form, passing_marks: event.target.value })} placeholder="Passing marks" />
                </div>
                <button className={buttonClass()} disabled={saving}><Plus size={16} /> Create Assessment</button>
              </form>
            </Panel>

            <Panel title="Assessment List" description="Search, grade, and publish results.">
              <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_180px]">
                <SearchBox value={filters.search} onChange={(search) => setFilters({ ...filters, search })} placeholder="Search assessments" />
                <select className={inputClass()} value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
                  <option value="">All types</option>
                  {assessmentTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
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
                  {visible.map((item) => (
                    <article key={item.id} className="rounded-md border border-slate-200 p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-950">{item.title}</p>
                          <p className="text-sm text-slate-500">{formatBatchLabel(item)} / {item.assessment_type} / {formatDate(item.assessment_date)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {statusBadge(item.status)}
                          <button type="button" className={buttonClass("secondary")} onClick={() => openAssessment(item)}>Grade</button>
                          <button type="button" className={buttonClass()} onClick={() => publish(item)} disabled={saving || item.status === "published"}><Send size={16} /> Publish</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="No assessments found" description="Create an assessment or adjust filters." />
              )}
            </Panel>
          </div>

          <Panel title={selected ? `Grade: ${selected.title}` : "Gradebook"} description={selected ? `${formatBatchLabel(selected)} / Maximum ${selected.maximum_marks} / Passing ${selected.passing_marks}` : "Select an assessment to enter marks."}>
            {selected ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                        <th className="px-3 py-3">Student</th>
                        <th className="px-3 py-3">Marks</th>
                        <th className="px-3 py-3">Remarks</th>
                        <th className="px-3 py-3">Current Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {enrollments.map((enrollment) => {
                        const existing = (selected.results || []).find((result) => result.enrollment === enrollment.id);
                        return (
                          <tr key={enrollment.id}>
                            <td className="px-3 py-3 font-semibold text-slate-950">{enrollment.student_name}</td>
                            <td className="px-3 py-3">
                              <input type="number" min="0" max={selected.maximum_marks} className={inputClass()} value={marks[enrollment.id]?.marks_obtained ?? existing?.marks_obtained ?? ""} onChange={(event) => setMarks({ ...marks, [enrollment.id]: { ...marks[enrollment.id], marks_obtained: event.target.value } })} />
                            </td>
                            <td className="px-3 py-3">
                              <input className={inputClass()} value={marks[enrollment.id]?.remarks ?? existing?.remarks ?? ""} onChange={(event) => setMarks({ ...marks, [enrollment.id]: { ...marks[enrollment.id], remarks: event.target.value } })} />
                            </td>
                            <td className="px-3 py-3 text-slate-600">{existing ? `${existing.percentage}% / ${existing.grade} / ${existing.is_passed ? "Pass" : "Fail"}` : "Not marked"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <button type="button" className={`${buttonClass()} mt-4`} onClick={saveMarks} disabled={saving}><Save size={16} /> Save Marks</button>
              </>
            ) : (
              <EmptyState title="No assessment selected" description="Choose Grade from an assessment in the list." />
            )}
          </Panel>

          {selected ? (
            <Panel title="Rankings" description="Sorted by percentage when results are available.">
              {rankings.length ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {rankings.map((result, index) => (
                    <div key={result.id} className="rounded-md border border-slate-200 p-3">
                      <p className="text-xs font-semibold text-cyan-700">Rank {index + 1}</p>
                      <p className="mt-1 font-semibold text-slate-950">{result.student_name}</p>
                      <p className="text-sm text-slate-500">{result.percentage}% / {result.grade} / {result.is_passed ? "Pass" : "Fail"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No rankings yet" description="Rankings appear after marks are saved." />
              )}
            </Panel>
          ) : null}
        </>
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </TeacherPageShell>
  );
}
