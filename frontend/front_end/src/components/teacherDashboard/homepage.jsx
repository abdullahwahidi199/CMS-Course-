import { Link } from "react-router-dom";
import { Bell, BookOpen, CalendarCheck, ClipboardCheck, FileText, GraduationCap, Plus, Users } from "lucide-react";
import { useApiResource } from "../../hooks/useApiResource";
import usePermissions from "../../hooks/usePermissions";

function Stat({ icon: Icon, label, value, helper, to }) {
  const card = (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 inline-flex rounded-xl bg-cyan-50 p-2 text-cyan-700">
        <Icon size={20} />
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value ?? 0}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
}

function ListCard({ title, to, rows, empty, render }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-slate-950">{title}</h3>
        {to ? <Link className="text-sm font-medium text-cyan-700" to={to}>View all</Link> : null}
      </div>
      {rows?.length ? <div className="space-y-3">{rows.slice(0, 5).map(render)}</div> : <p className="rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">{empty}</p>}
    </section>
  );
}

export default function TeacherHomepage() {
  const { hasPermission } = usePermissions();
  const profile = useApiResource("/teacher/profile/");
  const dashboard = useApiResource("/v1/dashboards/teacher/");
  const notifications = useApiResource("/v1/notifications/", { immediate: hasPermission("notifications.view") });
  const teacher = profile.data || {};
  const data = dashboard.data || {};
  const name = teacher.full_name || "Teacher";
  const quickActions = [
    { label: "Open Classes", to: "/teacher/dashboard/classes", icon: BookOpen, permission: "batches.view" },
    { label: "My Students", to: "/teacher/dashboard/students", icon: Users, permission: "students.view" },
    { label: "Take Attendance", to: "/teacher/dashboard/attendance", icon: CalendarCheck, permission: "attendance.view" },
    { label: "Create Assignment", to: "/teacher/dashboard/classes", icon: Plus, permission: "assessments.create" },
    { label: "Assessments", to: "/teacher/dashboard/assessments", icon: ClipboardCheck, permission: "assessments.view" },
  ].filter((item) => !item.permission || hasPermission(item.permission));
  const activity = [
    ...(data.upcoming_exams || []).map((item) => ({ label: item.title, helper: `Assessment / ${item.assessment_date}` })),
    ...(data.todays_classes || []).map((item) => ({ label: item.name, helper: `Class / ${item.start_time || "-"}-${item.end_time || "-"}` })),
  ].slice(0, 6);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-gradient-to-r from-cyan-700 to-slate-900 p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-cyan-100">Welcome back</p>
            <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{name}</h2>
            <p className="mt-2 text-sm text-cyan-100">{teacher.subject || "Subject"} / {teacher.department || "Department"}</p>
          </div>
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15 text-2xl font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat icon={BookOpen} label="Assigned Classes" value={teacher.classes?.length || 0} helper="Active batches" to="/teacher/dashboard/classes" />
        <Stat icon={CalendarCheck} label="Today's Attendance" value={data.todays_attendance || 0} helper="Records today" to="/teacher/dashboard/attendance" />
        <Stat icon={ClipboardCheck} label="Pending Assessments" value={data.pending_assessments || 0} helper="Draft or scheduled" to="/teacher/dashboard/assessments" />
        <Stat icon={GraduationCap} label="Upcoming Exams" value={data.upcoming_exams?.length || 0} helper="Scheduled ahead" to="/teacher/dashboard/assessments" />
        <Stat icon={FileText} label="Assignments" value="Open" helper="Manage coursework" to="/teacher/dashboard/assignments" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 font-semibold text-slate-950 dark:text-white">Quick Actions</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} to={item.to} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-800 transition hover:border-cyan-200 hover:bg-cyan-50 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800">
                  <span className="rounded-xl bg-cyan-50 p-2 text-cyan-700"><Icon size={17} /></span>
                  {item.label}
                </Link>
              );
            })}
            {!quickActions.length ? <p className="text-sm text-slate-500">No quick actions available for your permissions.</p> : null}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 font-semibold text-slate-950 dark:text-white">Calendar</h3>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>
            <p className="mt-1 text-4xl font-semibold text-slate-950 dark:text-white">{new Date().getDate()}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{data.todays_classes?.length || 0} class(es) today</p>
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ListCard
          title="Today's Classes"
          to="/teacher/dashboard/classes"
          rows={data.todays_classes || []}
          empty="No classes scheduled today."
          render={(row) => (
            <Link key={row.id} to={`/teacher/dashboard/classes/${row.id}`} className="block rounded-xl border border-slate-200 p-3 hover:border-cyan-200 hover:bg-cyan-50/40">
              <p className="font-semibold text-slate-900">{row.name}</p>
              <p className="text-sm text-slate-500">{row.start_time || "-"} - {row.end_time || "-"}</p>
            </Link>
          )}
        />
        <ListCard
          title="Upcoming Assessments"
          to="/teacher/dashboard/assessments"
          rows={data.upcoming_exams || []}
          empty="No upcoming assessments."
          render={(row) => (
            <div key={row.id} className="rounded-xl border border-slate-200 p-3">
              <p className="font-semibold text-slate-900">{row.title}</p>
              <p className="text-sm text-slate-500">{row.assessment_type} / {row.assessment_date}</p>
            </div>
          )}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <ListCard
          title="Performance Snapshot"
          rows={data.student_performance || []}
          empty="No assessment results yet."
          render={(row, index) => (
            <div key={`${row.assessment__title}-${index}`} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
              <span className="font-medium text-slate-900">{row.assessment__title}</span>
              <span className="text-sm font-semibold text-cyan-700">{Number(row.avg_percentage || 0).toFixed(1)}%</span>
            </div>
          )}
        />
        <ListCard
          title="Notifications"
          to={hasPermission("notifications.view") ? "/teacher/dashboard/notifications" : ""}
          rows={notifications.results || []}
          empty="No notifications."
          render={(row) => (
            <div key={row.id} className="rounded-xl border border-slate-200 p-3">
              <p className="font-medium text-slate-900">{row.title}</p>
              <p className="text-sm text-slate-500">{row.message}</p>
            </div>
          )}
        />
        <ListCard
          title="Recent Activity"
          rows={activity}
          empty="No recent activity."
          render={(row, index) => (
            <div key={`${row.label}-${index}`} className="rounded-xl border border-slate-200 p-3">
              <p className="font-medium text-slate-900">{row.label}</p>
              <p className="text-sm text-slate-500">{row.helper}</p>
            </div>
          )}
        />
      </div>
    </div>
  );
}
