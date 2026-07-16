import { Building2, CalendarClock, LogOut, Plus, RefreshCcw, ShieldCheck, UserCircle } from "lucide-react";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../AuthProvider";
import instance from "../../api/axiosInstance";
import DataTable from "../shared/DataTable";
import CreateTenantModal from "./CreateTenanctModal";
import ProfileModal from "./ProfileModal";
import SubscriptionModal from "./SubscriptionModal";
import TenantDetailsModal from "./TenantDetailsModal";
import { EmptyState, LoadingSkeleton, SubscriptionBadge, Toast } from "./SuperAdminUi";
import { formatSubscriptionPrice, getRemainingDays, getSubscriptionStatus } from "./subscriptionUtils";

function StatCard({ icon: Icon, label, value, helper }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{value}</p>
          {helper ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helper}</p> : null}
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-md bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
          <Icon size={20} />
        </div>
      </div>
    </article>
  );
}

export default function SuperAdminMain() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [detailsTenant, setDetailsTenant] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await instance.get("/super-admin/tenants/");
      setTenants(response.data || []);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not load tenants.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const enrichedTenants = useMemo(
    () =>
      tenants.map((tenant) => ({
        ...tenant,
        subscription_status: tenant.subscription_status || getSubscriptionStatus(tenant.subscription_expiry),
        remaining_days: tenant.remaining_days ?? getRemainingDays(tenant.subscription_expiry),
      })),
    [tenants],
  );

  const stats = useMemo(() => {
    const active = enrichedTenants.filter((tenant) => tenant.subscription_status === "active").length;
    const expiring = enrichedTenants.filter((tenant) => tenant.subscription_status === "expiring_soon").length;
    const expired = enrichedTenants.filter((tenant) => tenant.subscription_status === "expired").length;
    return { active, expiring, expired, total: enrichedTenants.length };
  }, [enrichedTenants]);

  const replaceTenant = (updatedTenant) => {
    setTenants((current) => current.map((tenant) => (tenant.id === updatedTenant.id ? updatedTenant : tenant)));
    setDetailsTenant((current) => (current?.id === updatedTenant.id ? updatedTenant : current));
    setToast({ message: "Subscription updated. Tenant access will follow the new expiry date." });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const columns = [
    { key: "name", label: "Tenant" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "subscription_expiry", label: "Expiry Date", render: (row) => row.subscription_expiry || "-" },
    { key: "subscription_price", label: "Price", render: (row) => formatSubscriptionPrice(row.subscription_price) },
    {
      key: "remaining_days",
      label: "Remaining",
      render: (row) => (row.remaining_days === null ? "Unlimited" : `${row.remaining_days} days`),
    },
    {
      key: "subscription_status",
      label: "Status",
      render: (row) => <SubscriptionBadge status={row.subscription_status} />,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-cyan-700 dark:text-cyan-300">Super Admin</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">Tenant Management</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Create tenants, review subscription health, and update expiry dates from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowProfileModal(true)} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              <UserCircle size={16} />
              {user?.username || "Profile"}
            </button>
            <button type="button" onClick={handleLogout} className="inline-flex items-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950">
              <LogOut size={16} />
              Logout
            </button>
            <button type="button" onClick={fetchTenants} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              <RefreshCcw size={16} />
              Refresh
            </button>
            <button type="button" onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
              <Plus size={16} />
              Create Tenant
            </button>
          </div>
        </header>

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              <StatCard icon={Building2} label="Total Tenants" value={stats.total} helper="All registered schools" />
              <StatCard icon={ShieldCheck} label="Active" value={stats.active} helper="More than 7 days left" />
              <StatCard icon={CalendarClock} label="Expiring Soon" value={stats.expiring} helper="Within 7 days" />
              <StatCard icon={CalendarClock} label="Expired" value={stats.expired} helper="Redirected by ProtectedRoute" />
            </section>

            {enrichedTenants.length === 0 && !error ? (
              <EmptyState
                title="No tenants yet"
                description="Create the first tenant to start managing access and subscriptions."
                action={
                  <button type="button" onClick={() => setShowCreateModal(true)} className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
                    Create Tenant
                  </button>
                }
              />
            ) : (
              <DataTable
                title="Tenants"
                columns={columns}
                rows={enrichedTenants}
                loading={false}
                error={error}
                empty="No tenants found"
                actions={(row) => [
                  { label: "Details", onClick: () => setDetailsTenant(row) },
                  { label: "Subscription", onClick: () => setSelectedTenant(row) },
                ]}
              />
            )}
          </>
        )}
      </div>

      {showCreateModal ? (
        <CreateTenantModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            setToast({ message: "Tenant created." });
            fetchTenants();
          }}
        />
      ) : null}

      {showProfileModal ? (
        <ProfileModal
          onClose={() => setShowProfileModal(false)}
          onNotify={(message) => setToast({ message })}
        />
      ) : null}

      {detailsTenant ? (
        <TenantDetailsModal
          tenant={detailsTenant}
          onClose={() => setDetailsTenant(null)}
          onManageSubscription={(tenant) => {
            setDetailsTenant(null);
            setSelectedTenant(tenant);
          }}
        />
      ) : null}

      {selectedTenant ? (
        <SubscriptionModal tenant={selectedTenant} onClose={() => setSelectedTenant(null)} onSaved={replaceTenant} />
      ) : null}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </main>
  );
}
