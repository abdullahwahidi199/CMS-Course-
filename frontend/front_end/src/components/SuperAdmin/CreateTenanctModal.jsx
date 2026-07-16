import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import instance from "../../api/axiosInstance";
import { Modal } from "./SuperAdminUi";

const inputClass = "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-700 focus:ring-4 focus:ring-cyan-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-950";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

export default function CreateTenantModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    expiry_date: "",
    subscription_price: "",
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await instance.post("/create-tenant/", form);
      onSuccess?.(response.data);
      onClose();
    } catch (err) {
      const data = err?.response?.data || {};
      setError(data.error || data.subscription_price || data.expiry_date || "Something went wrong while creating tenant.");
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button type="button" onClick={onClose} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
        Cancel
      </button>
      <button type="submit" form="create-tenant-form" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
        {loading ? "Creating..." : "Create"}
      </button>
    </div>
  );

  return (
    <Modal title="Create Tenant" description="Add a school and its first admin account." onClose={onClose} footer={footer}>
      {error ? <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">{error}</div> : null}
      <form id="create-tenant-form" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Tenant Name">
          <input name="name" className={inputClass} onChange={handleChange} value={form.name} required />
        </Field>
        <Field label="Email">
          <input type="email" name="email" className={inputClass} onChange={handleChange} value={form.email} />
        </Field>
        <Field label="Phone">
          <input name="phone" className={inputClass} onChange={handleChange} value={form.phone} />
        </Field>
        <Field label="Subscription Expiry Date">
          <input type="date" name="expiry_date" className={inputClass} onChange={handleChange} value={form.expiry_date} />
        </Field>
        <Field label="Subscription Price">
          <input type="number" name="subscription_price" min="0" step="0.01" className={inputClass} onChange={handleChange} value={form.subscription_price} placeholder="0.00" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Address">
            <input name="address" className={inputClass} onChange={handleChange} value={form.address} />
          </Field>
        </div>
        <div className="border-t border-slate-100 pt-4 sm:col-span-2 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-950 dark:text-white">Admin Account</p>
        </div>
        <Field label="Admin Username">
          <input name="username" className={inputClass} onChange={handleChange} value={form.username} required />
        </Field>
        <Field label="Admin Password">
          <input type="password" name="password" className={inputClass} onChange={handleChange} value={form.password} required />
        </Field>
      </form>
    </Modal>
  );
}
