import { useEffect, useMemo, useState } from "react";
import { Archive, CheckCircle2, Edit, Plus, RefreshCcw, Save, Search, ShieldCheck, Trash2, X } from "lucide-react";
import instance from "../api/axiosInstance";
import DataTable from "./shared/DataTable";
import PageHeader from "./shared/PageHeader";
import StatCard from "./shared/StatCard";
import { formatApiError } from "../utils/apiErrors";
import { formatBatchLabel } from "../utils/batchLabel";

const emptyForm = {
  username: "",
  password: "",
  full_name: "",
  phone_number: "",
  email_address: "",
  subject: "",
  department: "",
  is_active: true,
};

function inputClass() {
  return "w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100";
}

function normalize(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

function accountStatus(teacher) {
  if (teacher.is_archived) return "Archived";
  if (teacher.user_is_deactivated || teacher.user_is_active === false || teacher.is_active === false) return "Inactive";
  return "Active";
}

function statusBadge(value) {
  const styles = {
    Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Inactive: "bg-amber-50 text-amber-700 ring-amber-200",
    Archived: "bg-gray-100 text-gray-600 ring-gray-200",
  };
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ${styles[value] || styles.Archived}`}>{value}</span>;
}

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function TeacherModal({ mode, form, setForm, onClose, onSubmit, saving, error }) {
  const isEditing = mode === "edit";
  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-3 sm:items-center">
      <form onSubmit={onSubmit} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-950">{isEditing ? "Edit Teacher" : "Create Teacher"}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {isEditing ? "Update profile details and linked login account." : "A teacher login account will be created with this profile."}
            </p>
          </div>
          <button type="button" className="rounded-md p-2 text-gray-500 hover:bg-gray-100" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {error ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name">
            <input required className={inputClass()} value={form.full_name} onChange={(event) => setValue("full_name", event.target.value)} />
          </Field>
          <Field label="Username">
            <input required className={inputClass()} value={form.username} onChange={(event) => setValue("username", event.target.value)} />
          </Field>
          <Field label={isEditing ? "New password" : "Password"}>
            <>
              <input
                required={!isEditing}
                type="password"
                minLength={6}
                className={inputClass()}
                value={form.password}
                onChange={(event) => setValue("password", event.target.value)}
                placeholder={isEditing ? "Leave blank to keep current password" : ""}
              />
              <p className="mt-1 text-xs text-gray-500">Use at least 6 characters.</p>
            </>
          </Field>
          <Field label="Email address">
            <input required type="email" className={inputClass()} value={form.email_address} onChange={(event) => setValue("email_address", event.target.value)} />
          </Field>
          <Field label="Phone number">
            <input required className={inputClass()} value={form.phone_number} onChange={(event) => setValue("phone_number", event.target.value)} />
          </Field>
          <Field label="Subject">
            <input required className={inputClass()} value={form.subject} onChange={(event) => setValue("subject", event.target.value)} />
          </Field>
          <Field label="Department">
            <input className={inputClass()} value={form.department || ""} onChange={(event) => setValue("department", event.target.value)} />
          </Field>
          <Field label="Account status">
            <select className={inputClass()} value={String(form.is_active)} onChange={(event) => setValue("is_active", event.target.value === "true")}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </Field>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700" onClick={onClose}>
            Cancel
          </button>
          <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            <Save size={16} /> {isEditing ? "Save Changes" : "Create Teacher"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({ search: "", status: "", department: "", subject: "" });

  const fetchTeachers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await instance.get("/teachers/");
      setTeachers(normalize(response.data));
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not load teachers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const departments = useMemo(() => [...new Set(teachers.map((teacher) => teacher.department).filter(Boolean))].sort(), [teachers]);
  const subjects = useMemo(() => [...new Set(teachers.map((teacher) => teacher.subject).filter(Boolean))].sort(), [teachers]);

  const visibleTeachers = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return teachers.filter((teacher) => {
      const status = accountStatus(teacher);
      const matchesSearch = term
        ? [teacher.full_name, teacher.username, teacher.email_address, teacher.phone_number, teacher.subject, teacher.department]
            .join(" ")
            .toLowerCase()
            .includes(term)
        : true;
      return (
        matchesSearch &&
        (!filters.status || status === filters.status) &&
        (!filters.department || teacher.department === filters.department) &&
        (!filters.subject || teacher.subject === filters.subject)
      );
    });
  }, [filters, teachers]);

  const stats = useMemo(() => {
    const active = teachers.filter((teacher) => accountStatus(teacher) === "Active").length;
    const inactive = teachers.filter((teacher) => accountStatus(teacher) === "Inactive").length;
    const archived = teachers.filter((teacher) => accountStatus(teacher) === "Archived").length;
    const assigned = teachers.filter((teacher) => teacher.classes?.length).length;
    return { total: teachers.length, active, inactive, archived, assigned };
  }, [teachers]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalMode("create");
    setError("");
  };

  const openEdit = (teacher) => {
    setForm({
      username: teacher.username || "",
      password: "",
      full_name: teacher.full_name || "",
      phone_number: teacher.phone_number || "",
      email_address: teacher.email_address || "",
      subject: teacher.subject || "",
      department: teacher.department || "",
      is_active: teacher.is_active !== false && teacher.user_is_active !== false,
    });
    setEditingId(teacher.id);
    setModalMode("edit");
    setError("");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  const saveTeacher = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const payload = { ...form };
    if (modalMode === "edit" && !payload.password) delete payload.password;
    try {
      if (modalMode === "edit") {
        await instance.patch(`/teachers/${editingId}/`, payload);
        setMessage("Teacher updated.");
      } else {
        await instance.post("/teachers/", payload);
        setMessage("Teacher and login account created.");
      }
      closeModal();
      await fetchTeachers();
    } catch (err) {
      setError(formatApiError(err, "Could not save teacher."));
    } finally {
      setSaving(false);
    }
  };

  const runLifecycle = async (teacher, action, label) => {
    if (["archive", "deactivate"].includes(action) && !window.confirm(`${label} ${teacher.full_name}?`)) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await instance.post(`/teachers/${teacher.id}/${action}/`);
      setMessage(`${teacher.full_name} updated.`);
      await fetchTeachers();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not update teacher.");
    } finally {
      setSaving(false);
    }
  };

  const deleteTeacher = async (teacher) => {
    if (!window.confirm(`Delete ${teacher.full_name}? This will archive the teacher and deactivate the login account.`)) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await instance.delete(`/teachers/${teacher.id}/`);
      setMessage(`${teacher.full_name} deleted.`);
      await fetchTeachers();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not delete teacher.");
    } finally {
      setSaving(false);
    }
  };

  const archiveSelected = async (rows) => {
    if (!window.confirm(`Archive ${rows.length} selected teacher(s)?`)) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await Promise.all(rows.map((row) => instance.post(`/teachers/${row.id}/archive/`)));
      setMessage("Selected teachers archived.");
      await fetchTeachers();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not archive selected teachers.");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "full_name", label: "Teacher" },
    { key: "username", label: "Username" },
    { key: "email_address", label: "Email" },
    { key: "phone_number", label: "Phone" },
    { key: "department", label: "Department" },
    { key: "subject", label: "Subject" },
    { key: "classes", label: "Batches", accessor: (row) => row.classes?.map((item) => formatBatchLabel(item)).join(", ") || "-" },
    { key: "status", label: "Status", accessor: accountStatus, render: (row) => statusBadge(accountStatus(row)) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        description="Manage teacher profiles, linked login accounts, subjects, departments, and status."
        actions={
          <>
            <button className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700" onClick={fetchTeachers}>
              <RefreshCcw size={16} /> Refresh
            </button>
            <button className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white" onClick={openCreate}>
              <Plus size={16} /> Add Teacher
            </button>
          </>
        }
      />

      {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}
      {error && !modalMode ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Teachers" value={stats.total} accent="border-cyan-600" />
        <StatCard title="Active Accounts" value={stats.active} accent="border-emerald-500" />
        <StatCard title="Inactive Accounts" value={stats.inactive} accent="border-amber-500" />
        <StatCard title="Archived" value={stats.archived} accent="border-gray-400" />
        <StatCard title="Assigned to Batches" value={stats.assigned} accent="border-violet-500" />
      </div>

      <section className="rounded-md bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm md:col-span-1">
            <Search size={16} className="text-gray-400" />
            <input
              className="w-full outline-none"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Search teachers"
            />
          </label>
          <select className={inputClass()} value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Archived">Archived</option>
          </select>
          <select className={inputClass()} value={filters.department} onChange={(event) => setFilters((current) => ({ ...current, department: event.target.value }))}>
            <option value="">All departments</option>
            {departments.map((department) => <option key={department} value={department}>{department}</option>)}
          </select>
          <select className={inputClass()} value={filters.subject} onChange={(event) => setFilters((current) => ({ ...current, subject: event.target.value }))}>
            <option value="">All subjects</option>
            {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
          </select>
        </div>
      </section>

      <DataTable
        title="Teacher Directory"
        columns={columns}
        rows={visibleTeachers}
        loading={loading}
        error={loading ? "" : error}
        empty="No teachers found."
        actions={(row) => [
          { label: "Edit", onClick: () => openEdit(row), icon: Edit },
          row.is_archived
            ? { label: "Restore", onClick: () => runLifecycle(row, "restore", "Restore"), icon: CheckCircle2 }
            : { label: "Archive", onClick: () => runLifecycle(row, "archive", "Archive"), icon: Archive },
          accountStatus(row) === "Active"
            ? { label: "Deactivate", onClick: () => runLifecycle(row, "deactivate", "Deactivate"), icon: ShieldCheck }
            : { label: "Activate", onClick: () => runLifecycle(row, "restore", "Activate"), icon: ShieldCheck },
          { label: "Delete", onClick: () => deleteTeacher(row), icon: Trash2 },
        ].map((action) => ({
          ...action,
          label: action.label,
          onClick: action.onClick,
        }))}
        bulkActions={[
          {
            label: "Archive Selected",
            onClick: archiveSelected,
          },
        ]}
      />

      {modalMode ? (
        <TeacherModal
          mode={modalMode}
          form={form}
          setForm={setForm}
          onClose={closeModal}
          onSubmit={saveTeacher}
          saving={saving}
          error={error}
        />
      ) : null}
    </div>
  );
}
