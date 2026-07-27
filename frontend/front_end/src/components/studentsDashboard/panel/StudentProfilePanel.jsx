import { User } from "lucide-react";
import { useApiResource } from "../../../hooks/useApiResource";
import { formatBatchLabel } from "../../../utils/batchLabel";
import { PanelShell, StatTile } from "./PanelShell";

export default function StudentProfilePanel() {
  const profile = useApiResource("/student/profile/");
  const data = profile.data || {};

  return (
    <PanelShell title="Student Information" subtitle="Identity and guardian contact details." loading={profile.loading} error={profile.error}>
      <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
        <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-slate-50 p-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-50 text-2xl font-bold text-cyan-800">
            {data.name?.charAt(0) || <User size={28} />}
          </div>
          <p className="mt-3 font-semibold text-gray-900">{data.name || "Student"}</p>
          <p className="text-sm text-gray-500">{data.roll_number || "No roll number"}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <StatTile label="Father" value={data.father_name || "N/A"} />
          <StatTile label="Phone" value={data.parent_mobile_number || data.phone || "N/A"} />
          <StatTile label="Status" value={data.status || "N/A"} />
          <StatTile label="Current Course" value={data.current_course || "N/A"} />
          <StatTile
            label="Current Batch"
            value={formatBatchLabel(
              {
                course_name: data.current_course,
                batch_name: data.current_batch,
              },
              "N/A",
            )}
          />
          <StatTile label="Enrollment Date" value={data.enrollment_date || "N/A"} />
          <div className="sm:col-span-2 xl:col-span-3">
            <StatTile label="Address" value={data.address || "N/A"} detail={data.email || data.username || ""} />
          </div>
        </div>
      </div>
    </PanelShell>
  );
}
