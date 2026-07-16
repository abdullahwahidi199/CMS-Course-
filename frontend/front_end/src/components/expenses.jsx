import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  FileText,
  Plus,
  RefreshCcw,
  Save,
  XCircle,
} from "lucide-react";
import DataTable from "./shared/DataTable";
import PageHeader from "./shared/PageHeader";
import StatCard from "./shared/StatCard";
import CalendarDatePicker from "./shared/CalendarDatePicker";
import instance from "../api/axiosInstance";

const emptyExpense = {
  title: "",
  category: "",
  subcategory: "",
  amount: "",
  currency: "AFN",
  expense_date: new Date().toISOString().slice(0, 10),
  payment_date: "",
  description: "",
  notes: "",
};

function inputClass() {
  return "w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-cyan-600";
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function normalize(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

function responseData(response, fallback) {
  return response?.data ?? fallback;
}

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function ExpenseModal({ expense, categories, onClose, onSaved }) {
  const [form, setForm] = useState({ ...emptyExpense, ...(expense || {}) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      name: form.title,
      category: form.category || null,
      amount: Number(form.amount || 0),
      payment_date: form.payment_date || null,
    };
    try {
      if (expense?.id) {
        await instance.patch(`/expenses/${expense.id}/`, payload);
      } else {
        await instance.post("/expenses/", payload);
      }
      await onSaved();
      onClose();
    } catch (err) {
      setError(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : "Could not save expense.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-4xl rounded-md bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {expense?.id ? "Edit Expense" : "Create Expense"}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-500">
            <XCircle size={20} />
          </button>
        </div>
        {error ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Title">
            <input
              required
              className={inputClass()}
              value={form.title || ""}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
            />
          </Field>
          <Field label="Category">
            <select
              className={inputClass()}
              value={form.category || ""}
              onChange={(event) =>
                setForm({ ...form, category: event.target.value })
              }
            >
              <option value="">Select category</option>
              {categories
                .filter((row) => row.is_active !== false)
                .map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Subcategory">
            <input
              className={inputClass()}
              value={form.subcategory || ""}
              onChange={(event) =>
                setForm({ ...form, subcategory: event.target.value })
              }
            />
          </Field>
          <Field label="Amount">
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              className={inputClass()}
              value={form.amount || ""}
              onChange={(event) =>
                setForm({ ...form, amount: event.target.value })
              }
            />
          </Field>
          <Field label="Currency">
            <input
              maxLength={3}
              className={inputClass()}
              value={form.currency || "AFN"}
              onChange={(event) =>
                setForm({ ...form, currency: event.target.value.toUpperCase() })
              }
            />
          </Field>
          <Field label="Expense Date">
            <CalendarDatePicker
              module="expenses"
              className={inputClass()}
              value={form.expense_date || ""}
              onChange={(value) => setForm({ ...form, expense_date: value })}
            />
          </Field>
          <Field label="Payment Date">
            <CalendarDatePicker
              module="expenses"
              className={inputClass()}
              value={form.payment_date || ""}
              onChange={(value) => setForm({ ...form, payment_date: value })}
            />
          </Field>
          <div className="md:col-span-4">
            <Field label="Description">
              <textarea
                rows={3}
                className={inputClass()}
                value={form.description || ""}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
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
            <Save size={16} /> Save Expense
          </button>
        </div>
      </form>
    </div>
  );
}

function SimpleCreate({ title, fields, onSubmit }) {
  const [form, setForm] = useState(
    Object.fromEntries(fields.map((field) => [field.key, field.default || ""])),
  );
  return (
    <form
      className="grid gap-3 rounded-md bg-white p-4 shadow-sm md:grid-cols-4"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit(form);
        setForm(
          Object.fromEntries(
            fields.map((field) => [field.key, field.default || ""]),
          ),
        );
      }}
    >
      <h3 className="text-sm font-semibold text-gray-900 md:col-span-4">
        {title}
      </h3>
      {fields.map((field) => (
        <Field key={field.key} label={field.label}>
          <input
            type={field.type || "text"}
            className={inputClass()}
            value={form[field.key]}
            onChange={(event) =>
              setForm({ ...form, [field.key]: event.target.value })
            }
            required={field.required}
          />
        </Field>
      ))}
      <div className="flex items-end">
        <button className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white">
          <Plus size={16} /> Add
        </button>
      </div>
    </form>
  );
}

export default function Expenses() {
  const [activeTab, setActiveTab] = useState("Expenses");
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [dashboard, setDashboard] = useState({});
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    start_date: "",
    end_date: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [
        expenseRes,
        categoryRes,
        budgetRes,
        recurringRes,
        dashboardRes,
      ] = await Promise.all([
        instance.get("/expenses/", { params: filters }),
        instance.get("/expense-categories/"),
        instance.get("/budgets/"),
        instance.get("/recurring-expenses/"),
        instance.get("/expenses/dashboard/"),
      ]);
      setExpenses(normalize(responseData(expenseRes, [])));
      setCategories(normalize(responseData(categoryRes, [])));
      setBudgets(normalize(responseData(budgetRes, [])));
      setRecurring(normalize(responseData(recurringRes, [])));
      setDashboard(responseData(dashboardRes, {}));
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Could not load expenses.",
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const lifecycle = async (expense, action) => {
    setMessage("");
    await instance.post(`/expenses/${expense.id}/${action}/`);
    setMessage(`Expense ${action} complete.`);
    await fetchData();
  };

  const submitCategory = async (form) => {
    await instance.post("/expense-categories/", form);
    await fetchData();
  };

  const submitBudget = async (form) => {
    await instance.post("/budgets/", {
      ...form,
      category: form.category || null,
      allocated_amount: Number(form.allocated_amount || 0),
    });
    await fetchData();
  };

  const submitRecurring = async (form) => {
    await instance.post("/recurring-expenses/", {
      ...form,
      category: form.category || null,
      amount: Number(form.amount || 0),
    });
    await fetchData();
  };

  const expenseColumns = useMemo(
    () => [
      { key: "expense_number", label: "Expense Number" },
      { key: "title", label: "Title", render: (row) => row.title || row.name },
      {
        key: "category_name",
        label: "Category",
        render: (row) => row.category_name || "-",
      },
      {
        key: "amount",
        label: "Amount",
        render: (row) => `${money(row.amount)} ${row.currency || "AFN"}`,
      },
      { key: "expense_date", label: "Date" },
      {
        key: "created_by_username",
        label: "Created By",
        render: (row) => row.created_by_username || "-",
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Management"
        description="Track operational expenses, categories, approvals, budgets, and recurring obligations."
        actions={
          <>
            <button
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white"
            >
              <Plus size={16} /> New Expense
            </button>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700"
            >
              <RefreshCcw size={16} /> Refresh
            </button>
          </>
        }
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Expenses"
          value={money(dashboard.today_expenses)}
          accent="border-sky-500"
        />
        <StatCard
          title="This Month"
          value={money(dashboard.month_expenses)}
          accent="border-orange-500"
        />
        <StatCard
          title="Total Expenses"
          value={money(dashboard.total_expenses)}
          accent="border-red-500"
        />
        <StatCard
          title="This Year"
          value={money(dashboard.year_expenses)}
          accent="border-cyan-600"
        />
        <StatCard
          title="Average Expense"
          value={money(dashboard.average_expense)}
          accent="border-indigo-500"
        />
        <StatCard
          title="Highest Expense"
          value={money(dashboard.highest_expense)}
          accent="border-rose-500"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          "Expenses",
          "Categories",
          "Budgets",
          "Recurring",
          "Reports",
        ].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${activeTab === tab ? "bg-cyan-700 text-white" : "bg-white text-gray-700"}`}
          >
            <FileText size={16} /> {tab}
          </button>
        ))}
      </div>

      {activeTab === "Expenses" ? (
        <>
          <div className="grid gap-3 rounded-md bg-white p-4 shadow-sm md:grid-cols-4">
            <Field label="Search">
              <input
                className={inputClass()}
                value={filters.search}
                onChange={(event) =>
                  setFilters({ ...filters, search: event.target.value })
                }
              />
            </Field>
            <Field label="Category">
              <select
                className={inputClass()}
                value={filters.category}
                onChange={(event) =>
                  setFilters({ ...filters, category: event.target.value })
                }
              >
                <option value="">All categories</option>
                {categories.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Start Date">
              <CalendarDatePicker
                module="expenses"
                className={inputClass()}
                value={filters.start_date}
                onChange={(value) => setFilters({ ...filters, start_date: value })}
              />
            </Field>
            <Field label="End Date">
              <CalendarDatePicker
                module="expenses"
                className={inputClass()}
                value={filters.end_date}
                onChange={(value) => setFilters({ ...filters, end_date: value })}
              />
            </Field>
            <div className="flex items-end">
              <button
                onClick={fetchData}
                className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white"
              >
                Apply Filters
              </button>
            </div>
          </div>
          <DataTable
            title="Expense Register"
            rows={expenses}
            columns={expenseColumns}
            loading={loading}
            error={error}
            pageSize={15}
            calendarModule="expenses"
            actions={(row) => [
              { label: "Edit", onClick: () => setEditing(row) },
              {
                label: "Archive",
                onClick: () => lifecycle(row, "archive"),
                icon: Archive,
              },
              { label: "Restore", onClick: () => lifecycle(row, "restore") },
              { label: "Print", onClick: () => window.print() },
            ]}
          />
        </>
      ) : null}

      {activeTab === "Categories" ? (
        <>
          <SimpleCreate
            title="Create Category"
            fields={[
              { key: "name", label: "Name", required: true },
              { key: "description", label: "Description" },
            ]}
            onSubmit={submitCategory}
          />
          <DataTable
            title="Expense Categories"
            rows={categories}
            columns={[
              { key: "name", label: "Name" },
              { key: "description", label: "Description" },
              {
                key: "is_active",
                label: "Active",
                render: (row) => (row.is_active ? "Yes" : "No"),
              },
            ]}
            calendarModule="expenses"
          />
        </>
      ) : null}

      {activeTab === "Budgets" ? (
        <>
          <SimpleCreate
            title="Create Budget"
            fields={[
              { key: "name", label: "Name", required: true },
              {
                key: "allocated_amount",
                label: "Allocated Amount",
                type: "number",
                required: true,
              },
              { key: "department", label: "Department" },
              {
                key: "start_date",
                label: "Start Date",
                type: "date",
                required: true,
              },
              {
                key: "end_date",
                label: "End Date",
                type: "date",
                required: true,
              },
            ]}
            onSubmit={submitBudget}
          />
          <DataTable
            title="Budgets"
            rows={budgets}
            columns={[
              { key: "name", label: "Name" },
              { key: "category_name", label: "Category" },
              {
                key: "allocated_amount",
                label: "Allocated",
                render: (row) => money(row.allocated_amount),
              },
              {
                key: "spent_amount",
                label: "Spent",
                render: (row) => money(row.spent_amount),
              },
              {
                key: "remaining_amount",
                label: "Remaining",
                render: (row) => money(row.remaining_amount),
              },
              { key: "used_percentage", label: "Used %" },
            ]}
            calendarModule="expenses"
          />
        </>
      ) : null}

      {activeTab === "Recurring" ? (
        <>
          <SimpleCreate
            title="Create Recurring Expense"
            fields={[
              { key: "title", label: "Title", required: true },
              {
                key: "amount",
                label: "Amount",
                type: "number",
                required: true,
              },
              {
                key: "next_run_date",
                label: "Next Run",
                type: "date",
                required: true,
              },
              { key: "frequency", label: "Frequency", default: "monthly" },
            ]}
            onSubmit={submitRecurring}
          />
          <DataTable
            title="Recurring Expenses"
            rows={recurring}
            columns={[
              { key: "title", label: "Title" },
              { key: "category_name", label: "Category" },
              {
                key: "amount",
                label: "Amount",
                render: (row) => money(row.amount),
              },
              { key: "frequency", label: "Frequency" },
              { key: "next_run_date", label: "Next Run" },
              {
                key: "is_active",
                label: "Active",
                render: (row) => (row.is_active ? "Yes" : "No"),
              },
            ]}
            calendarModule="expenses"
          />
        </>
      ) : null}

      {activeTab === "Reports" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <DataTable
            title="Category Report"
            rows={dashboard.category_totals || []}
            columns={[
              {
                key: "category__name",
                label: "Category",
                render: (row) => row.category__name || "Uncategorized",
              },
              {
                key: "total",
                label: "Total",
                render: (row) => money(row.total),
              },
            ]}
            calendarModule="expenses"
          />
          <DataTable
            title="Monthly Expense Report"
            rows={dashboard.monthly_trend || []}
            columns={[
              { key: "expense_date__month", label: "Month" },
              {
                key: "total",
                label: "Total",
                render: (row) => money(row.total),
              },
            ]}
            calendarModule="expenses"
          />
        </div>
      ) : null}

      {creating ? (
        <ExpenseModal
          categories={categories}
          onClose={() => setCreating(false)}
          onSaved={fetchData}
        />
      ) : null}
      {editing ? (
        <ExpenseModal
          expense={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={fetchData}
        />
      ) : null}
    </div>
  );
}
