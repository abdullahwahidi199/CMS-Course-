import { useContext } from "react";
import { Link } from "react-router-dom";
import { Bell, BookOpen, CalendarCheck, ClipboardCheck, CreditCard, FileText, GraduationCap } from "lucide-react";
import { AuthContext } from "../../AuthProvider";
import { useApiResource } from "../../hooks/useApiResource";
import { EmptyState } from "./panel/PanelShell";

function money(value) {
  return Number(value || 0).toFixed(2);
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function DashboardCard({ icon: Icon, label, value, detail, to }) {
  const content = (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 inline-flex rounded-xl bg-cyan-50 p-2 text-cyan-700">
        <Icon size={20} />
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
      {detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

function MiniList({ rows, empty, render }) {
  if (!rows?.length) return <EmptyState>{empty}</EmptyState>;
  return <div className="space-y-3">{rows.slice(0, 4).map(render)}</div>;
}

export default function Homepage() {
  const { user } = useContext(AuthContext);
  const profile = useApiResource("/student/profile/");
  const attendance = useApiResource("/student/attendance/");
  const marks = useApiResource("/student/marks/");
  const enrollments = useApiResource("/student/enrollments/");
  const fees = useApiResource("/student/fees/");
  const assignments = useApiResource("/student/assignments/");
  const assessments = useApiResource("/student/assessments/");
  const notifications = useApiResource("/student/notifications/");
  const announcements = useApiResource("/student/announcements/");

  const name = user?.first_name || profile.data?.name || user?.username || "Student";
  const currentCourses = enrollments.data?.current_enrollments?.length || 0;
  const pendingAssignments = (assignments.data?.assignments || []).filter((row) => !row.submission || row.submission.status === "pending").length;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-gradient-to-r from-cyan-700 to-slate-900 p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-cyan-100">{greeting()}</p>
            <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{name}</h2>
            <p className="mt-2 text-sm text-cyan-100">
              {profile.data?.current_course || "Current course"} - {profile.data?.current_batch || "Current batch"}
            </p>
          </div>
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15 text-2xl font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardCard icon={CalendarCheck} label="Attendance" value={`${attendance.data?.summary?.percentage || 0}%`} detail="Overall attendance rate" to="/student/dashboard/attendance" />
        <DashboardCard icon={GraduationCap} label="GPA" value={marks.data?.summary?.gpa || 0} detail={`${marks.data?.summary?.average_score || 0}% average`} to="/student/dashboard/marks" />
        <DashboardCard icon={BookOpen} label="Current Courses" value={currentCourses} detail="Active enrollments" to="/student/dashboard/courses" />
        <DashboardCard icon={CreditCard} label="Outstanding Fees" value={money(fees.data?.summary?.outstanding)} detail={fees.data?.upcoming_due_date ? `Next due ${fees.data.upcoming_due_date}` : "Account balance"} to="/student/dashboard/fees" />
        <DashboardCard icon={FileText} label="Pending Assignments" value={pendingAssignments} detail="Awaiting submission" to="/student/dashboard/assignments" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-950">Recent Notifications</h3>
            <Link className="text-sm font-medium text-cyan-700" to="/student/dashboard/notifications">View all</Link>
          </div>
          <MiniList
            rows={notifications.data?.notifications || []}
            empty="No recent notifications."
            render={(row) => (
              <div key={row.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start gap-3">
                  <Bell size={17} className="mt-0.5 text-cyan-700" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{row.title}</p>
                    <p className="text-sm text-slate-600">{row.message}</p>
                  </div>
                </div>
              </div>
            )}
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-950">Upcoming Assessments</h3>
            <Link className="text-sm font-medium text-cyan-700" to="/student/dashboard/assessments">View all</Link>
          </div>
          <MiniList
            rows={assessments.data?.assessments || []}
            empty="No upcoming assessments."
            render={(row) => (
              <div key={row.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start gap-3">
                  <ClipboardCheck size={17} className="mt-0.5 text-cyan-700" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{row.title}</p>
                    <p className="text-sm text-slate-600">{row.course} - {row.date}</p>
                  </div>
                </div>
              </div>
            )}
          />
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-950">Recent Announcements</h3>
          <Link className="text-sm font-medium text-cyan-700" to="/student/dashboard/announcements">View all</Link>
        </div>
        <MiniList
          rows={announcements.data?.announcements || []}
          empty="No announcements yet."
          render={(row) => (
            <div key={row.id} className="rounded-xl border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-900">{row.title}</p>
              <p className="text-xs text-slate-500">{row.date}</p>
              <p className="mt-2 text-sm text-slate-600">{row.discription}</p>
            </div>
          )}
        />
      </section>
    </div>
  );
}
