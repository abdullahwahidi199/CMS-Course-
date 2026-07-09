export function PanelShell({ title, subtitle, loading, error, children, actions }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {loading ? <SkeletonLoader /> : null}
      {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {!loading && !error ? children : null}
    </section>
  );
}

export function StatTile({ label, value, detail }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <p className="text-xs font-medium uppercase text-gray-500">{label}</p>
      <p className="mt-1 break-words text-xl font-semibold text-gray-900">{value}</p>
      {detail ? <p className="mt-1 text-xs text-gray-500">{detail}</p> : null}
    </div>
  );
}

export function EmptyState({ children = "No records found." }) {
  return <p className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">{children}</p>;
}

export function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-40 rounded bg-slate-200" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-20 rounded-xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
