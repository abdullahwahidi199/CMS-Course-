import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowUpCircle,
  Eye,
  Filter,
  Pencil,
  RefreshCcw,
  RotateCcw,
  Save,
  UserPlus,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import DataTable from "../shared/DataTable";
import PageHeader from "../shared/PageHeader";
import CalendarDatePicker from "../shared/CalendarDatePicker";
import instance from "../../api/axiosInstance";
import { formatApiError } from "../../utils/apiErrors";
import { formatBatchLabel } from "../../utils/batchLabel";

const emptyDetail = {
  student: null,
  invoices: [],
  payments: [],
  ledger: [],
  assessmentResults: [],
  submissions: [],
  promotions: [],
};

const today = () => new Date().toISOString().slice(0, 10);

const defaultFilters = {
  batch: "",
  course: "",
  enrollment_start: "",
  enrollment_end: "",
  status: "all",
  archived: "active",
  payment_status: "all",
  remaining_fee: "all",
  min_outstanding: "",
  max_outstanding: "",
};

function normalizeList(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

function filterParams(filters) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== "" && value !== "all",
    ),
  );
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function currentEnrollment(student) {
  return student?.current_enrollments?.[0] || null;
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

function Panel({ title, children }) {
  return (
    <section className="rounded-md border border-gray-100 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">{title}</h3>
      {children}
    </section>
  );
}

function MiniTable({ columns, rows, empty = "No records." }) {
  if (!rows?.length) return <p className="text-sm text-gray-500">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-3 py-2 text-left font-semibold text-gray-600"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, index) => (
            <tr
              key={row.id || row.invoice_number || row.receipt_number || index}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="whitespace-nowrap px-3 py-2 text-gray-700"
                >
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StudentDetailsDrawer({ detail, loading, error, onClose }) {
  const student = detail.student;
  const enrollments = [
    ...(student?.current_enrollments || []),
    ...(student?.previous_enrollments || []),
  ];
  const totalCharges = detail.invoices.reduce(
    (total, row) => total + Number(row.final_amount || 0),
    0,
  );
  const totalPaid = detail.invoices.reduce(
    (total, row) => total + Number(row.paid_amount || 0),
    0,
  );
  const totalDiscounts = detail.invoices.reduce(
    (total, row) => total + Number(row.discount || 0),
    0,
  );
  const outstanding = detail.invoices.reduce(
    (total, row) => total + Number(row.balance || 0),
    0,
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/40">
      <div className="h-full w-full max-w-6xl overflow-auto bg-gray-50 p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {student?.name || "Student Details"}
            </h2>
            <p className="text-sm text-gray-500">
              {student?.student_number_display ||
                student?.student_number ||
                "-"}{" "}
              · {student?.role_number || "-"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700"
          >
            Close
          </button>
        </div>

        {loading ? (
          <div className="rounded-md bg-white p-5 text-sm text-gray-500">
            Loading details...
          </div>
        ) : null}
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {student && !loading ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Panel title="Profile">
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Name:</span> {student.name}
                  </p>
                  <p>
                    <span className="font-medium">Guardian:</span>{" "}
                    {student.f_name || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Mobile:</span>{" "}
                    {student.parent_mobile_number || student.phone || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Address:</span>{" "}
                    {student.address || "-"}
                  </p>
                </div>
              </Panel>
              <Panel title="Current Class">
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Course:</span>{" "}
                    {student.current_enrollments?.[0]?.course_name || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Batch:</span>{" "}
                    {formatBatchLabel(student.current_enrollments?.[0])}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    {student.current_enrollments?.[0]?.status ||
                      "No active enrollment"}
                  </p>
                </div>
              </Panel>
              <Panel title="Billing">
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Charges:</span>{" "}
                    {money(totalCharges)}
                  </p>
                  <p>
                    <span className="font-medium">Discounts:</span>{" "}
                    {money(totalDiscounts)}
                  </p>
                  <p>
                    <span className="font-medium">Paid:</span>{" "}
                    {money(totalPaid)}
                  </p>
                  <p>
                    <span className="font-medium">Outstanding:</span>{" "}
                    {money(outstanding)}
                  </p>
                </div>
              </Panel>
              <Panel title="Academics">
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Attendance:</span>{" "}
                    {student.attendances?.filter((row) => row.is_present)
                      .length || 0}
                    /{student.attendances?.length || 0}
                  </p>
                  <p>
                    <span className="font-medium">Marks:</span>{" "}
                    {student.marks?.length || 0}
                  </p>
                  <p>
                    <span className="font-medium">Assessments:</span>{" "}
                    {detail.assessmentResults.length}
                  </p>
                </div>
              </Panel>
            </div>

            <Panel title="Enrollments / Classes / Batches">
              <MiniTable
                rows={enrollments}
                columns={[
                  { key: "course_name", label: "Course" },
                  {
                    key: "batch_name",
                    label: "Batch",
                    render: (row) => formatBatchLabel(row),
                  },
                  { key: "enrollment_date", label: "Enrollment Date" },
                  { key: "completed_date", label: "Completed" },
                  { key: "status", label: "Status" },
                ]}
              />
            </Panel>

            <div className="grid gap-4 xl:grid-cols-2">
              <Panel title="Invoices / Fees">
                <MiniTable
                  rows={detail.invoices}
                  columns={[
                    { key: "invoice_number", label: "Invoice" },
                    { key: "enrollment_label", label: "Class" },
                    {
                      key: "period",
                      label: "Period",
                      render: (row) =>
                        `${row.billing_month || row.month}/${row.billing_year || row.year}`,
                    },
                    {
                      key: "final_amount",
                      label: "Amount",
                      render: (row) => money(row.final_amount),
                    },
                    {
                      key: "discount",
                      label: "Discount",
                      render: (row) => money(row.discount),
                    },
                    {
                      key: "paid_amount",
                      label: "Paid",
                      render: (row) => money(row.paid_amount),
                    },
                    {
                      key: "balance",
                      label: "Balance",
                      render: (row) => money(row.balance),
                    },
                    { key: "status", label: "Status" },
                  ]}
                />
              </Panel>

              <Panel title="Payments">
                <MiniTable
                  rows={detail.payments}
                  columns={[
                    { key: "receipt_number", label: "Receipt" },
                    { key: "invoice_number", label: "Invoice" },
                    { key: "payment_date", label: "Date" },
                    { key: "payment_method", label: "Method" },
                    {
                      key: "amount_paid",
                      label: "Amount",
                      render: (row) => money(row.amount_paid),
                    },
                  ]}
                />
              </Panel>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Panel title="Marks">
                <MiniTable
                  rows={student.marks || []}
                  columns={[
                    { key: "className", label: "Class" },
                    { key: "exam_type", label: "Exam" },
                    { key: "marks_obtained", label: "Marks" },
                    { key: "total_marks", label: "Total" },
                    { key: "status", label: "Status" },
                  ]}
                />
              </Panel>

              <Panel title="Assessment Results">
                <MiniTable
                  rows={detail.assessmentResults}
                  columns={[
                    { key: "assessment_title", label: "Assessment" },
                    { key: "course_name", label: "Course" },
                    {
                      key: "batch_name",
                      label: "Batch",
                      render: (row) => formatBatchLabel(row),
                    },
                    { key: "marks_obtained", label: "Marks" },
                    { key: "percentage", label: "%" },
                    { key: "grade", label: "Grade" },
                  ]}
                />
              </Panel>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Panel title="Attendance">
                <MiniTable
                  rows={student.attendances || []}
                  columns={[
                    { key: "date", label: "Date" },
                    { key: "class_fk", label: "Class ID" },
                    {
                      key: "is_present",
                      label: "Present",
                      render: (row) => (row.is_present ? "Yes" : "No"),
                    },
                  ]}
                />
              </Panel>

              <Panel title="Ledger">
                <MiniTable
                  rows={detail.ledger}
                  columns={[
                    { key: "transaction_date", label: "Date" },
                    { key: "transaction_type", label: "Type" },
                    { key: "reference_number", label: "Reference" },
                    {
                      key: "debit",
                      label: "Debit",
                      render: (row) => money(row.debit),
                    },
                    {
                      key: "credit",
                      label: "Credit",
                      render: (row) => money(row.credit),
                    },
                    {
                      key: "balance",
                      label: "Balance",
                      render: (row) => money(row.balance),
                    },
                  ]}
                />
              </Panel>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Panel title="Assignments / Submissions">
                <MiniTable
                  rows={detail.submissions}
                  columns={[
                    { key: "assignment", label: "Assignment ID" },
                    { key: "status", label: "Status" },
                    { key: "marks_obtained", label: "Marks" },
                    { key: "submitted_at", label: "Submitted" },
                  ]}
                />
              </Panel>

              <Panel title="Promotion History">
                <MiniTable
                  rows={detail.promotions}
                  columns={[
                    { key: "promotion_date", label: "Date" },
                    { key: "old_class_name", label: "Old Class" },
                    { key: "new_class_name", label: "New Class" },
                    { key: "promoted_by_username", label: "By" },
                    { key: "remarks", label: "Remarks" },
                  ]}
                />
              </Panel>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EditStudentModal({ student, onClose, onSaved }) {
  const [form, setForm] = useState({
    first_name: student.first_name || student.name?.split(" ")?.[0] || "",
    last_name:
      student.last_name || student.name?.split(" ")?.slice(1).join(" ") || "",
    email: student.email || "",
    phone: student.phone || "",
    f_name: student.f_name || "",
    parent_mobile_number: student.parent_mobile_number || "",
    address: student.address || "",
    is_active: student.is_active,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await instance.patch(`/students/${student.id}/`, form);
      await onSaved();
      onClose();
    } catch (err) {
      setError(formatApiError(err, "Could not update student."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-2xl rounded-md bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Edit Student</h2>
          <button type="button" onClick={onClose} className="text-gray-500">
            <XCircle size={20} />
          </button>
        </div>
        {error ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="First Name">
            <input
              className={inputClass()}
              value={form.first_name}
              onChange={(event) =>
                setForm({ ...form, first_name: event.target.value })
              }
            />
          </Field>
          <Field label="Last Name">
            <input
              className={inputClass()}
              value={form.last_name}
              onChange={(event) =>
                setForm({ ...form, last_name: event.target.value })
              }
            />
          </Field>
          <Field label="Email">
            <input
              className={inputClass()}
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
            />
          </Field>
          <Field label="Phone">
            <input
              className={inputClass()}
              value={form.phone}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
            />
          </Field>
          <Field label="Guardian">
            <input
              className={inputClass()}
              value={form.f_name}
              onChange={(event) =>
                setForm({ ...form, f_name: event.target.value })
              }
            />
          </Field>
          <Field label="Parent Mobile">
            <input
              className={inputClass()}
              value={form.parent_mobile_number}
              onChange={(event) =>
                setForm({ ...form, parent_mobile_number: event.target.value })
              }
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Address">
              <input
                className={inputClass()}
                value={form.address}
                onChange={(event) =>
                  setForm({ ...form, address: event.target.value })
                }
              />
            </Field>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Save size={16} /> Save
          </button>
        </div>
      </form>
    </div>
  );
}

function PromoteStudentModal({
  students,
  batches,
  onClose,
  onPromote,
  promoting,
  error,
}) {
  const [form, setForm] = useState({
    new_batch: "",
    promotion_date: today(),
    remarks: "",
  });
  const selectedStudents = students || [];
  const firstEnrollment = currentEnrollment(selectedStudents[0]);
  const availableBatches = batches.filter(
    (batch) =>
      batch.is_active !== false &&
      (selectedStudents.length !== 1 ||
        String(batch.id) !== String(firstEnrollment?.batch)),
  );

  const submit = (event) => {
    event.preventDefault();
    onPromote(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-2xl rounded-md bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedStudents.length > 1
                ? `Promote ${selectedStudents.length} Students`
                : "Promote Student"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {selectedStudents.length > 1
                ? "Selected students will be moved to the same target batch."
                : selectedStudents[0]?.name || "Select the target batch."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-500">
            <XCircle size={20} />
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Current Batch">
            <input
              readOnly
              value={
                selectedStudents.length === 1
                  ? formatBatchLabel(firstEnrollment, "No active batch")
                  : "Multiple selected"
              }
              className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            />
          </Field>

          <Field label="New Batch">
            <select
              required
              value={form.new_batch}
              onChange={(event) =>
                setForm({ ...form, new_batch: event.target.value })
              }
              className={inputClass()}
            >
              <option value="">Select batch</option>
              {availableBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {formatBatchLabel(batch)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Promotion Date">
            <CalendarDatePicker
              required
              module="students"
              value={form.promotion_date}
              onChange={(value) => setForm({ ...form, promotion_date: value })}
              className={inputClass()}
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Remarks">
              <textarea
                value={form.remarks}
                onChange={(event) =>
                  setForm({ ...form, remarks: event.target.value })
                }
                rows={3}
                className={inputClass()}
              />
            </Field>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
          >
            Cancel
          </button>
          <button
            disabled={promoting}
            className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            <ArrowUpCircle size={16} />
            {promoting ? "Promoting..." : "Promote"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function StudentManagementPage() {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(null);
  const [promotingStudents, setPromotingStudents] = useState([]);
  const [promoting, setPromoting] = useState(false);
  const [promotionError, setPromotionError] = useState("");
  const [filters, setFilters] = useState(defaultFilters);
  const [detail, setDetail] = useState(emptyDetail);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const fetchStudents = useCallback(
    async (activeFilters = filters) => {
      setLoading(true);
      setError("");
      try {
        const [studentsRes, batchesRes] = await Promise.all([
          instance.get("/students/", { params: filterParams(activeFilters) }),
          instance.get("/classes/", { params: { summary: 1 } }).catch(() => ({ data: [] })),
        ]);
        setStudents(normalizeList(studentsRes.data));
        setBatches(normalizeList(batchesRes.data));
      } catch (err) {
        setError(
          err.response?.data?.detail ||
            err.message ||
            "Could not load students.",
        );
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    fetchStudents(filters);
  }, [fetchStudents, filters]);

  const lifecycle = async (student, action) => {
    setMessage("");
    await instance.post(`/students/${student.id}/${action}/`);
    setMessage(`Student ${action} complete.`);
    await fetchStudents();
  };

  const openPromotion = (rows) => {
    setPromotionError("");
    setMessage("");
    setPromotingStudents(Array.isArray(rows) ? rows : [rows]);
  };

  const handlePromote = async (form) => {
    setPromotionError("");
    setMessage("");
    if (!form.new_batch) {
      setPromotionError("Select the new batch.");
      return;
    }
    if (!promotingStudents.length) {
      setPromotionError("Select at least one student to promote.");
      return;
    }

    setPromoting(true);
    const failed = [];
    let promotedCount = 0;

    for (const student of promotingStudents) {
      try {
        await instance.post("/promotions/", {
          student: Number(student.id),
          new_batch: Number(form.new_batch),
          promotion_date: form.promotion_date,
          remarks: form.remarks,
        });
        promotedCount += 1;
      } catch (reason) {
        failed.push({ reason, student });
      }
    }

    setPromoting(false);

    if (failed.length) {
      setPromotionError(
        failed
          .map(({ reason, student }) => {
            const detail = reason?.response?.data?.detail;
            return `${student.name}: ${
              detail ? formatApiError({ response: { data: detail } }) : "Could not promote student."
            }`;
          })
          .join(" "),
      );
      if (failed.length === promotingStudents.length) return;
    }

    setMessage(
      `${promotedCount} student${promotedCount === 1 ? "" : "s"} promoted successfully.`,
    );
    setPromotingStudents(failed.map(({ student }) => student));
    await fetchStudents();
  };

  const openDetails = async (student) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsError("");
    setDetail({ ...emptyDetail, student });
    try {
      const [
        studentRes,
        invoicesRes,
        paymentsRes,
        ledgerRes,
        resultsRes,
        submissionsRes,
        promotionsRes,
      ] = await Promise.all([
        instance.get(`/students/${student.id}/`),
        instance.get("/v1/invoices/", { params: { student: student.id } }),
        instance.get("/v1/payments/"),
        instance.get("/v1/student-ledger/", {
          params: { student: student.id },
        }),
        instance.get("/v1/assessment-results/", {
          params: { student: student.id },
        }),
        instance.get("/submissions/"),
        instance
          .get("/promotions/", { params: { student: student.id } })
          .catch(() => ({ data: [] })),
      ]);
      const invoices = Array.isArray(invoicesRes.data)
        ? invoicesRes.data
        : invoicesRes.data?.results || [];
      const payments = (
        Array.isArray(paymentsRes.data)
          ? paymentsRes.data
          : paymentsRes.data?.results || []
      ).filter(
        (row) =>
          Number(row.student) === Number(student.id) ||
          invoices.some(
            (invoice) => Number(invoice.id) === Number(row.invoice),
          ),
      );
      setDetail({
        student: studentRes.data,
        invoices,
        payments,
        ledger: Array.isArray(ledgerRes.data)
          ? ledgerRes.data
          : ledgerRes.data?.results || [],
        assessmentResults: Array.isArray(resultsRes.data)
          ? resultsRes.data
          : resultsRes.data?.results || [],
        submissions: (Array.isArray(submissionsRes.data)
          ? submissionsRes.data
          : submissionsRes.data?.results || []
        ).filter((row) => Number(row.student) === Number(student.id)),
        promotions: Array.isArray(promotionsRes.data)
          ? promotionsRes.data
          : promotionsRes.data?.results || [],
      });
    } catch (err) {
      setDetailsError(
        err.response?.data?.detail ||
          err.message ||
          "Could not load full student details.",
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const courses = useMemo(() => {
    const courseMap = new Map();
    batches.forEach((batch) => {
      if (batch.course && batch.course_name) {
        courseMap.set(String(batch.course), batch.course_name);
      }
    });
    students.forEach((student) => {
      const enrollment = currentEnrollment(student);
      if (enrollment?.course && enrollment?.course_name) {
        courseMap.set(String(enrollment.course), enrollment.course_name);
      }
    });
    return [...courseMap.entries()].map(([id, name]) => ({ id, name }));
  }, [batches, students]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const columns = useMemo(
    () => [
      {
        key: "student_number_display",
        label: "Student No",
        render: (row) =>
          row.student_number_display || row.student_number || "-",
      },
      { key: "name", label: "Name" },
      { key: "f_name", label: "Guardian" },
      { key: "parent_mobile_number", label: "Parent Mobile" },
      {
        key: "current_class",
        label: "Current Class",
        render: (row) => formatBatchLabel(row.current_enrollments?.[0]),
      },
      {
        key: "current_course",
        label: "Course",
        render: (row) => row.current_enrollments?.[0]?.course_name || "-",
      },
      {
        key: "is_active",
        label: "Status",
        render: (row) => (row.is_active ? "Active" : "Inactive"),
      },
      {
        key: "billing_paid",
        label: "Paid",
        render: (row) => money(row.billing_paid),
      },
      {
        key: "billing_outstanding",
        label: "Remaining",
        render: (row) => money(row.billing_outstanding),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Manage student identities, lifecycle status, enrollments, academics, and billing history."
      />

      <div className="flex flex-wrap gap-2">
        <Link
          to="../addmission"
          className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white"
        >
          <UserPlus size={16} /> New Admission
        </Link>
        <button
          onClick={fetchStudents}
          className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700"
        >
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      <section className="rounded-md bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Filter size={16} /> Advanced Filters
            </h3>
            <p className="text-xs text-gray-500">
              Filters are applied by the backend. {students.length} students
              loaded.
            </p>
          </div>
          <button
            onClick={() => setFilters(defaultFilters)}
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Batch">
            <select
              value={filters.batch}
              onChange={(event) => updateFilter("batch", event.target.value)}
              className={inputClass()}
            >
              <option value="">All batches</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {formatBatchLabel(batch)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Course">
            <select
              value={filters.course}
              onChange={(event) => updateFilter("course", event.target.value)}
              className={inputClass()}
            >
              <option value="">All courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Student Status">
            <select
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
              className={inputClass()}
            >
              <option value="all">Active and inactive</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </Field>

          <Field label="Archive Status">
            <select
              value={filters.archived}
              onChange={(event) => updateFilter("archived", event.target.value)}
              className={inputClass()}
            >
              <option value="all">All records</option>
              <option value="active">Not archived</option>
              <option value="archived">Archived only</option>
            </select>
          </Field>

          <Field label="Enrollment From">
            <CalendarDatePicker
              module="students"
              value={filters.enrollment_start}
              onChange={(value) => updateFilter("enrollment_start", value)}
              className={inputClass()}
            />
          </Field>

          <Field label="Enrollment To">
            <CalendarDatePicker
              module="students"
              value={filters.enrollment_end}
              onChange={(value) => updateFilter("enrollment_end", value)}
              className={inputClass()}
            />
          </Field>

          <Field label="Payment Status">
            <select
              value={filters.payment_status}
              onChange={(event) =>
                updateFilter("payment_status", event.target.value)
              }
              className={inputClass()}
            >
              <option value="all">Any payment status</option>
              <option value="paid">Fully paid</option>
              <option value="partial">Partially paid</option>
              <option value="unpaid">Unpaid invoices</option>
              <option value="no_invoice">No invoices</option>
            </select>
          </Field>

          <Field label="Remaining Fee">
            <select
              value={filters.remaining_fee}
              onChange={(event) =>
                updateFilter("remaining_fee", event.target.value)
              }
              className={inputClass()}
            >
              <option value="all">Any balance</option>
              <option value="has_remaining">Has remaining fee</option>
              <option value="no_remaining">No remaining fee</option>
            </select>
          </Field>

          <Field label="Minimum Outstanding">
            <input
              type="number"
              min="0"
              value={filters.min_outstanding}
              onChange={(event) =>
                updateFilter("min_outstanding", event.target.value)
              }
              className={inputClass()}
              placeholder="0.00"
            />
          </Field>

          <Field label="Maximum Outstanding">
            <input
              type="number"
              min="0"
              value={filters.max_outstanding}
              onChange={(event) =>
                updateFilter("max_outstanding", event.target.value)
              }
              className={inputClass()}
              placeholder="0.00"
            />
          </Field>
        </div>
      </section>

      {message ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      <DataTable
        title="All Students"
        rows={students}
        columns={columns}
        loading={loading}
        error={error}
        pageSize={15}
        bulkActions={[
          {
            label: "Promote",
            onClick: (rows) => openPromotion(rows),
          },
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
          { label: "Details", onClick: () => openDetails(row), icon: Eye },
          { label: "Edit", onClick: () => setEditing(row), icon: Pencil },
          {
            label: "Promote",
            onClick: () => openPromotion(row),
            icon: ArrowUpCircle,
          },
          {
            label: "Archive",
            onClick: () => lifecycle(row, "archive"),
            icon: Archive,
          },
          { label: "Restore", onClick: () => lifecycle(row, "restore") },
          { label: "Deactivate", onClick: () => lifecycle(row, "deactivate") },
        ]}
        calendarModule="students"
      />

      {editing ? (
        <EditStudentModal
          student={editing}
          onClose={() => setEditing(null)}
          onSaved={fetchStudents}
        />
      ) : null}
      {promotingStudents.length ? (
        <PromoteStudentModal
          students={promotingStudents}
          batches={batches}
          onClose={() => setPromotingStudents([])}
          onPromote={handlePromote}
          promoting={promoting}
          error={promotionError}
        />
      ) : null}
      {detailsOpen ? (
        <StudentDetailsDrawer
          detail={detail}
          loading={detailsLoading}
          error={detailsError}
          onClose={() => setDetailsOpen(false)}
        />
      ) : null}
    </div>
  );
}
