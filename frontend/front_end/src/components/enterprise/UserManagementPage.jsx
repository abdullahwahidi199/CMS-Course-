import { useMemo, useState } from "react";
import { Filter, Save, X } from "lucide-react";
import DataTable from "../shared/DataTable";
import PageHeader from "../shared/PageHeader";
import {
  apiCreate,
  apiDelete,
  apiPost,
  apiUpdate,
  useApiResource,
} from "../../hooks/useApiResource";

const emptyUser = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: "",
  role: "",
  is_active: true,
};

const assignableRoles = (rows) =>
  rows.filter(
    (role) => !["super-admin", "super_admin", "student"].includes(role.slug),
  );

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

export default function UserManagementPage() {
  const users = useApiResource("/v1/users/");
  const roles = useApiResource("/v1/roles/");
  const visibleRoles = assignableRoles(roles.results);
  const [form, setForm] = useState(emptyUser);
  const [filters, setFilters] = useState({
    username: "",
    name: "",
    role: "",
    status: "",
  });
  const [backendFilters, setBackendFilters] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const saveUser = async (event) => {
    event.preventDefault();
    if (!form.username.trim()) {
      setError("Username is required.");
      return;
    }
    const payload = { ...form, role: form.role || null };
    if (!payload.password) delete payload.password;
    try {
      if (editingId) {
        await apiUpdate(`/v1/users/${editingId}/`, payload);
        setMessage("User updated.");
      } else {
        await apiCreate("/v1/users/", payload);
        setMessage("User created.");
      }
      setForm(emptyUser);
      setEditingId(null);
      setError("");
      await users.refetch(backendFilters);
    } catch (err) {
      setError(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : "Could not save user.",
      );
    }
  };

  const editUser = (user) => {
    setEditingId(user.id);
    setForm({ ...emptyUser, ...user, role: user.role || "", password: "" });
  };

  const action = async (user, name, success) => {
    await apiPost(`/v1/users/${user.id}/${name}/`);
    setMessage(success);
    await users.refetch(backendFilters);
  };

  const resetPassword = async (user) => {
    const password = window.prompt(`Temporary password for ${user.username}`);
    if (!password) return;
    await apiPost(`/v1/users/${user.id}/reset-password/`, { password });
    setMessage("Password reset.");
  };

  const assignRole = async (user) => {
    const role = window.prompt("Enter role id to assign");
    if (!role) return;
    await apiPost(`/v1/users/${user.id}/change-role/`, { role });
    setMessage("Role changed.");
    await users.refetch(backendFilters);
  };

  const bulk = async (rows, actionName) => {
    await apiPost("/v1/users/bulk-action/", {
      user_ids: rows.map((row) => row.id),
      action: actionName,
    });
    setMessage("Bulk action completed.");
    await users.refetch(backendFilters);
  };

  const setBackendFilter = async (key, value) => {
    const next = { ...backendFilters, [key]: value };
    if (!value) delete next[key];
    setBackendFilters(next);
    setFilters((current) => ({ ...current, [key]: value }));
    await users.refetch(next);
  };

  const filteredUsers = useMemo(() => {
    const username = filters.username.trim().toLowerCase();
    const name = filters.name.trim().toLowerCase();
    return users.results.filter((user) => {
      const fullName = `${user.first_name || ""} ${user.last_name || ""}`
        .trim()
        .toLowerCase();
      const usernameMatch =
        !username ||
        String(user.username || "")
          .toLowerCase()
          .includes(username);
      const nameMatch =
        !name ||
        fullName.includes(name) ||
        String(user.first_name || "")
          .toLowerCase()
          .includes(name) ||
        String(user.last_name || "")
          .toLowerCase()
          .includes(name);
      return usernameMatch && nameMatch;
    });
  }, [filters.name, filters.username, users.results]);

  const clearFilters = async () => {
    const emptyFilters = {
      username: "",
      name: "",
      role: "",
      status: "",
    };
    setFilters(emptyFilters);
    setBackendFilters({});
    await users.refetch({});
  };

  const columns = [
    { key: "username", label: "Username" },
    {
      key: "name",
      label: "Name",
      render: (row) =>
        `${row.first_name || ""} ${row.last_name || ""}`.trim() || row.username,
    },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "role_name", label: "Role" },
    {
      key: "is_active",
      label: "Status",
      render: (row) =>
        row.is_active && !row.is_deactivated ? "Active" : "Inactive",
    },
    {
      key: "last_login",
      label: "Last Login",
      render: (row) =>
        row.last_login ? new Date(row.last_login).toLocaleString() : "Never",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Create users, assign roles, control access, and manage account status."
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

      <form className="rounded-md bg-white p-4 shadow-sm" onSubmit={saveUser}>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Username">
            <input
              className={inputClass()}
              value={form.username}
              onChange={(event) =>
                setForm({ ...form, username: event.target.value })
              }
            />
          </Field>
          <Field label="First Name">
            <input
              className={inputClass()}
              value={form.first_name || ""}
              onChange={(event) =>
                setForm({ ...form, first_name: event.target.value })
              }
            />
          </Field>
          <Field label="Last Name">
            <input
              className={inputClass()}
              value={form.last_name || ""}
              onChange={(event) =>
                setForm({ ...form, last_name: event.target.value })
              }
            />
          </Field>
          <Field label="Email">
            <input
              className={inputClass()}
              type="email"
              value={form.email || ""}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
            />
          </Field>
          <Field label="Phone">
            <input
              className={inputClass()}
              value={form.phone || ""}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
            />
          </Field>
          <Field label="Role">
            <select
              className={inputClass()}
              value={form.role || ""}
              onChange={(event) =>
                setForm({ ...form, role: event.target.value })
              }
            >
              <option value="">Select role</option>
              {visibleRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Password">
            <input
              className={inputClass()}
              type="password"
              value={form.password || ""}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
            />
          </Field>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white">
            <Save size={16} /> {editingId ? "Update User" : "Create User"}
          </button>
          <button
            type="button"
            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
            onClick={() => {
              setForm(emptyUser);
              setEditingId(null);
            }}
          >
            Reset
          </button>
        </div>
      </form>

      <div className="rounded-md bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Filter size={18} className="text-cyan-700" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Username">
            <input
              className={inputClass()}
              value={filters.username}
              onChange={(event) =>
                setFilters({ ...filters, username: event.target.value })
              }
              placeholder="Filter by username"
            />
          </Field>
          <Field label="Name">
            <input
              className={inputClass()}
              value={filters.name}
              onChange={(event) =>
                setFilters({ ...filters, name: event.target.value })
              }
              placeholder="First or last name"
            />
          </Field>
          <Field label="Role">
            <select
              className={inputClass()}
              value={filters.role}
              onChange={(event) => setBackendFilter("role", event.target.value)}
            >
              <option value="">Any role</option>
              {visibleRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              className={inputClass()}
              value={filters.status}
              onChange={(event) =>
                setBackendFilter("status", event.target.value)
              }
            >
              <option value="">Any status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
            onClick={clearFilters}
          >
            <X size={16} /> Clear
          </button>
        </div>
      </div>

      <DataTable
        title="Users"
        columns={columns}
        rows={filteredUsers}
        loading={users.loading}
        error={users.error}
        bulkActions={[
          { label: "Activate", onClick: (rows) => bulk(rows, "activate") },
          { label: "Deactivate", onClick: (rows) => bulk(rows, "deactivate") },
          {
            label: "Delete",
            onClick: (rows) =>
              window.confirm(`Delete ${rows.length} users?`) &&
              bulk(rows, "delete"),
          },
        ]}
        actions={(row) => [
          { label: "Edit", onClick: () => editUser(row) },
          { label: "Role", onClick: () => assignRole(row) },
          { label: "Reset Password", onClick: () => resetPassword(row) },
          {
            label: row.is_active ? "Deactivate" : "Activate",
            onClick: () =>
              action(
                row,
                row.is_active ? "deactivate" : "activate",
                "User status updated.",
              ),
          },
          {
            label: "Delete",
            onClick: async () => {
              if (window.confirm(`Delete ${row.username}?`)) {
                await apiDelete(`/v1/users/${row.id}/`);
                await users.refetch(backendFilters);
              }
            },
          },
        ]}
      />
    </div>
  );
}
