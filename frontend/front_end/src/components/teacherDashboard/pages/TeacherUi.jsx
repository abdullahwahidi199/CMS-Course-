import { AlertTriangle, CheckCircle2, Search, X } from "lucide-react";

export function Panel({ title, description, actions, children, className = "" }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {(title || description || actions) ? (
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div>
            {title ? <h3 className="text-sm font-semibold text-slate-950 dark:text-white">{title}</h3> : null}
            {description ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function StatTile({ icon: Icon, label, value, helper, tone = "cyan" }) {
  const tones = {
    cyan: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    violet: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md ${tones[tone] || tones.cyan}`}>
        <Icon size={20} />
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{value ?? 0}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helper}</p> : null}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = "Search" }) {
  return (
    <label className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950">
      <Search size={16} className="text-slate-400" />
      <input
        className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

export function EmptyState({ title = "No records found", description = "There is nothing to show yet.", action }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
      {message}
    </div>
  );
}

export function LoadingSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
      ))}
    </div>
  );
}

export function Toast({ toast, onClose }) {
  if (!toast?.message) return null;
  const positive = toast.type !== "error";
  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-lg border bg-white p-4 shadow-xl dark:bg-slate-900">
      <div className="flex gap-3">
        {positive ? <CheckCircle2 className="mt-0.5 text-emerald-600" size={20} /> : <AlertTriangle className="mt-0.5 text-red-600" size={20} />}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-950 dark:text-white">{positive ? "Saved" : "Action failed"}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{toast.message}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", tone = "danger", onCancel, onConfirm }) {
  if (!open) return null;
  const buttonClass = tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-cyan-700 hover:bg-cyan-800";
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-3 sm:items-center">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl dark:bg-slate-900">
        <h3 className="text-base font-semibold text-slate-950 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${buttonClass}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
