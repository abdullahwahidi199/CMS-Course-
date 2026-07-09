import { Mail, Phone, School, User } from "lucide-react";
import { useApiResource } from "../../../hooks/useApiResource";
import TeacherPageShell from "./TeacherPageShell";

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 inline-flex rounded-xl bg-cyan-50 p-2 text-cyan-700">
        <Icon size={18} />
      </div>
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value || "-"}</p>
    </div>
  );
}

export default function TeacherProfilePage() {
  const profile = useApiResource("/teacher/profile/");
  const teacher = profile.data || {};
  return (
    <TeacherPageShell title="My Profile" description="Profile, account, department, and assigned batch information.">
      {profile.loading ? <div className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">Loading profile...</div> : null}
      {profile.error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{profile.error}</div> : null}
      {!profile.loading && !profile.error ? (
        <>
          <section className="rounded-2xl bg-gradient-to-r from-cyan-700 to-slate-900 p-5 text-white shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15 text-2xl font-bold">
                {(teacher.full_name || "T").charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-2xl font-semibold">{teacher.full_name}</h3>
                <p className="text-sm text-cyan-100">{teacher.subject || "Subject"} / {teacher.department || "Department"}</p>
              </div>
            </div>
          </section>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <InfoCard icon={User} label="Username" value={teacher.username} />
            <InfoCard icon={Mail} label="Email" value={teacher.email_address} />
            <InfoCard icon={Phone} label="Phone" value={teacher.phone_number} />
            <InfoCard icon={School} label="Assigned Batches" value={teacher.classes?.length || 0} />
          </div>
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Assigned Classes</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {(teacher.classes || []).map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="font-semibold text-slate-900">{item.course_name ? `${item.course_name} / ` : ""}{item.name}</p>
                  <p className="text-sm text-slate-500">{item.start_time || "-"} - {item.end_time || "-"}</p>
                </div>
              ))}
              {!teacher.classes?.length ? <p className="text-sm text-slate-500">No classes assigned.</p> : null}
            </div>
          </section>
        </>
      ) : null}
    </TeacherPageShell>
  );
}
