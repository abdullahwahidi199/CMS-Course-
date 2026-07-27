import { Link } from "react-router-dom";
import {
  Bell,
  BookOpen,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Megaphone,
  Plus,
  Users,
} from "lucide-react";
import { useApiResource } from "../../hooks/useApiResource";
import usePermissions from "../../hooks/usePermissions";
import { formatBatchLabel } from "../../utils/batchLabel";
import TeacherPageShell from "./pages/TeacherPageShell";
import { EmptyState, ErrorState, LoadingSkeleton, Panel, StatTile } from "./pages/TeacherUi";
import { formatDate, formatTime, normalizeList } from "./pages/teacherUtils.jsx";

function ListItem({ title, meta, to }) {
  const body = (
    <div className="rounded-md border border-slate-200 p-3 transition hover:border-cyan-200 hover:bg-cyan-50/50">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{meta}</p>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export default function TeacherHomepage() {
  const { hasPermission } = usePermissions();
  const profile = useApiResource("/teacher/profile/");
  const classes = useApiResource("/classes/", { immediate: hasPermission("batches.view") });
  const dashboard = useApiResource("/v1/dashboards/teacher/");
  const assignments = useApiResource("/assignments/", { immediate: hasPermission("assessments.view") });
  const assessments = useApiResource("/v1/assessments/", { immediate: hasPermission("assessments.view") });
  const notifications = useApiResource("/v1/notifications/", { immediate: hasPermission("notifications.view") });

  const teacher = profile.data || {};
  const classRows = normalizeList(classes.data);
  const assignmentRows = normalizeList(assignments.data);
  const assessmentRows = normalizeList(assessments.data);
  const dashboardData = dashboard.data || {};
  const loading = profile.loading || dashboard.loading || classes.loading || assignments.loading || assessments.loading;
  const error = profile.error || dashboard.error || classes.error || assignments.error || assessments.error;
  const totalStudents = classRows.reduce((sum, item) => sum + Number(item.student_count || 0), 0);
  const pendingToGrade = assignmentRows.reduce(
    (sum, assignment) => sum + (assignment.submissions || []).filter((submission) => submission.status !== "pending" && submission.marks_obtained == null).length,
    0,
  );
  const upcomingExams = assessmentRows
    .filter((item) => item.assessment_type === "final_exam" && item.assessment_date >= new Date().toISOString().slice(0, 10))
    .slice(0, 5);
  const recentAnnouncements = normalizeList(notifications.data)
    .filter((item) => ["announcement", "system", "academic"].includes(item.notification_type))
    .slice(0, 5);

  const quickActions = [
    { label: "Take Attendance", to: "/teacher/dashboard/attendance", icon: CalendarCheck, permission: "attendance.mark" },
    { label: "Create Assignment", to: "/teacher/dashboard/assignments", icon: Plus, permission: "assessments.create" },
    { label: "Enter Marks", to: "/teacher/dashboard/assessments", icon: GraduationCap, permission: "assessments.grade" },
    { label: "Open Timetable", to: "/teacher/dashboard/timetable", icon: BookOpen, permission: "batches.view" },
    { label: "Notifications", to: "/teacher/dashboard/notifications", icon: Bell, permission: "notifications.view" },
  ].filter((item) => !item.permission || hasPermission(item.permission));

  return (
    <TeacherPageShell title="Dashboard" description="A daily command center for classes, attendance, assignments, exams, and student progress.">
      <ErrorState message={error} />
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : (
        <>
          <section className="rounded-lg border border-slate-200 bg-white p-5 text-slate-950 shadow-sm sm:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-700">Welcome back</p>
                <h3 className="mt-1 text-2xl font-semibold sm:text-3xl">{teacher.full_name || "Teacher"}</h3>
                <p className="mt-2 text-sm text-slate-500">{teacher.subject || "Subject"} / {teacher.department || "Department"}</p>
              </div>
              <div className="grid h-16 w-16 place-items-center rounded-lg bg-cyan-50 text-2xl font-bold text-cyan-700">
                {(teacher.full_name || "T").charAt(0).toUpperCase()}
              </div>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatTile icon={BookOpen} label="Total Classes" value={classRows.length} helper="Assigned to you" tone="cyan" />
            <StatTile icon={Users} label="Total Students" value={totalStudents} helper="Active enrollments" tone="emerald" />
            <StatTile icon={CalendarCheck} label="Today's Classes" value={(dashboardData.todays_classes || []).length} helper={`${dashboardData.todays_attendance || 0} attendance records`} tone="amber" />
            <StatTile icon={FileText} label="Pending Grading" value={pendingToGrade} helper="Submissions awaiting marks" tone="violet" />
            <StatTile icon={GraduationCap} label="Upcoming Exams" value={upcomingExams.length || dashboardData.upcoming_exams?.length || 0} helper="Scheduled ahead" tone="rose" />
          </div>

          <Panel title="Quick Actions">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {quickActions.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.label} to={item.to} className="flex items-center gap-3 rounded-md border border-slate-200 p-3 text-sm font-semibold text-slate-800 transition hover:border-cyan-200 hover:bg-cyan-50">
                    <span className="rounded-md bg-cyan-50 p-2 text-cyan-700"><Icon size={17} /></span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </Panel>

          <div className="grid gap-5 xl:grid-cols-3">
            <Panel title="Today's Classes" description="Your assigned classes scheduled for today.">
              {(dashboardData.todays_classes || []).length ? (
                <div className="space-y-3">
                  {dashboardData.todays_classes.map((item) => (
                    <ListItem key={item.id} title={formatBatchLabel(item)} meta={`${formatTime(item.start_time)} - ${formatTime(item.end_time)}`} to={`/teacher/dashboard/classes/${item.id}`} />
                  ))}
                </div>
              ) : (
                <EmptyState title="No classes today" description="Your schedule is clear for the day." />
              )}
            </Panel>

            <Panel title="Upcoming Final Exams" description="Final exams are powered by assessments.">
              {upcomingExams.length ? (
                <div className="space-y-3">
                  {upcomingExams.map((item) => (
                    <ListItem key={item.id} title={item.title} meta={`${formatBatchLabel(item, "Class")} / ${formatDate(item.assessment_date)}`} to="/teacher/dashboard/exams" />
                  ))}
                </div>
              ) : (
                <EmptyState title="No upcoming final exams" description="Create final exam assessments from the Exams page." />
              )}
            </Panel>

            <Panel title="Recent Announcements" description="Notifications and academic updates.">
              {recentAnnouncements.length ? (
                <div className="space-y-3">
                  {recentAnnouncements.map((item) => (
                    <ListItem key={item.id} title={item.title} meta={item.message || formatDate(item.created_at)} to="/teacher/dashboard/notifications" />
                  ))}
                </div>
              ) : (
                <EmptyState title="No announcements" description="New announcements will appear here." />
              )}
            </Panel>
          </div>

          <Panel title="Assessment Snapshot" description="Recent class averages and scheduled work.">
            {(dashboardData.student_performance || []).length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {dashboardData.student_performance.map((item, index) => (
                  <div key={`${item.assessment__title}-${index}`} className="rounded-md border border-slate-200 p-4">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck size={17} className="text-cyan-700" />
                      <p className="font-semibold text-slate-900">{item.assessment__title}</p>
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-cyan-700">{Number(item.avg_percentage || 0).toFixed(1)}%</p>
                    <p className="text-sm text-slate-500">Class average</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No performance data yet" description="Averages appear after marks are entered." />
            )}
          </Panel>

          <Panel title="Notifications" actions={<Megaphone size={18} className="text-cyan-700" />}>
            {normalizeList(notifications.data).length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {normalizeList(notifications.data).slice(0, 4).map((item) => (
                  <ListItem key={item.id} title={item.title} meta={item.message || formatDate(item.created_at)} to="/teacher/dashboard/notifications" />
                ))}
              </div>
            ) : (
              <EmptyState title="No notifications" description="You are all caught up." />
            )}
          </Panel>
        </>
      )}
    </TeacherPageShell>
  );
}
