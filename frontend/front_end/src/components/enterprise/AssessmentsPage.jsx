import { useEffect, useMemo, useState } from "react";
import { FileDown, FileUp, Save, Send } from "lucide-react";
import DataTable from "../shared/DataTable";
import PageHeader from "../shared/PageHeader";
import StatCard from "../shared/StatCard";
import { apiCreate, apiDelete, apiGet, apiPost, apiUpdate, useApiResource } from "../../hooks/useApiResource";

const emptyForm = {
  course: "",
  batch: "",
  teacher: "",
  title: "",
  description: "",
  assessment_type: "quiz",
  maximum_marks: "100",
  passing_marks: "50",
  assessment_date: new Date().toISOString().slice(0, 10),
  status: "draft",
};

const assessmentTypes = ["quiz", "homework", "assignment", "midterm", "final_exam", "oral_exam", "practical_exam", "monthly_test", "surprise_test", "custom"];
const statuses = ["draft", "scheduled", "published", "closed", "archived"];

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function inputClass() {
  return "w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-cyan-600";
}

export default function AssessmentsPage() {
  const assessments = useApiResource("/v1/assessments/");
  const classes = useApiResource("/classes/");
  const teachers = useApiResource("/teachers/");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const activeAssessment = useMemo(
    () => assessments.results.find((item) => item.id === selectedAssessment?.id) || selectedAssessment,
    [assessments.results, selectedAssessment],
  );

  useEffect(() => {
    async function loadStudents() {
      if (!activeAssessment?.batch) {
        setStudents([]);
        return;
      }
      const data = await apiGet(`/students/by-class/${activeAssessment.batch}/`);
      setStudents(Array.isArray(data) ? data : data.results || []);
    }
    loadStudents();
  }, [activeAssessment?.batch]);

  useEffect(() => {
    if (!activeAssessment) return;
    const nextMarks = {};
    activeAssessment.results?.forEach((result) => {
      nextMarks[result.student] = { marks_obtained: result.marks_obtained, remarks: result.remarks || "" };
    });
    setMarks(nextMarks);
  }, [activeAssessment]);

  const stats = useMemo(() => {
    const published = assessments.results.filter((item) => item.status === "published").length;
    const pending = assessments.results.filter((item) => ["draft", "scheduled"].includes(item.status)).length;
    const graded = assessments.results.reduce((total, item) => total + (item.results?.length || 0), 0);
    const percentages = assessments.results.flatMap((item) => item.results?.map((result) => Number(result.percentage || 0)) || []);
    const average = percentages.length ? percentages.reduce((total, value) => total + value, 0) / percentages.length : 0;
    return { published, pending, graded, average };
  }, [assessments.results]);

  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError("");
  };

  const validate = () => {
    if (!form.batch || !form.teacher || !form.title.trim()) return "Batch, teacher, and title are required.";
    if (Number(form.maximum_marks) <= 0) return "Maximum marks must be greater than zero.";
    if (Number(form.passing_marks) < 0 || Number(form.passing_marks) > Number(form.maximum_marks)) return "Passing marks must be between zero and maximum marks.";
    return "";
  };

  const saveAssessment = async (event) => {
    event.preventDefault();
    const error = validate();
    if (error) {
      setFormError(error);
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await apiUpdate(`/v1/assessments/${editingId}/`, form);
        setMessage("Assessment updated.");
      } else {
        await apiCreate("/v1/assessments/", form);
        setMessage("Assessment created.");
      }
      resetForm();
      await assessments.refetch();
    } catch (error) {
      setFormError(error.response?.data ? JSON.stringify(error.response.data) : "Could not save assessment.");
    } finally {
      setSaving(false);
    }
  };

  const editAssessment = (assessment) => {
    setEditingId(assessment.id);
    setForm({ ...emptyForm, ...assessment, course: assessment.course || "", batch: assessment.batch || "", teacher: assessment.teacher || "" });
  };

  const runAssessmentAction = async (assessment, action, success) => {
    await apiPost(`/v1/assessments/${assessment.id}/${action}/`);
    setMessage(success);
    await assessments.refetch();
  };

  const removeAssessment = async (assessment) => {
    if (!window.confirm(`Delete ${assessment.title}?`)) return;
    await apiDelete(`/v1/assessments/${assessment.id}/`);
    setMessage("Assessment deleted.");
    await assessments.refetch();
  };

  const saveMarks = async () => {
    if (!activeAssessment) return;
    const rows = students
      .filter((student) => marks[student.id]?.marks_obtained !== undefined && marks[student.id]?.marks_obtained !== "")
      .map((student) => {
        const enrollment = student.current_enrollments?.find((item) => Number(item.batch) === Number(activeAssessment.batch));
        return { enrollment: enrollment?.id, ...marks[student.id] };
      })
      .filter((row) => row.enrollment);
    if (!rows.length) {
      setFormError("Enter at least one mark before saving.");
      return;
    }
    await apiPost(`/v1/assessments/${activeAssessment.id}/bulk-results/`, { results: rows });
    setMessage("Marks saved and rankings recalculated.");
    await assessments.refetch();
  };

  const importMarks = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const next = { ...marks };
      String(reader.result)
        .split(/\r?\n/)
        .slice(1)
        .forEach((line) => {
          const [studentId, mark, remarks = ""] = line.split(",");
          if (studentId && mark) next[Number(studentId)] = { marks_obtained: mark.trim(), remarks: remarks.trim() };
        });
      setMarks(next);
      setMessage("Marks imported.");
    };
    reader.readAsText(file);
  };

  const resultRows = useMemo(() => {
    const rows = activeAssessment?.results || [];
    return [...rows].sort((a, b) => Number(b.percentage) - Number(a.percentage)).map((row, index) => ({ ...row, rank: index + 1 }));
  }, [activeAssessment]);

  const columns = [
    { key: "title", label: "Title" },
    { key: "batch_name", label: "Batch" },
    { key: "teacher_name", label: "Teacher" },
    { key: "assessment_type", label: "Type" },
    { key: "assessment_date", label: "Date" },
    { key: "status", label: "Status" },
    { key: "maximum_marks", label: "Max" },
  ];

  const resultColumns = [
    { key: "rank", label: "Rank" },
    { key: "student_name", label: "Student" },
    { key: "marks_obtained", label: "Marks" },
    { key: "percentage", label: "Percent" },
    { key: "grade", label: "Grade" },
    { key: "is_passed", label: "Result", render: (row) => (row.is_passed ? "Pass" : "Fail") },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Assessments" description="Create exams, enter marks, publish results, and track performance." />
      {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}
      {formError ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Published Exams" value={stats.published} accent="border-emerald-500" />
        <StatCard title="Pending Grading" value={stats.pending} accent="border-amber-500" />
        <StatCard title="Saved Results" value={stats.graded} accent="border-cyan-600" />
        <StatCard title="Average Score" value={`${stats.average.toFixed(1)}%`} accent="border-violet-500" />
      </div>

      <form className="rounded-md bg-white p-4 shadow-sm" onSubmit={saveAssessment}>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Batch">
            <select className={inputClass()} value={form.batch} onChange={(event) => {
              const batch = classes.results.find((item) => Number(item.id) === Number(event.target.value));
              setForm((current) => ({ ...current, batch: event.target.value, course: batch?.course || "" }));
            }}>
              <option value="">Select batch</option>
              {classes.results.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </Field>
          <Field label="Teacher">
            <select className={inputClass()} value={form.teacher} onChange={(event) => setValue("teacher", event.target.value)}>
              <option value="">Select teacher</option>
              {teachers.results.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}
            </select>
          </Field>
          <Field label="Title">
            <input className={inputClass()} value={form.title} onChange={(event) => setValue("title", event.target.value)} />
          </Field>
          <Field label="Type">
            <select className={inputClass()} value={form.assessment_type} onChange={(event) => setValue("assessment_type", event.target.value)}>
              {assessmentTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}
            </select>
          </Field>
          <Field label="Assessment Date">
            <input type="date" className={inputClass()} value={form.assessment_date} onChange={(event) => setValue("assessment_date", event.target.value)} />
          </Field>
          <Field label="Maximum Marks">
            <input type="number" min="1" className={inputClass()} value={form.maximum_marks} onChange={(event) => setValue("maximum_marks", event.target.value)} />
          </Field>
          <Field label="Passing Marks">
            <input type="number" min="0" className={inputClass()} value={form.passing_marks} onChange={(event) => setValue("passing_marks", event.target.value)} />
          </Field>
          <Field label="Status">
            <select className={inputClass()} value={form.status} onChange={(event) => setValue("status", event.target.value)}>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Description">
          <textarea className={`${inputClass()} mt-1`} rows="2" value={form.description} onChange={(event) => setValue("description", event.target.value)} />
        </Field>
        <div className="mt-4 flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={saving}>
            <Save size={16} /> {editingId ? "Update" : "Create"}
          </button>
          <button type="button" className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700" onClick={resetForm}>Reset</button>
        </div>
      </form>

      <DataTable
        title="Assessment Register"
        columns={columns}
        rows={assessments.results}
        loading={assessments.loading}
        error={assessments.error}
        bulkActions={[{ label: "Archive", onClick: (rows) => Promise.all(rows.map((row) => runAssessmentAction(row, "archive", "Assessments archived."))) }]}
        actions={(row) => [
          { label: "Details", onClick: () => setSelectedAssessment(row) },
          { label: "Edit", onClick: () => editAssessment(row) },
          { label: "Duplicate", onClick: () => runAssessmentAction(row, "duplicate", "Assessment duplicated.") },
          { label: "Publish", onClick: () => runAssessmentAction(row, "publish", "Assessment published.") },
          { label: "Close", onClick: () => runAssessmentAction(row, "close", "Assessment closed.") },
          { label: "Delete", onClick: () => removeAssessment(row) },
        ]}
      />

      {activeAssessment ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <section className="rounded-md bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900">{activeAssessment.title} Marks</h3>
                <p className="text-sm text-gray-500">{students.length} students loaded from {activeAssessment.course_name}</p>
              </div>
              <div className="flex gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
                  <FileUp size={16} /> Import
                  <input type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={(event) => importMarks(event.target.files?.[0])} />
                </label>
                <button className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white" onClick={saveMarks}>
                  <Send size={16} /> Save Marks
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50">
                  <tr><th className="px-3 py-2 text-left">Student</th><th className="px-3 py-2 text-left">Marks</th><th className="px-3 py-2 text-left">Remarks</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="px-3 py-2">{student.name}</td>
                      <td className="px-3 py-2">
                        <input className={inputClass()} type="number" min="0" max={activeAssessment.maximum_marks} value={marks[student.id]?.marks_obtained || ""} onChange={(event) => setMarks((current) => ({ ...current, [student.id]: { ...current[student.id], marks_obtained: event.target.value } }))} />
                      </td>
                      <td className="px-3 py-2">
                        <input className={inputClass()} value={marks[student.id]?.remarks || ""} onChange={(event) => setMarks((current) => ({ ...current, [student.id]: { ...current[student.id], remarks: event.target.value } }))} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <DataTable title="Report Cards" columns={resultColumns} rows={resultRows} loading={false} empty="No marks saved yet" />
            <button className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700" onClick={() => window.print()}>
              <FileDown size={16} /> Print Report Cards
            </button>
          </section>
        </div>
      ) : null}
    </div>
  );
}
