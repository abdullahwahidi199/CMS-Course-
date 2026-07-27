import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Check,
  GraduationCap,
  RotateCcw,
  Save,
  UserPlus,
} from "lucide-react";
import DataTable from "./shared/DataTable";
import PageHeader from "./shared/PageHeader";
import instance from "../api/axiosInstance";
import { formatApiError } from "../utils/apiErrors";
import { formatBatchLabel } from "../utils/batchLabel";

const emptyAdmission = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  guardian_name: "",
  parent_mobile_number: "",
  address: "",
  create_user: true,
  username: "",
  password: "",
  course: "",
  batch: "",
  enrollment_date: new Date().toISOString().slice(0, 10),
};

const steps = ["Profile", "Account", "Enrollment", "Review"];

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function inputClass() {
  return "w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-cyan-600";
}

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

export default function Admission() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState(emptyAdmission);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsResponse, coursesResponse, batchesResponse] =
        await Promise.all([
          instance.get("/students/"),
          instance.get("/courses/"),
          instance.get("/classes/"),
        ]);
      setStudents(normalizeList(studentsResponse.data));
      setCourses(normalizeList(coursesResponse.data));
      setBatches(normalizeList(batchesResponse.data));
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Could not load admission data.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredBatches = useMemo(
    () =>
      batches.filter(
        (batch) =>
          batch.is_active !== false &&
          !batch.is_archived &&
          (!form.course || String(batch.course) === String(form.course)),
      ),
    [batches, form.course],
  );

  const validateStep = () => {
    if (step === 0 && (!form.first_name.trim() || !form.last_name.trim()))
      return "First name and last name are required.";
    if (
      step === 1 &&
      form.create_user &&
      (!form.username.trim() || !form.password)
    )
      return "Username and password are required.";
    if (step === 2 && (!form.course || !form.batch))
      return "Course and batch are required.";
    return "";
  };

  const nextStep = () => {
    const validation = validateStep();
    if (validation) {
      setError(validation);
      return;
    }
    setError("");
    setStep((value) => Math.min(value + 1, steps.length - 1));
  };

  const submitAdmission = async (event) => {
    event.preventDefault();
    const validation = validateStep();
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await instance.post("/admissions/", {
        student: {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          guardian_name: form.guardian_name,
          parent_mobile_number: form.parent_mobile_number,
          address: form.address,
        },
        account: {
          create_user: form.create_user,
          username: form.username,
          password: form.password,
          email: form.email,
          phone: form.phone,
        },
        academic: {
          batch: form.batch,
          enrollment_date: form.enrollment_date,
          status: "active",
        },
      });
      setForm(emptyAdmission);
      setStep(0);
      setError("");
      setMessage(
        "Admission completed. Enrollment billing and current invoice were created automatically when a fee plan matched.",
      );
      await fetchData();
    } catch (err) {
      setError(formatApiError(err, "Could not complete admission."));
    } finally {
      setSaving(false);
    }
  };

  const lifecycle = async (student, action) => {
    await instance.post(`/students/${student.id}/${action}/`);
    setMessage(`Student ${action} complete.`);
    await fetchData();
  };

  const columns = useMemo(
    () => [
      {
        key: "student_number_display",
        label: "Student No",
        render: (row) => row.student_number_display || row.student_number,
      },
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      {
        key: "batch",
        label: "Current Batch",
        render: (row) => formatBatchLabel(row.current_enrollments?.[0]),
      },
      {
        key: "is_active",
        label: "Status",
        render: (row) => (row.is_active ? "Active" : "Inactive"),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admissions"
        description="Create student identity, account, enrollment, billing profile, and first invoice in one controlled workflow."
      />

      {message ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form
        className="rounded-md bg-white p-4 shadow-sm"
        onSubmit={submitAdmission}
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${index === step ? "bg-cyan-700 text-white" : "bg-gray-100 text-gray-700"}`}
              onClick={() => setStep(index)}
            >
              {index < step ? <Check size={15} /> : <GraduationCap size={15} />}
              {label}
            </button>
          ))}
        </div>

        {step === 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="First Name">
              <input
                className={inputClass()}
                value={form.first_name}
                onChange={(e) =>
                  setForm({ ...form, first_name: e.target.value })
                }
                required
              />
            </Field>
            <Field label="Last Name">
              <input
                className={inputClass()}
                value={form.last_name}
                onChange={(e) =>
                  setForm({ ...form, last_name: e.target.value })
                }
                required
              />
            </Field>
            <Field label="Email">
              <input
                className={inputClass()}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <input
                className={inputClass()}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="Guardian Name">
              <input
                className={inputClass()}
                value={form.guardian_name}
                onChange={(e) =>
                  setForm({ ...form, guardian_name: e.target.value })
                }
              />
            </Field>
            <Field label="Parent Mobile">
              <input
                className={inputClass()}
                value={form.parent_mobile_number}
                onChange={(e) =>
                  setForm({ ...form, parent_mobile_number: e.target.value })
                }
              />
            </Field>
            <Field label="Address">
              <input
                className={inputClass()}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Field>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={form.create_user}
                onChange={(e) =>
                  setForm({ ...form, create_user: e.target.checked })
                }
              />
              Create user account
            </label>
            {form.create_user ? (
              <>
                <Field label="Username">
                  <input
                    className={inputClass()}
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    required
                  />
                </Field>
                <Field label="Password">
                  <>
                    <input
                      className={inputClass()}
                      type="password"
                      minLength={6}
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">Use at least 6 characters.</p>
                  </>
                </Field>
              </>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Course">
              <select
                className={inputClass()}
                value={form.course}
                onChange={(e) =>
                  setForm({ ...form, course: e.target.value, batch: "" })
                }
                required
              >
                <option value="">Select course</option>
                {courses
                  .filter((course) => course.is_active !== false && !course.is_archived)
                  .map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Batch">
              <select
                className={inputClass()}
                value={form.batch}
                onChange={(e) => setForm({ ...form, batch: e.target.value })}
                required
              >
                <option value="">Select batch</option>
                {filteredBatches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {formatBatchLabel(batch)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Enrollment Date">
              <input
                className={inputClass()}
                type="date"
                value={form.enrollment_date}
                onChange={(e) =>
                  setForm({ ...form, enrollment_date: e.target.value })
                }
              />
            </Field>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-3 text-sm text-gray-700 md:grid-cols-2">
            <div>
              <span className="font-semibold">Student:</span> {form.first_name}{" "}
              {form.last_name}
            </div>
            <div>
              <span className="font-semibold">Account:</span>{" "}
              {form.create_user ? form.username : "Generated system account"}
            </div>
            <div>
              <span className="font-semibold">Course:</span>{" "}
              {courses.find(
                (course) => String(course.id) === String(form.course),
              )?.name || "-"}
            </div>
            <div>
              <span className="font-semibold">Batch:</span>{" "}
              {formatBatchLabel(
                batches.find((batch) => String(batch.id) === String(form.batch)),
              )}
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {step > 0 ? (
            <button
              type="button"
              className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
              onClick={() => setStep(step - 1)}
            >
              Back
            </button>
          ) : null}
          {step < steps.length - 1 ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white"
              onClick={nextStep}
            >
              <UserPlus size={16} /> Continue
            </button>
          ) : (
            <button
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Save size={16} /> Complete Admission
            </button>
          )}
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
            onClick={() => {
              setForm(emptyAdmission);
              setStep(0);
            }}
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </form>

      <DataTable
        title="Student Identities"
        columns={columns}
        rows={students}
        loading={loading}
        error={error}
        bulkActions={[
          {
            label: "Archive",
            onClick: (rows) =>
              Promise.all(rows.map((row) => lifecycle(row, "archive"))),
          },
          {
            label: "Restore",
            onClick: (rows) =>
              Promise.all(rows.map((row) => lifecycle(row, "restore"))),
          },
        ]}
        actions={(row) => [
          {
            label: "Archive",
            icon: Archive,
            onClick: () => lifecycle(row, "archive"),
          },
          { label: "Restore", onClick: () => lifecycle(row, "restore") },
          { label: "Deactivate", onClick: () => lifecycle(row, "deactivate") },
        ]}
      />
    </div>
  );
}
