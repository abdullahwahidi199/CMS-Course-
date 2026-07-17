import { AlertTriangle, CheckCircle2, Search, X } from "lucide-react";

export function Panel({ title, description, actions, children, className = "" }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>
      {(title || description || actions) ? (
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title ? <h3 className="text-sm font-semibold text-slate-950">{title}</h3> : null}
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
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
    cyan: "bg-cyan-50 text-cyan-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md ${tones[tone] || tones.cyan}`}>
        <Icon size={20} />
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value ?? 0}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = "Search" }) {
  return (
    <label className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm">
      <Search size={16} className="text-slate-400" />
      <input
        className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

export function EmptyState({ title = "No records found", description = "There is nothing to show yet.", action }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
      {message}
    </div>
  );
}

export function LoadingSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-lg bg-slate-200" />
      ))}
    </div>
  );
}

export function Toast({ toast, onClose }) {
  if (!toast?.message) return null;
  const positive = toast.type !== "error";
  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-lg border bg-white p-4 shadow-xl">
      <div className="flex gap-3">
        {positive ? <CheckCircle2 className="mt-0.5 text-emerald-600" size={20} /> : <AlertTriangle className="mt-0.5 text-red-600" size={20} />}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-950">{positive ? "Saved" : "Action failed"}</p>
          <p className="mt-1 text-sm text-slate-500">{toast.message}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
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
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
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
