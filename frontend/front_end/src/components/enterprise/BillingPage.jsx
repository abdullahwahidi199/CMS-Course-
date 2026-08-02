import { useEffect, useMemo, useState } from "react";
import { Banknote, FileText, Plus, Receipt, RefreshCcw } from "lucide-react";
import DataTable from "../shared/DataTable";
import PageHeader from "../shared/PageHeader";
import StatCard from "../shared/StatCard";
import { apiCreate, apiPost, useApiResource } from "../../hooks/useApiResource";
import instance from "../../api/axiosInstance";
import ReceiptPrintModal from "../reciept";
import CalendarDatePicker from "../shared/CalendarDatePicker";
import { useCalendar } from "../../hooks/useCalendar";
import { formatBatchLabel } from "../../utils/batchLabel";
import { toShamsi } from "../../utils/calendar";
const current = new Date();
const currentShamsi = toShamsi(current);
const initialPlan = {
  course: "",
  batch: "",
  billing_cycle: "monthly",
  monthly_fee: "",
  registration_fee: "0",
  material_fee: "0",
  exam_fee: "0",
  discount_allowed: "0",
  currency: "AFN",
  due_day: "5",
  late_fee_amount: "0",
  grace_period_days: "0",
  is_active: true,
};

function money(value) {
  return Number(value || 0).toFixed(2);
}

function billingCycleLabel(value) {
  return value === "batch" ? "Batch / One-time" : "Monthly";
}

function Field({ label, children }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-cyan-600"
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-cyan-600"
    />
  );
}

function Panel({ title, children }) {
  return (
    <section className="rounded-md bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

async function downloadFile(endpoint, filename) {
  const response = await instance.get(endpoint, { responseType: "blob" });
  const blob = new Blob([response.data], {
    type: response.headers["content-type"] || "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function BillingPage() {
  const invoiceCalendar = useCalendar("invoices");
  const [activeTab, setActiveTab] = useState("Invoices");
  const [planForm, setPlanForm] = useState(initialPlan);
  const [generateForm, setGenerateForm] = useState({
    month: current.getMonth() + 1,
    year: current.getFullYear(),
    due_date: "",
    scope: "all",
    course: "",
    batch: "",
    enrollment: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    invoice: "",
    amount_paid: "",
    discount_amount: "",
    discount_notes: "",
    payment_method: "cash",
    reference_number: "",
    notes: "",
  });
  const [paymentFilters, setPaymentFilters] = useState({
    batch: "",
    student: "",
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receiptModal, setReceiptModal] = useState({
    isOpen: false,
    data: null,
  });

  const invoices = useApiResource("/v1/invoices/");
  const payments = useApiResource("/v1/payments/");
  const ledger = useApiResource("/v1/student-ledger/");
  const feePlans = useApiResource("/v1/fee-plans/");
  const billingProfiles = useApiResource("/v1/enrollment-billing-profiles/");
  const summary = useApiResource("/v1/invoices/revenue-summary/");
  const courses = useApiResource("/courses/");
  const batches = useApiResource("/classes/");
  const enrollments = useApiResource("/enrollments/");

  const [tenant, setTenant] = useState(null);
  const invoiceRows = invoices.results;
  const paymentRows = payments.results;
  const paymentInvoices = useApiResource("/v1/invoices/", { immediate: false });
  const paymentSearch = paymentFilters.student.trim();
  const paymentInvoiceParams = useMemo(() => {
    const params = { payable: "1", ordering: "student__name" };
    if (paymentFilters.batch) params.batch = paymentFilters.batch;
    if (paymentSearch) params.search = paymentSearch;
    return params;
  }, [paymentFilters.batch, paymentSearch]);
  const paymentLookupRows = paymentInvoices.data
    ? paymentInvoices.results
    : invoiceRows;
  const selectedInvoice = paymentInvoices.results.find(
    (row) => String(row.id) === String(paymentForm.invoice),
  ) || invoiceRows.find((row) => String(row.id) === String(paymentForm.invoice));
  const paymentInvoiceRows = useMemo(() => {
    const studentQuery = paymentSearch.toLowerCase();
    return paymentLookupRows.filter((row) => {
      const isPayable =
        Number(row.balance || 0) > 0 && row.status !== "cancelled";
      const matchesBatch =
        !paymentFilters.batch || String(row.batch) === paymentFilters.batch;
      const matchesStudent =
        !studentQuery ||
        [
          row.student_name,
          row.student_role_number,
          row.student_number_display,
          row.student_number,
          row.student,
          row.invoice_number,
        ]
          .join(" ")
          .toLowerCase()
          .includes(studentQuery);
      return isPayable && matchesBatch && matchesStudent;
    });
  }, [paymentLookupRows, paymentFilters.batch, paymentSearch]);

  const localSummary = useMemo(() => {
    const expected = invoiceRows.reduce(
      (total, row) => total + Number(row.final_amount || 0),
      0,
    );
    const collected = invoiceRows.reduce(
      (total, row) => total + Number(row.paid_amount || 0),
      0,
    );
    const outstanding = invoiceRows.reduce(
      (total, row) => total + Number(row.balance || 0),
      0,
    );
    const overdue = invoiceRows
      .filter((row) => row.status === "overdue")
      .reduce((total, row) => total + Number(row.balance || 0), 0);
    return { expected, collected, outstanding, overdue };
  }, [invoiceRows]);

  const cards = summary.data || {};
  const refreshAll = async () => {
    await Promise.all([
      invoices.refetch(),
      payments.refetch(),
      paymentInvoices.refetch(paymentInvoiceParams),
      ledger.refetch(),
      feePlans.refetch(),
      billingProfiles.refetch(),
      summary.refetch(),
    ]);
  };

  const submitPlan = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const payload = { ...planForm, batch: planForm.batch || null };
      await apiCreate("/v1/fee-plans/", payload);
      setPlanForm(initialPlan);
      setMessage("Fee plan saved.");
      await refreshAll();
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          JSON.stringify(error.response?.data || {}) ||
          "Could not save fee plan.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const generateInvoices = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const payload = {
        month: Number(generateForm.month),
        year: Number(generateForm.year),
        due_date: generateForm.due_date || null,
      };
      if (generateForm.scope === "course" && generateForm.course)
        payload.course = generateForm.course;
      if (generateForm.scope === "batch" && generateForm.batch)
        payload.batch = generateForm.batch;
      if (generateForm.scope === "enrollment" && generateForm.enrollment)
        payload.enrollment = generateForm.enrollment;
      const created = await apiPost("/v1/invoices/generate-monthly/", payload);
      const generatedCount = created.length || 0;
      setMessage(
        generatedCount
          ? `${generatedCount} invoices generated.`
          : "0 new invoices generated. Existing invoices for the same students and period are not duplicated.",
      );
      await refreshAll();
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          JSON.stringify(error.response?.data || {}) ||
          "Could not generate invoices.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const collectPayment = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      await apiCreate("/v1/payments/", paymentForm);
      setPaymentForm({
        invoice: "",
        amount_paid: "",
        discount_amount: "",
        discount_notes: "",
        payment_method: "cash",
        reference_number: "",
        notes: "",
      });
      setMessage("Payment recorded and invoice balance updated.");
      await refreshAll();
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          JSON.stringify(error.response?.data || {}) ||
          "Could not record payment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getTenant = async () => {
    try {
      const response = await instance.get("/get-tenant");
      setTenant(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getTenant();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      paymentInvoices.refetch(paymentInvoiceParams).catch(() => {});
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [paymentInvoices.refetch, paymentInvoiceParams]);

  useEffect(() => {
    const period =
      invoiceCalendar.calendar === "shamsi"
        ? { month: currentShamsi.month, year: currentShamsi.year }
        : { month: current.getMonth() + 1, year: current.getFullYear() };
    setGenerateForm((form) => ({ ...form, ...period }));
  }, [invoiceCalendar.calendar]);

  const invoiceColumns = [
    { key: "invoice_number", label: "Invoice" },
    { key: "student_name", label: "Student" },
    { key: "enrollment_label", label: "Course / Batch" },
    {
      key: "period",
      label: "Period",
      accessor: (row) =>
        `${row.billing_month || row.month}/${row.billing_year || row.year}`,
    },
    { key: "due_date", label: "Due" },
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
    { key: "balance", label: "Balance", render: (row) => money(row.balance) },
    { key: "status", label: "Status" },
  ];

  const paymentColumns = [
    { key: "receipt_number", label: "Receipt" },
    { key: "student_name", label: "Student" },
    { key: "course_name", label: "Course" },
    { key: "payment_date", label: "Date" },
    { key: "payment_method", label: "Method" },
    {
      key: "invoice_discount",
      label: "Discounts",
      render: (row) => money(row.invoice_discount),
    },
    {
      key: "amount_paid",
      label: "Amount",
      render: (row) => money(row.amount_paid),
    },
    { key: "reference_number", label: "Reference" },
  ];

  const ledgerColumns = [
    { key: "transaction_date", label: "Date" },
    { key: "student_name", label: "Student" },
    { key: "transaction_type", label: "Type" },
    { key: "reference_number", label: "Reference" },
    { key: "description", label: "Description" },
    { key: "debit", label: "Debit", render: (row) => money(row.debit) },
    { key: "credit", label: "Credit", render: (row) => money(row.credit) },
    { key: "balance", label: "Balance", render: (row) => money(row.balance) },
  ];

  const planColumns = [
    { key: "course_name", label: "Course" },
    {
      key: "batch_name",
      label: "Batch",
      render: (row) => formatBatchLabel(row, "Default"),
    },
    {
      key: "billing_cycle",
      label: "Cycle",
      render: (row) => billingCycleLabel(row.billing_cycle),
    },
    {
      key: "monthly_fee",
      label: "Fee",
      render: (row) => money(row.monthly_fee),
    },
    {
      key: "registration_fee",
      label: "Registration",
      render: (row) => money(row.registration_fee),
    },
    { key: "due_day", label: "Due Day" },
    {
      key: "late_fee_amount",
      label: "Late Fee",
      render: (row) => money(row.late_fee_amount),
    },
    {
      key: "is_active",
      label: "Active",
      render: (row) => (row.is_active ? "Yes" : "No"),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Course Fee Management"
        description="Enrollment-based fee plans, monthly invoices, partial payments, receipts, and revenue controls."
      />

      {message ? (
        <div className="mb-4 rounded-md border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
          {message}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <StatCard
          title="Expected Revenue"
          value={money(cards.expected_monthly_revenue ?? localSummary.expected)}
          accent="border-sky-500"
        />
        <StatCard
          title="Collected"
          value={money(cards.collected_revenue ?? localSummary.collected)}
          accent="border-emerald-500"
        />
        <StatCard
          title="Discounts"
          value={money(cards.discounts_given)}
          accent="border-violet-500"
        />
        <StatCard
          title="Outstanding"
          value={money(cards.outstanding_revenue ?? localSummary.outstanding)}
          accent="border-orange-500"
        />
        <StatCard
          title="Overdue"
          value={money(cards.overdue_revenue ?? localSummary.overdue)}
          accent="border-red-500"
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          "Invoices",
          "Collect Payment",
          "Generate",
          "Fee Plans",
          "Payments",
          "Ledger",
        ].map((tab) => (
          <button
            key={tab}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${activeTab === tab ? "bg-cyan-700 text-white" : "bg-white text-gray-700"}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "Invoices" ? (
              <FileText size={16} />
            ) : tab === "Collect Payment" ? (
              <Banknote size={16} />
            ) : tab === "Generate" ? (
              <RefreshCcw size={16} />
            ) : tab === "Fee Plans" ? (
              <Plus size={16} />
            ) : (
              <Receipt size={16} />
            )}
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Invoices" ? (
        <DataTable
          title="Invoices"
          columns={invoiceColumns}
          rows={invoiceRows}
          loading={invoices.loading}
          error={invoices.error}
          calendarModule="invoices"
          actions={(row) => [
            {
              label: "Collect",
              onClick: () => {
                setPaymentFilters({
                  batch: row.batch ? String(row.batch) : "",
                  student: "",
                });
                setPaymentForm((form) => ({
                  ...form,
                  invoice: row.id,
                  amount_paid: row.balance,
                }));
                setActiveTab("Collect Payment");
              },
            },
            {
              label: "PDF",
              onClick: () =>
                downloadFile(
                  `/v1/invoices/${row.id}/pdf/`,
                  `${row.invoice_number}.pdf`,
                ),
            },
            {
              label: "Discount",
              onClick: async () => {
                const amount = window.prompt("Discount amount");
                if (amount) {
                  await apiPost(`/v1/invoices/${row.id}/apply-discount/`, {
                    amount,
                    notes: "Discount applied from billing console.",
                  });
                  await refreshAll();
                }
              },
            },
            {
              label: "Scholarship",
              onClick: async () => {
                const amount = window.prompt("Scholarship amount");
                if (amount) {
                  await apiPost(`/v1/invoices/${row.id}/apply-scholarship/`, {
                    amount,
                    notes: "Scholarship applied from billing console.",
                  });
                  await refreshAll();
                }
              },
            },
            {
              label: "Cancel",
              onClick: async () => {
                await apiPost(`/v1/invoices/${row.id}/cancel/`);
                await refreshAll();
              },
            },
            {
              label: "Waive",
              onClick: async () => {
                await apiPost(`/v1/invoices/${row.id}/waive/`, {
                  notes: "Balance waived from billing console.",
                });
                await refreshAll();
              },
            },
          ]}
        />
      ) : null}

      {activeTab === "Collect Payment" ? (
        <Panel title="Collect Payment">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={collectPayment}>
            <Field label="Batch Filter">
              <Select
                value={paymentFilters.batch}
                onChange={(e) => {
                  setPaymentFilters({
                    ...paymentFilters,
                    batch: e.target.value,
                  });
                  setPaymentForm({
                    ...paymentForm,
                    invoice: "",
                    amount_paid: "",
                    discount_amount: "",
                    discount_notes: "",
                  });
                }}
              >
                <option value="">All batches</option>
                {batches.results.map((row) => (
                  <option key={row.id} value={row.id}>
                    {formatBatchLabel(row)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Search Student">
              <Input
                value={paymentFilters.student}
                placeholder="Student name, ID, or invoice"
                onChange={(e) => {
                  setPaymentFilters({
                    ...paymentFilters,
                    student: e.target.value,
                  });
                  setPaymentForm({
                    ...paymentForm,
                    invoice: "",
                    amount_paid: "",
                    discount_amount: "",
                    discount_notes: "",
                  });
                }}
              />
            </Field>
            <Field label="Invoice">
              <Select
                required
                value={paymentForm.invoice}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    invoice: e.target.value,
                    discount_amount: "",
                    discount_notes: "",
                    amount_paid:
                      paymentInvoiceRows.find(
                        (row) => String(row.id) === e.target.value,
                      )?.balance || "",
                  })
                }
              >
                <option value="">Select invoice</option>
                {paymentInvoiceRows.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.invoice_number} - {row.student_name} -{" "}
                    {formatBatchLabel(row, "No batch")} - {money(row.balance)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Discount">
              <Input
                type="number"
                min="0"
                step="0.01"
                max={selectedInvoice?.balance || undefined}
                value={paymentForm.discount_amount}
                onChange={(e) => {
                  const discount = Number(e.target.value || 0);
                  const adjustedBalance = selectedInvoice
                    ? Math.max(
                        Number(selectedInvoice.balance || 0) - discount,
                        0,
                      )
                    : "";
                  setPaymentForm({
                    ...paymentForm,
                    discount_amount: e.target.value,
                    amount_paid:
                      selectedInvoice &&
                      Number(paymentForm.amount_paid || 0) > adjustedBalance
                        ? adjustedBalance
                        : paymentForm.amount_paid,
                  });
                }}
              />
            </Field>
            <Field label="Amount">
              <Input
                required
                type="number"
                min="0.01"
                step="0.01"
                max={
                  selectedInvoice
                    ? Math.max(
                        Number(selectedInvoice.balance || 0) -
                          Number(paymentForm.discount_amount || 0),
                        0,
                      )
                    : undefined
                }
                value={paymentForm.amount_paid}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    amount_paid: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Discount Notes">
              <Input
                value={paymentForm.discount_notes}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    discount_notes: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Method">
              <Select
                value={paymentForm.payment_method}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    payment_method: e.target.value,
                  })
                }
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
                <option value="card">Credit/Debit Card</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Reference Number">
              <Input
                value={paymentForm.reference_number}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    reference_number: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Notes">
              <Input
                value={paymentForm.notes}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, notes: e.target.value })
                }
              />
            </Field>
            <div className="md:col-span-2">
              <button
                disabled={submitting}
                className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Record Payment
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      {activeTab === "Generate" ? (
        <Panel title="Generate Monthly Invoices">
          <form
            className="grid gap-4 md:grid-cols-3"
            onSubmit={generateInvoices}
          >
            <Field
              label={`Month (${invoiceCalendar.calendar === "shamsi" ? "Shamsi" : "Gregorian"})`}
            >
              <Input
                required
                type="number"
                min="1"
                max="12"
                value={generateForm.month}
                onChange={(e) =>
                  setGenerateForm({ ...generateForm, month: e.target.value })
                }
              />
            </Field>
            <Field
              label={`Year (${invoiceCalendar.calendar === "shamsi" ? "Shamsi" : "Gregorian"})`}
            >
              <Input
                required
                type="number"
                min={invoiceCalendar.calendar === "shamsi" ? "1200" : "2000"}
                value={generateForm.year}
                onChange={(e) =>
                  setGenerateForm({ ...generateForm, year: e.target.value })
                }
              />
            </Field>
            <Field label="Due Date">
              <CalendarDatePicker
                module="invoices"
                value={generateForm.due_date}
                onChange={(value) =>
                  setGenerateForm({ ...generateForm, due_date: value })
                }
              />
            </Field>
            <Field label="Scope">
              <Select
                value={generateForm.scope}
                onChange={(e) =>
                  setGenerateForm({ ...generateForm, scope: e.target.value })
                }
              >
                <option value="all">All active enrollments</option>
                <option value="course">Course</option>
                <option value="batch">Batch</option>
                <option value="enrollment">Enrollment</option>
              </Select>
            </Field>
            {generateForm.scope === "course" ? (
              <Field label="Course">
                <Select
                  required
                  value={generateForm.course}
                  onChange={(e) =>
                    setGenerateForm({ ...generateForm, course: e.target.value })
                  }
                >
                  <option value="">Select course</option>
                  {courses.results.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            {generateForm.scope === "batch" ? (
              <Field label="Batch">
                <Select
                  required
                  value={generateForm.batch}
                  onChange={(e) =>
                    setGenerateForm({ ...generateForm, batch: e.target.value })
                  }
                >
                  <option value="">Select batch</option>
                  {batches.results.map((row) => (
                    <option key={row.id} value={row.id}>
                      {formatBatchLabel(row)}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            {generateForm.scope === "enrollment" ? (
              <Field label="Enrollment">
                <Select
                  required
                  value={generateForm.enrollment}
                  onChange={(e) =>
                    setGenerateForm({
                      ...generateForm,
                      enrollment: e.target.value,
                    })
                  }
                >
                  <option value="">Select enrollment</option>
                  {enrollments.results.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.student_name} - {formatBatchLabel(row)}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            <div className="md:col-span-3">
              <button
                disabled={submitting}
                className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Generate Invoices
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      {activeTab === "Fee Plans" ? (
        <div className="space-y-6">
          <Panel title="Create Fee Plan">
            <form className="grid gap-4 md:grid-cols-4" onSubmit={submitPlan}>
              <Field label="Course">
                <Select
                  required
                  value={planForm.course}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, course: e.target.value })
                  }
                >
                  <option value="">Select course</option>
                  {courses.results.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Batch Override">
                <Select
                  value={planForm.batch}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, batch: e.target.value })
                  }
                >
                  <option value="">Default for course</option>
                  {batches.results
                    .filter(
                      (row) =>
                        !planForm.course ||
                        String(row.course) === String(planForm.course),
                    )
                    .map((row) => (
                      <option key={row.id} value={row.id}>
                        {formatBatchLabel(row)}
                      </option>
                    ))}
                </Select>
              </Field>
              <Field label="Billing Cycle">
                <Select
                  value={planForm.billing_cycle}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, billing_cycle: e.target.value })
                  }
                >
                  <option value="monthly">Monthly per student</option>
                  <option value="batch">Batch / one-time fee</option>
                </Select>
              </Field>
              <Field
                label={
                  planForm.billing_cycle === "batch"
                    ? "Batch Fee"
                    : "Monthly Fee"
                }
              >
                <Input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={planForm.monthly_fee}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, monthly_fee: e.target.value })
                  }
                />
              </Field>
              <Field label="Currency">
                <Input
                  value={planForm.currency}
                  maxLength={3}
                  onChange={(e) =>
                    setPlanForm({
                      ...planForm,
                      currency: e.target.value.toUpperCase(),
                    })
                  }
                />
              </Field>
              <Field label="Registration Fee">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={planForm.registration_fee}
                  onChange={(e) =>
                    setPlanForm({
                      ...planForm,
                      registration_fee: e.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Material Fee">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={planForm.material_fee}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, material_fee: e.target.value })
                  }
                />
              </Field>
              <Field label="Exam Fee">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={planForm.exam_fee}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, exam_fee: e.target.value })
                  }
                />
              </Field>
              <Field label="Max Discount">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={planForm.discount_allowed}
                  onChange={(e) =>
                    setPlanForm({
                      ...planForm,
                      discount_allowed: e.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Due Day">
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={planForm.due_day}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, due_day: e.target.value })
                  }
                />
              </Field>
              <Field label="Late Fee">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={planForm.late_fee_amount}
                  onChange={(e) =>
                    setPlanForm({
                      ...planForm,
                      late_fee_amount: e.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Grace Days">
                <Input
                  type="number"
                  min="0"
                  value={planForm.grace_period_days}
                  onChange={(e) =>
                    setPlanForm({
                      ...planForm,
                      grace_period_days: e.target.value,
                    })
                  }
                />
              </Field>
              <div className="flex items-end">
                <button
                  disabled={submitting}
                  className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </Panel>
          <DataTable
            title="Fee Plans"
            columns={planColumns}
            rows={feePlans.results}
            loading={feePlans.loading}
            error={feePlans.error}
            calendarModule="fees"
          />
          <DataTable
            title="Enrollment Billing Profiles"
            columns={[
              { key: "student_name", label: "Student" },
              { key: "course_name", label: "Course" },
              {
                key: "batch_name",
                label: "Batch",
                render: (row) => formatBatchLabel(row),
              },
              {
                key: "billing_cycle",
                label: "Cycle",
                render: (row) => billingCycleLabel(row.billing_cycle),
              },
              {
                key: "monthly_fee",
                label: "Fee",
                render: (row) => money(row.monthly_fee),
              },
              {
                key: "registration_fee",
                label: "Registration",
                render: (row) => money(row.registration_fee),
              },
              { key: "discount_type", label: "Discount" },
              { key: "discount_amount", label: "Amount" },
              { key: "billing_status", label: "Status" },
            ]}
            rows={billingProfiles.results}
            loading={billingProfiles.loading}
            error={billingProfiles.error}
            calendarModule="fees"
          />
        </div>
      ) : null}

      {activeTab === "Payments" ? (
        <DataTable
          title="Payment History"
          columns={paymentColumns}
          rows={paymentRows}
          loading={payments.loading}
          error={payments.error}
          calendarModule="fees"
          actions={(row) => [
            {
              label: "Receipt",
              onClick: () => setReceiptModal({ isOpen: true, data: row }),
            },
          ]}
        />
      ) : null}

      <ReceiptPrintModal
        receipt={receiptModal.data}
        tenant={tenant}
        isOpen={receiptModal.isOpen}
        onClose={() => setReceiptModal({ isOpen: false, data: null })}
      />

      {activeTab === "Ledger" ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700"
              onClick={() =>
                downloadFile("/v1/student-ledger/pdf/", "student-ledger.pdf")
              }
            >
              Print Ledger
            </button>
          </div>
          <DataTable
            title="Student Ledger"
            columns={ledgerColumns}
            rows={ledger.results}
            loading={ledger.loading}
            error={ledger.error}
            calendarModule="fees"
          />
        </div>
      ) : null}
    </div>
  );
}
