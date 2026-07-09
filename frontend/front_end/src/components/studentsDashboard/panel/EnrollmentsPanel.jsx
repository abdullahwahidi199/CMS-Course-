import { useApiResource } from "../../../hooks/useApiResource";
import { EmptyState, PanelShell } from "./PanelShell";

function EnrollmentList({ rows }) {
  if (!rows?.length) return <EmptyState>No enrollments in this section.</EmptyState>;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.id} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{row.course_name}</p>
              <p className="text-sm text-gray-500">{row.batch_name}</p>
            </div>
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">{row.status}</span>
          </div>
          <div className="mt-3 h-2 rounded bg-gray-100">
            <div className="h-2 rounded bg-cyan-700" style={{ width: `${row.progress || 0}%` }} />
          </div>
          <p className="mt-2 text-xs text-gray-500">{row.start_date || row.enrollment_date} to {row.end_date || "ongoing"}</p>
          <p className="mt-1 text-xs text-gray-500">{row.teachers?.length ? row.teachers.join(", ") : "No teachers assigned"}</p>
        </div>
      ))}
    </div>
  );
}

export default function EnrollmentsPanel() {
  const resource = useApiResource("/student/enrollments/");
  const data = resource.data || {};
  return (
    <PanelShell title="Courses and Batches" subtitle="Current and past enrollments." loading={resource.loading} error={resource.error}>
      <div className="space-y-4">
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-700">Current</h4>
          <EnrollmentList rows={data.current_enrollments || []} />
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-700">History</h4>
          <EnrollmentList rows={data.past_enrollments || []} />
        </div>
      </div>
    </PanelShell>
  );
}
