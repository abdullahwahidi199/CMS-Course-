import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowUpCircle, Pencil, Trash2, Save, XCircle } from "lucide-react";
import instance from "../api/axiosInstance";

const today = () => new Date().toISOString().slice(0, 10);

function IndividaulStudent() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [classes, setClasses] = useState([]);
  const navigate = useNavigate();
  const [editFormDisplay, setEditFormDisplay] = useState(false);
  const [editFeeDisplay, setEditFeeDisplay] = useState(false);
  const [promotionDisplay, setPromotionDisplay] = useState(false);
  const [promotionForm, setPromotionForm] = useState({
    new_batch: "",
    promotion_date: today(),
    remarks: "",
  });
  const [message, setMessage] = useState("");
  const [promotionError, setPromotionError] = useState("");
  const [payment, setPayment] = useState("");

  const fetchStudent = async () => {
    try {
      const response = await instance.get(`/students/${id}/`);
      setStudent(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await instance.get("/classes/");
      setClasses(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchStudent();
    fetchClasses();
  }, [id]);

  const handleDelete = async () => {
    try {
      await instance.delete(`/students/${id}/`);
      navigate(-1);
    } catch (error) {
      console.error(error.message);
    }
  };

  const handlePay = async () => {
    try {
      await instance.patch(`/students/${id}/`, { payment });
      fetchStudent();
      setPayment("");
      setEditFeeDisplay(false);
    } catch (err) {
      console.error("Request Error:", err.response?.data || err.message);
    }
  };

  const handleChange = (e) => {
    setStudent((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  function handleCancel() {
    setEditFormDisplay(!editFormDisplay);
  }

  const updateStudent = async () => {
    const payload = {
      name: student.name || "",
      f_name: student.f_name || "",
      role_number: student.role_number || "",
      parent_mobile_number: student.parent_mobile_number || "",
      address: student.address || "",
    };
    try {
      await instance.put(`/students/${id}/`, payload);
      navigate(-1);
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleEditFeeDisplay = () => {
    setEditFeeDisplay(!editFeeDisplay);
  };

  const currentEnrollment = student?.current_enrollments?.[0];
  const availableClasses = classes.filter(
    (item) => item.is_active !== false && String(item.id) !== String(currentEnrollment?.batch),
  );

  const handlePromote = async () => {
    setPromotionError("");
    setMessage("");
    if (!promotionForm.new_batch) {
      setPromotionError("Select the new class.");
      return;
    }
    try {
      await instance.post("/promotions/", {
        student: Number(id),
        new_batch: promotionForm.new_batch,
        promotion_date: promotionForm.promotion_date,
        remarks: promotionForm.remarks,
      });
      setMessage("Student promoted successfully.");
      setPromotionDisplay(false);
      setPromotionForm({ new_batch: "", promotion_date: today(), remarks: "" });
      await fetchStudent();
    } catch (error) {
      setPromotionError(
        error.response?.data?.detail
          ? JSON.stringify(error.response.data.detail)
          : "Could not promote student.",
      );
    }
  };

  return (
    <div className="p-6 sm:p-10 space-y-12 bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen">
      {message && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </div>
      )}
      {student ? (
        <div>
          <div className="text-red-700 cursor-pointer mb-[20px]">
            {student.total_fee - student.amount_paid == 0 ? (
              "Total Fee Given"
            ) : (
              <p onClick={handleEditFeeDisplay}>
                Remaining Fee:{student.total_fee - student.amount_paid} (pay
                remaining fee)
              </p>
            )}
          </div>
          {editFeeDisplay && (
            <div className="flex gap-2 flex-wrap rounded shadow-lg mb-[30px]">
              <input
                type="number"
                value={payment}
                placeholder="Enter amount to pay"
                className="border border-gray-300 p-1 rounded"
                onChange={(e) => setPayment(e.target.value)}
              />
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={handlePay}
                  className="bg-green-700 hover:bg-green-800 p-2 rounded inline-flex gap-2 text-white items-center"
                >
                  <Save size={16} />
                  Pay remaineng fee
                </button>
                <button
                  onClick={handleEditFeeDisplay}
                  className="bg-red-700 hover:bg-red-800 p-2 rounded inline-flex gap-2 items-center text-white"
                >
                  <XCircle size={16} />
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-6 flex sm:justify-between ">
            <div className="space-y-3 text-gray-600 text-sm md:text-base">
              <p className="font-semibold">Name:</p>
              <p className="font-semibold">Father Name:</p>
              <p className="font-semibold">Class:</p>
              <p className="font-semibold">Roll Number:</p>
              <p className="font-semibold">Mobile Number:</p>
              <p className="font-semibold">Address:</p>
              <div className="flex justify-between space-x-4">
                <button
                  onClick={() =>
                    window.confirm(
                      "Are you sure you want to delete the student?",
                    )
                      ? handleDelete()
                      : setEditFormDisplay(false)
                  }
                  className="mt-6 inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow"
                >
                  <Trash2 size={16} /> Delete
                </button>
                <button
                  onClick={() => setEditFormDisplay(!editFormDisplay)}
                  className="mt-6 inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow "
                >
                  <Pencil size={16} /> Edit
                </button>
                <button
                  onClick={() => setPromotionDisplay(true)}
                  className="mt-6 inline-flex items-center gap-2 bg-cyan-700 hover:bg-cyan-800 text-white px-4 py-2 rounded shadow"
                >
                  <ArrowUpCircle size={16} /> Promote Student
                </button>
              </div>
            </div>

            <div className="space-y-3 text-gray-800 text-sm md:text-base mt-6 md:mt-0 text-left ">
              <p>{student.name}</p>
              <p>{student.f_name}</p>
              <p>
                {student.current_enrollments?.[0]?.batch_name ||
                  "No active batch"}
              </p>
              <p>{student.role_number}</p>
              <p>{student.parent_mobile_number}</p>
              <p>{student.address}</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-400 text-lg">
          Loading student data...
        </p>
      )}

      {editFormDisplay && (
        <div className="fixed bg-gray-300 inset-0 z-50 flex justify-center items-center">
          <div className="space-y-6 bg-white p-6 rounded-2xl shadow-lg max-w-2xl border border-gray-200">
            <h2 className="text-2xl font-bold text-center mb-4">
              Edit Student
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  name="name"
                  placeholder={student.name}
                  value={student.name || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ouline-none focus:ringe-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  Father name
                </label>
                <input
                  name="f_name"
                  value={student.f_name || ""}
                  onChange={handleChange}
                  placeholder={student.f_name}
                  className="w-full p-2 border rounded-lg focus:ouline-none focus:ringe-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  Roll Number
                </label>
                <input
                  name="role_number"
                  value={student.role_number || ""}
                  onChange={handleChange}
                  placeholder={student.role_number}
                  className="w-full p-2 border rounded-lg focus:ouline-none focus:ringe-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  Mobile Number
                </label>
                <input
                  name="parent_mobile_number"
                  value={student.parent_mobile_number || ""}
                  onChange={handleChange}
                  placeholder={student.parent_mobile_number}
                  className="w-full p-2 border rounded-lg focus:ouline-none focus:ringe-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  name="address"
                  value={student.address || ""}
                  onChange={handleChange}
                  placeholder={student.address}
                  className="w-full p-2 border rounded-lg focus:ouline-none focus:ringe-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-4">
              <button
                onClick={updateStudent}
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded shadow"
              >
                <Save size={16} /> Save
              </button>
              <button
                onClick={() =>
                  window.confirm("Do you want to cancel editing?")
                    ? handleCancel()
                    : setEditFormDisplay(false)
                }
                className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded shadow"
              >
                <XCircle size={16} /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {student && promotionDisplay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
          <div className="w-full max-w-xl rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Promote Student
              </h2>
              <button
                onClick={() => setPromotionDisplay(false)}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
              >
                <XCircle size={20} />
              </button>
            </div>

            {promotionError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {promotionError}
              </div>
            )}

            <div className="grid gap-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-gray-700">
                  Current Class
                </span>
                <input
                  readOnly
                  value={currentEnrollment?.batch_name || "No active class"}
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-gray-700">
                  New Class
                </span>
                <select
                  value={promotionForm.new_batch}
                  onChange={(event) =>
                    setPromotionForm({
                      ...promotionForm,
                      new_batch: event.target.value,
                    })
                  }
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-cyan-600"
                >
                  <option value="">Select class</option>
                  {availableClasses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.course_name || currentEnrollment?.course_name || "Course"} / {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-gray-700">
                  Promotion Date
                </span>
                <input
                  type="date"
                  value={promotionForm.promotion_date}
                  onChange={(event) =>
                    setPromotionForm({
                      ...promotionForm,
                      promotion_date: event.target.value,
                    })
                  }
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-cyan-600"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-gray-700">
                  Remarks
                </span>
                <textarea
                  value={promotionForm.remarks}
                  onChange={(event) =>
                    setPromotionForm({
                      ...promotionForm,
                      remarks: event.target.value,
                    })
                  }
                  rows={3}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-cyan-600"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setPromotionDisplay(false)}
                className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handlePromote}
                className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
              >
                <ArrowUpCircle size={16} /> Promote Student
              </button>
            </div>
          </div>
        </div>
      )}

      {student && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {student.name}'s Attendance
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse border border-gray-300 text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="border px-4 py-2">Date</th>
                  <th className="border px-4 py-2">Present</th>
                </tr>
              </thead>
              <tbody>
                {student.attendances.map((date) => (
                  <tr key={date.id} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{date.date}</td>
                    <td className="border px-4 py-2">
                      {date.is_present ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
export default IndividaulStudent;
