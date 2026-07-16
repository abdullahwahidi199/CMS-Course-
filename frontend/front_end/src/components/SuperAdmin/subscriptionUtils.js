export function todayDate() {
  return new Date(new Date().toDateString());
}

export function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function addMonths(value, months) {
  const base = value ? new Date(`${value}T00:00:00`) : todayDate();
  const source = Number.isNaN(base.getTime()) ? todayDate() : base;
  const day = source.getDate();
  const next = new Date(source);
  next.setMonth(next.getMonth() + months);
  if (next.getDate() !== day) next.setDate(0);
  return next.toISOString().slice(0, 10);
}

export function getRemainingDays(expiryDate) {
  if (!expiryDate) return null;
  const expiry = new Date(`${expiryDate}T00:00:00`);
  if (Number.isNaN(expiry.getTime())) return null;
  return Math.ceil((expiry - todayDate()) / 86400000);
}

export function getSubscriptionStatus(expiryDate) {
  const remainingDays = getRemainingDays(expiryDate);
  if (remainingDays === null) return "active";
  if (remainingDays < 0) return "expired";
  if (remainingDays <= 7) return "expiring_soon";
  return "active";
}

export function statusLabel(status) {
  return {
    active: "Active",
    expiring_soon: "Expiring Soon",
    expired: "Expired",
  }[status] || "Active";
}

export function formatSubscriptionPrice(value) {
  const amount = Number(value || 0);
  if (Number.isNaN(amount)) return "0.00";
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
