import { useEffect, useMemo, useState } from "react";
import { Archive, RotateCcw, Save, UserPlus } from "lucide-react";
import DataTable from "./shared/DataTable";
import PageHeader from "./shared/PageHeader";
import instance from "../api/axiosInstance";

const emptyStudent = {
  username: "",
  password: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  f_name: "",
  parent_mobile_number: "",
  address: "",
  batch: "",
};

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
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState(emptyStudent);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsResponse, batchesResponse] = await Promise.all([
        instance.get("/students/"),
        instance.get("/classes/"),
      ]);
      setStudents(studentsResponse.data);
      setBatches(batchesResponse.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Could not load students.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const validate = () => {
    if (!form.username.trim()) return "Username is required.";
    if (!editingId && !form.password) return "Password is required.";
    if (!form.first_name.trim() || !form.last_name.trim())
      return "First name and last name are required.";
    return "";
  };

  const saveStudent = async (event) => {
    event.preventDefault();
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      const batchId = payload.batch;
      delete payload.batch;
      if (editingId && !payload.password) delete payload.password;

      let saved;
      if (editingId) {
        const response = await instance.patch(
          `/students/${editingId}/`,
          payload,
        );
        saved = response.data;
        setMessage("Student updated.");
      } else {
        const response = await instance.post("/students/", payload);
        saved = response.data;
        setMessage("Student account created.");
      }

      const batch = batches.find((item) => Number(item.id) === Number(batchId));
      if (!editingId && batch) {
        await instance.post("/enrollments/", {
          student: saved.id,
          batch: batch.id,
          course: batch.course,
          enrollment_date: new Date().toISOString().slice(0, 10),
          status: "active",
        });
      }

      setForm(emptyStudent);
      setEditingId(null);
      setError("");
      await fetchData();
    } catch (err) {
      setError(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : "Could not save student.",
      );
    } finally {
      setSaving(false);
    }
  };

  const editStudent = (student) => {
    const [fallbackFirst, ...rest] = (student.name || "").split(" ");
    setEditingId(student.id);
    setForm({
      ...emptyStudent,
      username: student.username || "",
      first_name: student.first_name || fallbackFirst || "",
      last_name: student.last_name || rest.join(" "),
      email: student.email || "",
      phone: student.phone || "",
      f_name: student.f_name || "",
      role_number: student.role_number || "",
      parent_mobile_number: student.parent_mobile_number || "",
      address: student.address || "",
      total_fee: student.total_fee || "0",
      amount_paid: student.amount_paid || "0",
    });
  };

  const lifecycle = async (student, action) => {
    await instance.post(`/students/${student.id}/${action}/`);
    setMessage(`Student ${action} complete.`);
    await fetchData();
  };

  const columns = useMemo(
    () => [
      { key: "username", label: "Username" },
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "role_number", label: "Roll No" },
      {
        key: "batch",
        label: "Current Batch",
        render: (row) => row.current_enrollments?.[0]?.batch_name || "-",
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
        title="Student Management"
        description="Create student login accounts, manage profiles, enrollments, and lifecycle status."
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
        onSubmit={saveStudent}
      >
        <div className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
          <UserPlus size={18} />{" "}
          {editingId ? "Edit Student" : "Create Student Account"}
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Username">
            <input
              className={inputClass()}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </Field>
          <Field label="Password">
            <input
              className={inputClass()}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editingId}
            />
          </Field>
          <Field label="First Name">
            <input
              className={inputClass()}
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              required
            />
          </Field>
          <Field label="Last Name">
            <input
              className={inputClass()}
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
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
          <Field label="Father/Guardian Name">
            <input
              className={inputClass()}
              value={form.f_name}
              onChange={(e) => setForm({ ...form, f_name: e.target.value })}
            />
          </Field>
          <Field label="Roll Number">
            <input
              className={inputClass()}
              value={form.role_number}
              onChange={(e) =>
                setForm({ ...form, role_number: e.target.value })
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
          <Field label="Total Fee">
            <input
              className={inputClass()}
              type="number"
              value={form.total_fee}
              onChange={(e) => setForm({ ...form, total_fee: e.target.value })}
            />
          </Field>
          <Field label="Amount Paid">
            <input
              className={inputClass()}
              type="number"
              value={form.amount_paid}
              onChange={(e) =>
                setForm({ ...form, amount_paid: e.target.value })
              }
            />
          </Field>
          {!editingId ? (
            <Field label="Initial Batch">
              <select
                className={inputClass()}
                value={form.batch}
                onChange={(e) => setForm({ ...form, batch: e.target.value })}
              >
                <option value="">No initial enrollment</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
        </div>
        <div className="mt-4 flex gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={saving}
          >
            <Save size={16} /> {editingId ? "Update Student" : "Create Student"}
          </button>
          <button
            type="button"
            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
            onClick={() => {
              setForm(emptyStudent);
              setEditingId(null);
            }}
          >
            Reset
          </button>
        </div>
      </form>

      <DataTable
        title="Student List"
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
          { label: "Edit", onClick: () => editStudent(row) },
          { label: "Archive", onClick: () => lifecycle(row, "archive") },
          { label: "Restore", onClick: () => lifecycle(row, "restore") },
          { label: "Deactivate", onClick: () => lifecycle(row, "deactivate") },
        ]}
      />
    </div>
  );
}
