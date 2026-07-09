import { Link } from "react-router-dom";
import { BookOpen, Clock, MapPin, Users } from "lucide-react";
import { useApiResource } from "../../../hooks/useApiResource";
import TeacherPageShell from "./TeacherPageShell";

export default function TeacherClassesPage() {
  const profile = useApiResource("/teacher/profile/");
  const classes = profile.data?.classes || [];

  return (
    <TeacherPageShell title="My Classes" description="Assigned courses and batches with quick access to students, marks, and assignments.">
      {profile.loading ? <div className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">Loading classes...</div> : null}
      {profile.error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{profile.error}</div> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {classes.map((item) => (
          <Link key={item.id} to={`/teacher/dashboard/classes/${item.id}`} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase text-cyan-700">{item.course_name || "Course"}</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">{item.name}</h3>
              </div>
              <div className="rounded-xl bg-cyan-50 p-2 text-cyan-700">
                <BookOpen size={20} />
              </div>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p className="flex items-center gap-2"><Clock size={16} /> {item.start_time || "-"} - {item.end_time || "-"}</p>
              <p className="flex items-center gap-2"><MapPin size={16} /> {item.roomOfClass_details?.name || "No room assigned"}</p>
              <p className="flex items-center gap-2"><Users size={16} /> Capacity {item.capacity || 0}</p>
            </div>
          </Link>
        ))}
      </div>
      {!profile.loading && !classes.length ? <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No classes assigned.</div> : null}
    </TeacherPageShell>
  );
}
