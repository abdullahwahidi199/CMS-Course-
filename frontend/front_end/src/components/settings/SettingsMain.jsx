import { useContext, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Building2,
  Camera,
  CheckCircle2,
  KeyRound,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import instance from "../../api/axiosInstance";
import { AuthContext } from "../../AuthProvider";
import PageHeader from "../shared/PageHeader";
import { mediaUrl } from "../../utils/mediaUrl";

const emptyTenant = {
  name: "",
  phone: "",
  email: "",
  address: "",
  logo: "",
  is_active: true,
  subscription_expiry: "",
  created_at: "",
  notification_settings: {},
};

const notificationOptions = [
  ["fee_due", "Fee due reminders"],
  ["fee_overdue", "Overdue fee alerts"],
  ["payment_received", "Payment received alerts"],
  ["inventory_low", "Low inventory alerts"],
  ["stationery_sale", "Stationery sale alerts"],
  ["assessment_published", "Assessment published alerts"],
  ["exam_reminder", "Exam reminders"],
  ["admin_copies", "Send admin copies"],
];

const defaultNotificationSettings = Object.fromEntries(
  notificationOptions.map(([key]) => [key, true]),
);

const emptyAccount = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  avatar: "",
};

const emptyPassword = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

function fieldClass() {
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

function Notice({ type, children }) {
  if (!children) return null;
  const styles =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";
  return <div className={`rounded-md border p-3 text-sm ${styles}`}>{children}</div>;
}

export default function SettingsMain() {
  const { user, tenant: authTenant, hydrate } = useContext(AuthContext);
  const [tenantForm, setTenantForm] = useState(emptyTenant);
  const [accountForm, setAccountForm] = useState(emptyAccount);
  const [passwordForm, setPasswordForm] = useState(emptyPassword);
  const [loading, setLoading] = useState({
    tenant: false,
    account: false,
    password: false,
    initial: true,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canEditTenant =
    user?.is_super_admin || user?.role_slug === "admin" || user?.role_details?.slug === "admin";

  const logoPreview = useMemo(() => {
    if (tenantForm.logo instanceof File) return URL.createObjectURL(tenantForm.logo);
    return mediaUrl(tenantForm.logo);
  }, [tenantForm.logo]);

  const avatarPreview = useMemo(() => {
    if (accountForm.avatar instanceof File) return URL.createObjectURL(accountForm.avatar);
    return mediaUrl(accountForm.avatar);
  }, [accountForm.avatar]);

  useEffect(() => {
    return () => {
      if (tenantForm.logo instanceof File && logoPreview) URL.revokeObjectURL(logoPreview);
      if (accountForm.avatar instanceof File && avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [tenantForm.logo, accountForm.avatar, logoPreview, avatarPreview]);

  const loadSettings = async () => {
    setLoading((current) => ({ ...current, initial: true }));
    setError("");
    try {
      const response = await instance.get("/get-tenant/");
      setTenantForm({ ...emptyTenant, ...response.data });
      setAccountForm({
        ...emptyAccount,
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        avatar: user?.avatar || "",
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Could not load settings.");
      if (authTenant) setTenantForm({ ...emptyTenant, ...authTenant });
    } finally {
      setLoading((current) => ({ ...current, initial: false }));
    }
  };

  useEffect(() => {
    loadSettings();
  }, [user?.id]);

  const updateTenantField = (event) => {
    const { name, value, files } = event.target;
    setTenantForm((current) => ({
      ...current,
      [name]: files ? files[0] || current[name] : value,
    }));
  };

  const toggleNotification = (key) => {
    setTenantForm((current) => ({
      ...current,
      notification_settings: {
        ...defaultNotificationSettings,
        ...(current.notification_settings || {}),
        [key]: !({ ...defaultNotificationSettings, ...(current.notification_settings || {}) }[key]),
      },
    }));
  };

  const updateAccountField = (event) => {
    const { name, value, files } = event.target;
    setAccountForm((current) => ({
      ...current,
      [name]: files ? files[0] || current[name] : value,
    }));
  };

  const saveTenant = async (event) => {
    event.preventDefault();
    if (!tenantForm.name.trim()) {
      setError("Institution name is required.");
      return;
    }
    setLoading((current) => ({ ...current, tenant: true }));
    setMessage("");
    setError("");
    try {
      const formData = new FormData();
      ["name", "phone", "email", "address"].forEach((field) => {
        formData.append(field, tenantForm[field] || "");
      });
      formData.append(
        "notification_settings",
        JSON.stringify({
          ...defaultNotificationSettings,
          ...(tenantForm.notification_settings || {}),
        }),
      );
      if (tenantForm.logo instanceof File) formData.append("logo", tenantForm.logo);
      const response = await instance.patch("/update-tenant/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setTenantForm({ ...emptyTenant, ...response.data });
      await hydrate();
      setMessage("Institution settings saved.");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          (err.response?.data ? JSON.stringify(err.response.data) : "Could not save institution settings."),
      );
    } finally {
      setLoading((current) => ({ ...current, tenant: false }));
    }
  };

  const saveAccount = async (event) => {
    event.preventDefault();
    setLoading((current) => ({ ...current, account: true }));
    setMessage("");
    setError("");
    try {
      const formData = new FormData();
      ["first_name", "last_name", "email", "phone"].forEach((field) => {
        formData.append(field, accountForm[field] || "");
      });
      if (accountForm.avatar instanceof File) formData.append("avatar", accountForm.avatar);
      const response = await instance.patch("/auth/profile/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAccountForm({
        ...emptyAccount,
        first_name: response.data.first_name || "",
        last_name: response.data.last_name || "",
        email: response.data.email || "",
        phone: response.data.phone || "",
        avatar: response.data.avatar || "",
      });
      await hydrate();
      setMessage("Account profile saved.");
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "Could not save account profile.");
    } finally {
      setLoading((current) => ({ ...current, account: false }));
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError("New password and confirmation do not match.");
      return;
    }
    setLoading((current) => ({ ...current, password: true }));
    setMessage("");
    setError("");
    try {
      await instance.post("/auth/change-password/", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm(emptyPassword);
      setMessage("Password changed.");
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "Could not change password.");
    } finally {
      setLoading((current) => ({ ...current, password: false }));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Institution identity, account profile, access security, and system status." />

      <Notice>{message}</Notice>
      <Notice type="error">{error}</Notice>

      <section className="rounded-md bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Building2 size={18} className="text-cyan-700" />
          <h3 className="font-semibold text-gray-900">Institution Profile</h3>
        </div>
        <form className="grid gap-4 lg:grid-cols-[160px_1fr]" onSubmit={saveTenant}>
          <div className="space-y-3">
            <div className="flex h-32 w-32 items-center justify-center rounded-md border border-gray-200 bg-gray-50">
              {logoPreview ? (
                <img src={logoPreview} alt={tenantForm.name || "Institution logo"} className="h-full w-full object-contain p-2" />
              ) : (
                <Building2 size={36} className="text-gray-400" />
              )}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
              <Camera size={15} />
              Logo
              <input type="file" name="logo" accept="image/*" className="hidden" onChange={updateTenantField} disabled={!canEditTenant} />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Institution Name">
              <input className={fieldClass()} name="name" value={tenantForm.name || ""} onChange={updateTenantField} disabled={!canEditTenant} />
            </Field>
            <Field label="Phone">
              <input className={fieldClass()} name="phone" value={tenantForm.phone || ""} onChange={updateTenantField} disabled={!canEditTenant} />
            </Field>
            <Field label="Email">
              <input className={fieldClass()} type="email" name="email" value={tenantForm.email || ""} onChange={updateTenantField} disabled={!canEditTenant} />
            </Field>
            <Field label="Subscription Expiry">
              <input className={`${fieldClass()} bg-gray-50`} value={tenantForm.subscription_expiry || "Not set"} disabled />
            </Field>
            <div className="md:col-span-2">
              <Field label="Address">
                <textarea className={fieldClass()} name="address" rows={3} value={tenantForm.address || ""} onChange={updateTenantField} disabled={!canEditTenant} />
              </Field>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={!canEditTenant || loading.tenant}>
                <Save size={16} />
                {loading.tenant ? "Saving..." : "Save Institution"}
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="rounded-md bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Bell size={18} className="text-cyan-700" />
          <h3 className="font-semibold text-gray-900">Notification Settings</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {notificationOptions.map(([key, label]) => {
            const settings = {
              ...defaultNotificationSettings,
              ...(tenantForm.notification_settings || {}),
            };
            const enabled = Boolean(settings[key]);
            return (
              <button
                key={key}
                type="button"
                className={`flex items-center justify-between rounded-md border p-3 text-left text-sm ${
                  enabled
                    ? "border-cyan-200 bg-cyan-50 text-cyan-900"
                    : "border-gray-200 bg-white text-gray-500"
                }`}
                onClick={() => toggleNotification(key)}
                disabled={!canEditTenant}
              >
                <span className="font-medium">{label}</span>
                <span
                  className={`ml-3 h-5 w-9 rounded-full p-0.5 transition ${
                    enabled ? "bg-cyan-700" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`block h-4 w-4 rounded-full bg-white transition ${
                      enabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            onClick={saveTenant}
            disabled={!canEditTenant || loading.tenant}
          >
            <Save size={16} />
            {loading.tenant ? "Saving..." : "Save Notification Settings"}
          </button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-md bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <User size={18} className="text-cyan-700" />
            <h3 className="font-semibold text-gray-900">My Account</h3>
          </div>
          <form className="grid gap-4" onSubmit={saveAccount}>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-gray-50 overflow-hidden">
                {avatarPreview ? <img src={avatarPreview} alt={user?.username || "Avatar"} className="h-full w-full object-cover" /> : <User size={24} className="text-gray-400" />}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
                <Camera size={15} />
                Avatar
                <input type="file" name="avatar" accept="image/*" className="hidden" onChange={updateAccountField} />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="First Name">
                <input className={fieldClass()} name="first_name" value={accountForm.first_name || ""} onChange={updateAccountField} />
              </Field>
              <Field label="Last Name">
                <input className={fieldClass()} name="last_name" value={accountForm.last_name || ""} onChange={updateAccountField} />
              </Field>
              <Field label="Email">
                <input className={fieldClass()} type="email" name="email" value={accountForm.email || ""} onChange={updateAccountField} />
              </Field>
              <Field label="Phone">
                <input className={fieldClass()} name="phone" value={accountForm.phone || ""} onChange={updateAccountField} />
              </Field>
            </div>
            <div className="flex justify-end">
              <button className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={loading.account}>
                <Save size={16} />
                {loading.account ? "Saving..." : "Save Account"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-md bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound size={18} className="text-cyan-700" />
            <h3 className="font-semibold text-gray-900">Password</h3>
          </div>
          <form className="grid gap-4" onSubmit={changePassword}>
            <Field label="Current Password">
              <input className={fieldClass()} type="password" value={passwordForm.current_password} onChange={(event) => setPasswordForm({ ...passwordForm, current_password: event.target.value })} />
            </Field>
            <Field label="New Password">
              <input className={fieldClass()} type="password" value={passwordForm.new_password} onChange={(event) => setPasswordForm({ ...passwordForm, new_password: event.target.value })} />
            </Field>
            <Field label="Confirm New Password">
              <input className={fieldClass()} type="password" value={passwordForm.confirm_password} onChange={(event) => setPasswordForm({ ...passwordForm, confirm_password: event.target.value })} />
            </Field>
            <div className="flex justify-end">
              <button className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={loading.password}>
                <KeyRound size={16} />
                {loading.password ? "Changing..." : "Change Password"}
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className="rounded-md bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck size={18} className="text-cyan-700" />
          <h3 className="font-semibold text-gray-900">System Status</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border border-gray-200 p-3 text-sm">
            <div className="flex items-center gap-2 text-gray-500"><CheckCircle2 size={15} /> Tenant</div>
            <p className="mt-1 font-semibold text-gray-900">{tenantForm.is_active ? "Active" : "Inactive"}</p>
          </div>
          <div className="rounded-md border border-gray-200 p-3 text-sm">
            <div className="flex items-center gap-2 text-gray-500"><ShieldCheck size={15} /> Role</div>
            <p className="mt-1 font-semibold text-gray-900">{user?.role_details?.name || user?.role_slug || "Unassigned"}</p>
          </div>
          <div className="rounded-md border border-gray-200 p-3 text-sm">
            <div className="flex items-center gap-2 text-gray-500"><Mail size={15} /> Username</div>
            <p className="mt-1 font-semibold text-gray-900">{user?.username || "N/A"}</p>
          </div>
          <div className="rounded-md border border-gray-200 p-3 text-sm">
            <div className="flex items-center gap-2 text-gray-500"><Phone size={15} /> Last Login</div>
            <p className="mt-1 font-semibold text-gray-900">{user?.last_login ? new Date(user.last_login).toLocaleString() : "N/A"}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
