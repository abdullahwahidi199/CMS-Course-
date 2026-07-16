import { CalendarDays, Mail, MapPin, Phone } from "lucide-react";
import { formatSubscriptionPrice, getRemainingDays, getSubscriptionStatus } from "./subscriptionUtils";
import { Modal, SubscriptionBadge } from "./SuperAdminUi";

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
        <Icon size={14} />
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">{value || "-"}</p>
    </div>
  );
}

export default function TenantDetailsModal({ tenant, onClose, onManageSubscription }) {
  const status = tenant.subscription_status || getSubscriptionStatus(tenant.subscription_expiry);
  const remainingDays = tenant.remaining_days ?? getRemainingDays(tenant.subscription_expiry);

  return (
    <Modal
      title={tenant.name}
      description="Tenant details"
      onClose={onClose}
      footer={
        <div className="flex justify-end">
          <button type="button" onClick={() => onManageSubscription(tenant)} className="rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
            Manage Subscription
          </button>
        </div>
      }
    >
      <div className="grid gap-4">
        <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Current Expiry Date</p>
              <p className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">{tenant.subscription_expiry || "No expiry set"}</p>
            </div>
            <SubscriptionBadge status={status} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <DetailItem icon={CalendarDays} label="Remaining Days" value={remainingDays === null ? "Unlimited" : remainingDays} />
            <DetailItem icon={CalendarDays} label="Subscription Price" value={formatSubscriptionPrice(tenant.subscription_price)} />
            <DetailItem icon={CalendarDays} label="Created" value={tenant.created_at ? new Date(tenant.created_at).toLocaleDateString() : "-"} />
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <DetailItem icon={Mail} label="Email" value={tenant.email} />
          <DetailItem icon={Phone} label="Phone" value={tenant.phone} />
          <div className="sm:col-span-2">
            <DetailItem icon={MapPin} label="Address" value={tenant.address} />
          </div>
        </section>

        {tenant.subscription_notes ? (
          <section className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">Subscription Notes</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">{tenant.subscription_notes}</p>
          </section>
        ) : null}
      </div>
    </Modal>
  );
}
