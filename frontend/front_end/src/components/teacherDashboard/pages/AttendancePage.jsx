import { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarCheck, Check, Clock, Download, Save, Users } from "lucide-react";
import instance from "../../../api/axiosInstance";
import { formatApiError } from "../../../utils/apiErrors";
import { formatBatchLabel } from "../../../utils/batchLabel";
import TeacherPageShell from "./TeacherPageShell";
import { EmptyState, ErrorState, LoadingSkeleton, Panel, StatTile, Toast } from "./TeacherUi";
import { buttonClass, formatDate, inputClass, normalizeList, statusBadge, todayValue } from "./teacherUtils.jsx";

const statusOptions = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "excused", label: "Excused" },
];

export default function TeacherAttendancePage() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(todayValue());
  const [session, setSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [history, setHistory] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const selectedClass = classes.find((item) => String(item.id) === String(classId));

  const loadBase = async () => {
    setLoading(true);
    setError("");
    try {
      const [classRes, historyRes] = await Promise.all([
        instance.get("/classes/"),
        instance.get("/attendance-sessions/"),
      ]);
      const classRows = normalizeList(classRes.data);
      setClasses(classRows);
      setClassId((current) => current || String(classRows[0]?.id || ""));
      setHistory(normalizeList(historyRes.data));
    } catch (err) {
      setError(formatApiError(err, "Could not load attendance workspace."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBase();
  }, []);

  const openSession = async () => {
    if (!classId) return;
    setSaving(true);
    setError("");
    try {
      const response = await instance.post("/attendance-sessions/open/", {
        batch: Number(classId),
        date,
        session_topic: selectedClass?.subjects || selectedClass?.course_name || "",
      });
      setSession(response.data);
      setRecords((response.data.records || []).map((record) => ({ ...record, status: record.status || "absent" })));
      setToast({ message: "Attendance session is ready." });
      await loadReport();
      await loadBase();
    } catch (err) {
      setError(formatApiError(err, "Could not open attendance session."));
    } finally {
      setSaving(false);
    }
  };

  const loadReport = async () => {
    if (!classId) return;
    try {
      const response = await instance.get("/attendance-records/report/", {
        params: { batch: classId, start_date: date, end_date: date },
      });
      setReport(response.data);
    } catch {
      setReport(null);
    }
  };

  useEffect(() => {
    loadReport();
  }, [classId, date]);

  const updateRecord = (recordId, patch) => {
    setRecords((current) => current.map((record) => (record.id === recordId ? { ...record, ...patch } : record)));
  };

  const bulkMark = (status) => {
    setRecords((current) => current.map((record) => ({ ...record, status })));
  };

  const saveAttendance = async () => {
    if (!session) return;
    setSaving(true);
    setError("");
    try {
      const response = await instance.post(`/attendance-sessions/${session.id}/mark/`, {
        records: records.map((record) => ({
          id: record.id,
          status: record.status,
          remarks: record.remarks || "",
          reason_for_absence: record.reason_for_absence || "",
        })),
      });
      setSession(response.data);
      setRecords(response.data.records || []);
      setToast({ message: "Attendance saved successfully." });
      await loadReport();
      await loadBase();
    } catch (err) {
      setError(formatApiError(err, "Could not save attendance."));
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const total = records.length || report?.total || 0;
    const present = records.filter((record) => record.status === "present").length || report?.present || 0;
    const late = records.filter((record) => record.status === "late").length || report?.late || 0;
    const absent = records.filter((record) => record.status === "absent").length || report?.absent || 0;
    const percentage = total ? Math.round(((present + late) / total) * 100) : report?.percentage || 0;
    return { total, present, late, absent, percentage };
  }, [records, report]);

  const exportReport = () => {
    const lines = [["Student", "Status", "Date", "Remarks"], ...records.map((record) => [record.student_name, record.status, record.date, record.remarks || ""])];
    const blob = new Blob([lines.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-${selectedClass?.name || "class"}-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <TeacherPageShell
      title="Attendance Management"
      description="Open a daily class session, bulk mark attendance, edit permitted records, and export reports."
      actions={<button type="button" className={buttonClass("secondary")} onClick={exportReport} disabled={!records.length}><Download size={16} /> Export CSV</button>}
    >
      <ErrorState message={error} />
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatTile icon={Users} label="Students" value={stats.total} helper="In current session" />
            <StatTile icon={Check} label="Present" value={stats.present} helper="Marked present" tone="emerald" />
            <StatTile icon={Clock} label="Late" value={stats.late} helper="Arrived late" tone="amber" />
            <StatTile icon={CalendarCheck} label="Absent" value={stats.absent} helper="Marked absent" tone="rose" />
            <StatTile icon={BarChart3} label="Attendance Rate" value={`${stats.percentage}%`} helper="Present and late" tone="violet" />
          </div>

          <Panel title="Session Controls" description="Pick a class and date, then open or resume the attendance session.">
            <div className="grid gap-3 lg:grid-cols-[1fr_180px_auto]">
              <select className={inputClass()} value={classId} onChange={(event) => setClassId(event.target.value)}>
                {classes.map((item) => <option key={item.id} value={item.id}>{formatBatchLabel(item)}</option>)}
              </select>
              <input type="date" className={inputClass()} value={date} onChange={(event) => setDate(event.target.value)} />
              <button type="button" className={buttonClass()} onClick={openSession} disabled={saving || !classId}>
                <CalendarCheck size={16} /> Open Session
              </button>
            </div>
          </Panel>

          <Panel
            title={session ? `${formatBatchLabel(selectedClass, "Class")} / ${formatDate(date)}` : "Attendance Sheet"}
            description={session ? `Status: ${session.status}` : "Open a session to mark students."}
            actions={records.length ? statusOptions.map((item) => (
              <button key={item.value} type="button" className={buttonClass("secondary")} onClick={() => bulkMark(item.value)}>
                All {item.label}
              </button>
            )) : null}
          >
            {records.length ? (
              <>
                <div className="grid gap-3 md:hidden">
                  {records.map((record) => (
                    <article key={record.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">{record.student_name}</p>
                          <p className="text-sm text-slate-500">{record.student_number}</p>
                        </div>
                        {statusBadge(record.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {statusOptions.map((item) => (
                          <button key={item.value} type="button" className={`${buttonClass(record.status === item.value ? "primary" : "secondary")} px-2`} onClick={() => updateRecord(record.id, { status: item.value })}>
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                        <th className="px-3 py-3">Student</th>
                        <th className="px-3 py-3">ID</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records.map((record) => (
                        <tr key={record.id}>
                          <td className="px-3 py-3 font-semibold text-slate-950">{record.student_name}</td>
                          <td className="px-3 py-3 text-slate-600">{record.student_number}</td>
                          <td className="px-3 py-3">
                            <select className={inputClass()} value={record.status} onChange={(event) => updateRecord(record.id, { status: event.target.value })}>
                              {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-3">
                            <input className={inputClass()} value={record.remarks || ""} onChange={(event) => updateRecord(record.id, { remarks: event.target.value })} placeholder="Optional note" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button type="button" className={`${buttonClass()} mt-4`} onClick={saveAttendance} disabled={saving}>
                  <Save size={16} /> Save Attendance
                </button>
              </>
            ) : (
              <EmptyState title="No session opened" description="Select a class and date, then open the session." />
            )}
          </Panel>

          <Panel title="Attendance History" description="Recent sessions from your assigned classes.">
            {history.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {history.slice(0, 12).map((item) => (
                  <article key={item.id} className="rounded-md border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{formatBatchLabel(item)}</p>
                        <p className="text-sm text-slate-500">{formatDate(item.date)}</p>
                      </div>
                      {statusBadge(item.status)}
                    </div>
                    <p className="mt-3 text-sm text-slate-600">Present {item.present_count} / Absent {item.absent_count} / {item.attendance_percentage}%</p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="No attendance history" description="Attendance sessions will appear after they are opened." />
            )}
          </Panel>
        </>
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </TeacherPageShell>
  );
}
