import { Fragment, useEffect, useState } from "react";
import DataTable from "../shared/DataTable";
import PageHeader from "../shared/PageHeader";
import { apiCreate, apiDelete, apiPost, apiUpdate, useApiResource } from "../../hooks/useApiResource";

const emptyRole = { name: "", slug: "", description: "", is_active: true, permissions: [] };

function inputClass() {
  return "w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-cyan-600";
}

export default function RoleManagementPage() {
  const roles = useApiResource("/v1/roles/");
  const matrix = useApiResource("/v1/roles/matrix/");
  const [form, setForm] = useState(emptyRole);
  const [editingId, setEditingId] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (matrix.data?.groups) {
      setExpanded(Object.fromEntries(Object.keys(matrix.data.groups).map((module) => [module, true])));
    }
  }, [matrix.data]);

  const saveRole = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Role name is required.");
      return;
    }
    try {
      if (editingId) {
        await apiUpdate(`/v1/roles/${editingId}/`, form);
        setMessage("Role updated.");
      } else {
        await apiCreate("/v1/roles/", form);
        setMessage("Role created.");
      }
      setForm(emptyRole);
      setEditingId(null);
      setError("");
      await Promise.all([roles.refetch(), matrix.refetch()]);
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "Could not save role.");
    }
  };

  const togglePermission = async (role, permission, enabled) => {
    await apiPost("/v1/roles/set-permission/", { role: role.id, permission: permission.id, enabled });
    await matrix.refetch();
  };

  const toggleModule = async (role, permissions, enabled) => {
    await Promise.all(permissions.map((permission) => apiPost("/v1/roles/set-permission/", { role: role.id, permission: permission.id, enabled })));
    await matrix.refetch();
  };

  const cloneRole = async (role) => {
    const name = window.prompt("Clone role name", `${role.name} Copy`);
    if (!name) return;
    await apiPost(`/v1/roles/${role.id}/clone/`, { name });
    setMessage("Role cloned.");
    await Promise.all([roles.refetch(), matrix.refetch()]);
  };

  const columns = [
    { key: "name", label: "Role" },
    { key: "slug", label: "Slug" },
    { key: "user_count", label: "Users" },
    { key: "is_system", label: "System", render: (row) => (row.is_system ? "Yes" : "No") },
    { key: "is_active", label: "Status", render: (row) => (row.is_active ? "Active" : "Inactive") },
  ];

  const matrixRoles = matrix.data?.roles || [];
  const groups = matrix.data?.groups || {};

  return (
    <div className="space-y-6">
      <PageHeader title="Roles & Permissions" description="Create custom roles and manage access through a permission matrix." />
      {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <form className="rounded-md bg-white p-4 shadow-sm" onSubmit={saveRole}>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_2fr_auto] md:items-end">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Name</span>
            <input className={inputClass()} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Slug</span>
            <input className={inputClass()} value={form.slug || ""} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Description</span>
            <input className={inputClass()} value={form.description || ""} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <button className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white">{editingId ? "Update" : "Create"}</button>
        </div>
      </form>

      <DataTable
        title="Role List"
        columns={columns}
        rows={roles.results}
        loading={roles.loading}
        error={roles.error}
        actions={(row) => [
          { label: "Edit", onClick: () => { setEditingId(row.id); setForm({ ...emptyRole, ...row, permissions: row.permissions || [] }); } },
          { label: "Clone", onClick: () => cloneRole(row) },
          { label: "Delete", onClick: async () => { if (window.confirm(`Delete ${row.name}?`)) { await apiDelete(`/v1/roles/${row.id}/`); await roles.refetch(); } } },
        ]}
      />

      <section className="rounded-md bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900">Permission Matrix</h3>
          <div className="flex gap-2 text-sm">
            <button className="rounded-md border border-gray-200 px-3 py-1" onClick={() => setExpanded(Object.fromEntries(Object.keys(groups).map((module) => [module, true])))}>Expand All</button>
            <button className="rounded-md border border-gray-200 px-3 py-1" onClick={() => setExpanded({})}>Collapse All</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Permission</th>
                {matrixRoles.map((role) => <th key={role.id} className="px-4 py-3 text-center font-semibold text-gray-600">{role.name}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.entries(groups).map(([module, permissions]) => (
                <Fragment key={module}>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      <button className="mr-2 text-cyan-700" onClick={() => setExpanded((current) => ({ ...current, [module]: !current[module] }))}>
                        {expanded[module] ? "-" : "+"}
                      </button>
                      {module.replaceAll("_", " ")}
                    </td>
                    {matrixRoles.map((role) => {
                      const allEnabled = permissions.every((permission) => role.permission_codes?.includes(permission.code));
                      return (
                        <td key={role.id} className="px-4 py-3 text-center">
                          <input type="checkbox" checked={allEnabled} onChange={(event) => toggleModule(role, permissions, event.target.checked)} />
                        </td>
                      );
                    })}
                  </tr>
                  {expanded[module] ? permissions.map((permission) => (
                    <tr key={permission.code}>
                      <td className="px-8 py-2 text-gray-700">{permission.label}</td>
                      {matrixRoles.map((role) => (
                        <td key={role.id} className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={role.permission_codes?.includes(permission.code) || false}
                            onChange={(event) => togglePermission(role, permission, event.target.checked)}
                          />
                        </td>
                      ))}
                    </tr>
                  )) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
