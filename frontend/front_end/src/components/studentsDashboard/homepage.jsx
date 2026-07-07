import { useContext, useEffect, useState } from "react";
import {
  LogOut,
  Book,
  User,
  X,
  Calendar,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { AuthContext } from "../../AuthProvider";
import { useNavigate } from "react-router-dom";
import instance from "../../api/axiosInstance";

export default function Homepage() {
  const [student, setStudent] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [studentproDisplay, setProDisplay] = useState(false);
  const [classId, setClassID] = useState("");
  const [marks, setMarks] = useState([]);

  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchProfile = async () => {
    try {
      const res = await instance.get("/student/profile/");
      const data = res.data;
      setStudent(data);
      setClassID(data.current_enrollments?.[0]?.batch || "");
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await instance.get(`/assignments/?class_id=${classId}`);
      setAssignments(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (classId) fetchAssignments();
  }, [classId]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const today = new Date();

  if (!student) return <p className="text-center mt-10">Loading...</p>;
  const currentEnrollment = student.current_enrollments?.[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="w-full flex justify-between items-center px-6 py-4 bg-white shadow">
        <h1 className="font-semibold text-xl text-gray-800">
          Welcome, {student.name}
        </h1>

        <div className="flex gap-3 items-center">
          <button
            onClick={() => setProDisplay(!studentproDisplay)}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
          >
            <User className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6  bg-green-200 rounded-2xl shadow-md">
            <h2 className="text-lg font-semibold text-gray-700flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" /> Attendance
            </h2>
            <p className="mt-4 text-3xl font-bold text-gray-800">
              {student.attendances.length > 0
                ? student.attendances.filter((a) => a.is_present).length
                : 0}
              /{student.attendances.length} days
            </p>
          </div>

          <div className=" bg-blue-200 -white  p-6 rounded-2xl shadow-md">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Book className="w-5 h-5 text-green-8 00" /> Class
            </h2>
            <p className="mt-4 font-medium text-gray-800">
              {currentEnrollment?.batch_name || "No active batch"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {currentEnrollment?.course_name || "No active course"}
            </p>
            <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-800" />
              Enrollment: {currentEnrollment?.enrollment_date || "-"}
            </p>
          </div>

          <div className="bg-gray-200 p-6 rounded-2xl shadow-md">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" /> Fee Status
            </h2>
            {student.total_fee - student.amount_paid > 0 ? (
              <p className="mt-4 font-bold text-red-700">
                Remaining: {student.total_fee - student.amount_paid}
              </p>
            ) : (
              <p className="mt-4 font-bold text-green-800">Fully Paid</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-500" /> Assignments
          </h2>

          <div className="mt-4 space-y-4">
            {assignments.length === 0 && (
              <p className="text-gray-500">No assignments found.</p>
            )}

            {assignments.map((a) => {
              const dueDate = new Date(a.due_date);
              const isExpired = dueDate < today;

              const submission = a.submissions.find(
                (s) => s.student === student.id,
              );

              let statusDisplay;

              if (submission) {
                if (submission.status === "graded") {
                  statusDisplay = (
                    <p className="flex items-center gap-2 text-green-600 font-medium">
                      <CheckCircle className="w-5 h-5" />
                      Graded ({submission.marks_obtained}/{a.total_marks})
                    </p>
                  );
                } else if (submission.status === "pending" && !isExpired) {
                  statusDisplay = (
                    <p className="flex items-center gap-2 text-yellow-600 font-medium">
                      <AlertCircle className="w-5 h-5" /> Pending
                    </p>
                  );
                } else if (submission.status === "pending" && isExpired) {
                  statusDisplay = (
                    <p className="flex items-center gap-2 text-red-600 font-medium">
                      <XCircle className="w-5 h-5" /> Missed
                    </p>
                  );
                }
              } else {
                statusDisplay = (
                  <p className="flex items-center gap-2 text-gray-500 font-medium">
                    <Clock className="w-5 h-5" /> No Submission Found
                  </p>
                );
              }

              return (
                <div
                  key={a.id}
                  className="border rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition"
                >
                  <div>
                    <h3 className="font-semibold text-gray-800">{a.title}</h3>
                    <p className="text-sm text-gray-500">{a.discription}</p>
                    <p className="text-sm mt-1">
                      Due:{" "}
                      <span
                        className={`font-medium ${
                          isExpired ? "text-red-500" : "text-gray-700"
                        }`}
                      >
                        {a.due_date} {isExpired && "(Expired)"}
                      </span>
                    </p>
                  </div>

                  <div className="mt-3 md:mt-0">{statusDisplay}</div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 z-50
                ${studentproDisplay ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-4 flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">Profile</h3>
          <button
            onClick={() => setProDisplay(false)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex flex-col items-center mt-6">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-600">
            {student.name.charAt(0)}
          </div>
          <h3 className="mt-3 text-lg font-semibold text-gray-800">
            {student.name}
          </h3>
          <p className="text-sm text-gray-600">
            Roll No: {student.role_number}
          </p>
          <p className="text-sm text-gray-600">Father: {student.f_name}</p>
          <p className="text-sm text-gray-600">
            📞 {student.parent_mobile_number}
          </p>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <MapPin className="w-4 h-4" /> {student.address}
          </p>
        </div>

        <div className="absolute bottom-10 w-full px-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
