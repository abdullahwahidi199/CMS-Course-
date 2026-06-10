import { useEffect, useState } from "react";
import { Pencil, Trash2, Save, XCircle, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Bill from "./reciept";
import { useRef } from "react";
import instance from "../api/axiosInstance";

function Admission() {
  const [classes, setClasses] = useState([]);
  const [newStudent, setNewStudent] = useState({
    name: "",
    f_name: "",
    role_number: "",
    parent_mobile_number: "",
    address: "",
    total_fee: "",
    amount_paid: "",
  });
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [savedStudent, setSavedStudent] = useState(null);
  const [error, setError] = useState(null);
  const [tenant, setTenant] = useState();
  const receiptRef = useRef();
  const navigate = useNavigate();
  const savedTokens = localStorage.getItem("tokens");

  const getTenant = async () => {
    try {
      const response = await instance.get("/get-tenant/");
      setTenant(response.data);
    } catch (error) {
      setError(error.message);
    }
  };

  const add_student = async (e) => {
    e.preventDefault();

    const studentData = {
      ...newStudent,
      studentClass: Number(selectedClassId),
    };
    const response = await instance.post("/students/", studentData);

    const savedData = response.data;
    setSavedStudent(savedData);
    console.log(savedData);
    setShowReceipt(true);

    setNewStudent({
      name: "",
      f_name: "",
      role_number: "",
      parent_mobile_number: "",
      address: "",
      total_fee: "",
      amount_paid: "",
    });
  };
  const fetchClasses = async () => {
    try {
      const response = await instance.get("/classes/");

      const data = response.data;
      setClasses(data);
    } catch (error) {
      console.error(error.message);
    }
  };

  useEffect(() => {
    getTenant();
    fetchClasses();
  }, []);

  const handleStudentInfo = (e) => {
    setNewStudent((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="flex justify-center items-center mt-[20px]">
      {showReceipt && savedStudent ? (
        <div className="w-full max-w-2xl">
          <Bill student={savedStudent} ref={receiptRef} tenant={tenant} />

          <div className="flex justify-center mt-6 print:hidden">
            <button
              onClick={() => window.print()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Print Receipt
            </button>
            <button
              onClick={() => setShowReceipt(false)}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg ml-2 hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded w-full max-w-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mg-6 font-mono">Addmission Form</h2>
          <form onSubmit={(e) => add_student(e)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-[25px]">
              <input
                type="text"
                placeholder="Full name"
                className="border border-gray-300 p-2 rounded"
                name="name"
                value={newStudent.name}
                onChange={handleStudentInfo}
                required
              />

              <input
                type="text"
                placeholder="Father's name"
                className="border border-gray-300 p-2 rounded"
                name="f_name"
                value={newStudent.f_name}
                onChange={handleStudentInfo}
                required
              />

              <select
                value={selectedClassId}
                required
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="border border-gray-300 p-2 rounded"
              >
                <option value="">Class name</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="roll number"
                name="role_number"
                value={newStudent.role_number}
                required
                onChange={handleStudentInfo}
                className="border border-gray-300 p-2 rounded"
              />

              <input
                type="tel"
                placeholder="parent mobile number"
                className="border border-gray-300 p-2 rounded"
                name="parent_mobile_number"
                value={newStudent.parent_mobile_number}
                required
                onChange={handleStudentInfo}
              />

              <input
                type="text"
                placeholder="address"
                value={newStudent.address}
                name="address"
                className="border border-gray-300 p-2 rounded"
                onChange={handleStudentInfo}
                required
              />

              <input
                type="number"
                placeholder="Total fee"
                value={newStudent.total_fee}
                name="total_fee"
                onChange={handleStudentInfo}
                className="border border-gray-300 p-2 rounded"
                required
              />

              <input
                type="number"
                placeholder="Amount paid"
                value={newStudent.amount_paid}
                name="amount_paid"
                onChange={handleStudentInfo}
                required
                className="border border-gray-300 p-2 rounded"
              />
            </div>
            <div className="flex justify-center space-x-2 mt-10">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-600 text-white px-4 py-2 rounded inline-flex items-center gap-2"
              >
                <Save size={16} />
                Sumbit
              </button>
              <button
                onClick={() => navigate("/admin/dashboard/classes")}
                end
                className="bg-gray-500 hover:bg-gray-600 active:bg-gray-500 text-white px-4 py-2 rounded inline-flex items-center gap-2"
              >
                <XCircle size={16} />
                Cancel
              </button>
            </div>
            {error && <p className="text-red-700">{error}</p>}
          </form>
        </div>
      )}
    </div>
  );
}
export default Admission;
