import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Pencil, Trash2, Save, XCircle } from 'lucide-react';

function IndividaulStudent() {
  const { id } = useParams();

  const [student, setStudent] = useState(null)
  const navigate = useNavigate()
  const [editFormDisplay, setEditFormDisplay] = useState(false)
  // const [updatedStudent, setUpdatedStudent] = useState({ 'name': '', 'f_name': '', 'role_number': '', 'parent_mobile_number': '', 'address': ''})
  const [studentClass, setStudentClass] = useState("")
  const [editFeeDisplay, setEditFeeDisplay] = useState(false)
  const [payment, setPayment] = useState("")

  const token = localStorage.getItem("tokens");
  const fetchStudent = async () => {

    try {
      const parsedTokens = JSON.parse(token);
      const response = await fetch(`http://127.0.0.1:8000/students/${id}/`, {
        headers: {
          Authorization: `Bearer ${parsedTokens.access}`,
        }
      });
      if (!response.ok) {
        throw new Error('could not fetch the student!');
      }
      const data = await response.json()
      console.log(data)
      setStudent(data)

    }
    catch (error) {
      console.error(error)
    }

  }
  useEffect(() => {
    fetchStudent()

  }, [id])

  const handleDelete = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/students/${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${JSON.parse(token).access}`,
        }
      });
      if (!response.ok) {
        throw new Error('could not delete the user!')
      }

    }
    catch (error) {
      console.error(error.message)
    }
    navigate(-1)
  }

  const handlePay = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/students/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${JSON.parse(token).access}` },
        body: JSON.stringify({ payment })
      });

      if (!res.ok) {
        const errorText = await res.text(); // read raw error
        console.error("Backend Error:", errorText);

        return;
      }


      fetchStudent();
      setPayment("");
      setEditFeeDisplay(false);
    } catch (err) {
      console.error("Request Error:", err);
    }
  };

  const handleChange = (e) => {
    setStudent(prev => ({
      ...prev, [e.target.name]: e.target.value
    }))
  }
  function handleCancel() {
    // setUpdatedStudent({ 'name': '', 'f_name': '', 'role_number': '', 'parent_mobile_number': '', 'address': '' })
    // navigate('/IndividaulStudent')

    setEditFormDisplay(!editFormDisplay)
  }


  const updateStudent = async () => {
    const payload={
      name:student.name || "",
      f_name:student.f_name||"",
      role_number:student.role_number ||"",
      parent_mobile_number:student.parent_mobile_number || "",
      address:student.address || ""
    }
    try {
      const response = await fetch(`http://127.0.0.1:8000/students/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${JSON.parse(token).access}`
        },
        body: JSON.stringify(payload)
      })
      if (!response.ok) {
        throw new Error('could not update student!')
      }
      const data = await response.json();
      navigate(-1)
      // setUpdatedStudent({ 'name': '', 'f_name': '', 'role_number': '', 'parent_mobile_number': '', 'address': ''})
    }
    catch (error) {
      console.error(error.message)
    }
  }

  const handleEditFeeDisplay = () => {
    setEditFeeDisplay(!editFeeDisplay)
  }
  return (
    <div className="p-6 sm:p-10 space-y-12 bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen">
      {student ? (
        <div>
          <div className="text-red-700 cursor-pointer mb-[20px]">
            {student.total_fee - student.amount_paid == 0 ? 'Total Fee Given' : <p onClick={handleEditFeeDisplay}>Remaining Fee:{(student.total_fee - student.amount_paid)}  (pay remaining fee)</p>}
          </div>
          {editFeeDisplay && (

            <div className="flex gap-2 flex-wrap rounded shadow-lg mb-[30px]" >
              <input
                type="number"
                value={payment}
                placeholder="Enter amount to pay"
                className="border border-gray-300 p-1 rounded"
                onChange={(e) => setPayment(e.target.value)} />
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={handlePay}
                  className="bg-green-700 hover:bg-green-800 p-2 rounded inline-flex gap-2 text-white items-center"
                ><Save size={16} />Pay remaineng fee
                </button>
                <button
                  onClick={handleEditFeeDisplay}
                  className="bg-red-700 hover:bg-red-800 p-2 rounded inline-flex gap-2 items-center text-white"
                >
                  <XCircle size={16} />Cancel
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
                  onClick={() => window.confirm('Are you sure you want to delete the student?') ? handleDelete() : setEditFromDisplay(false)}
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
              </div>
            </div>

            <div className="space-y-3 text-gray-800 text-sm md:text-base mt-6 md:mt-0 text-left ">
              <p>{student.name}</p>
              <p>{student.f_name}</p>
              <p>{student.studentClass_details.name}</p>
              <p>{student.role_number}</p>
              <p>{student.parent_mobile_number}</p>
              <p>{student.address}</p>


            </div>


          </div>
        </div>


      ) : (
        <p className="text-center text-gray-400 text-lg">Loading student data...</p>
      )}

      {editFormDisplay && (
        <div className="fixed bg-gray-300 inset-0 z-50 flex justify-center items-center">
          <div className="space-y-6 bg-white p-6 rounded-2xl shadow-lg max-w-2xl border border-gray-200">
            <h2 className="text-2xl font-bold text-center mb-4">Edit Student</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Name</label>
                <input name="name"
                  placeholder={student.name}
                  value={student.name || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ouline-none focus:ringe-2 focus:ring-blue-400"/> 
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Father name</label>
                <input 
                  name="f_name" 
                  value={student.f_name || ""} 
                  onChange={handleChange} 
                  placeholder={student.f_name}
                  className="w-full p-2 border rounded-lg focus:ouline-none focus:ringe-2 focus:ring-blue-400" />
              </div>
              {/* <div>
                <label>Class</label>
                <input name="studentClass" value={updatedStudent.studentClass} onChange={handleChange} placeholder="Class" className="input" />
              </div> */}
              
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Roll Number</label>
                <input 
                  name="role_number" 
                  value={student.role_number || ""} 
                  onChange={handleChange} placeholder={student.role_number} 
                  className="w-full p-2 border rounded-lg focus:ouline-none focus:ringe-2 focus:ring-blue-400" />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Mobile Number</label>
                <input 
                  name="parent_mobile_number" 
                  value={student.parent_mobile_number||""} 
                  onChange={handleChange} placeholder={student.parent_mobile_number} 
                  className="w-full p-2 border rounded-lg focus:ouline-none focus:ringe-2 focus:ring-blue-400" />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Address</label>
                <input 
                  name="address" 
                  value={student.address||""} 
                  onChange={handleChange} placeholder={student.address}
                  className="w-full p-2 border rounded-lg focus:ouline-none focus:ringe-2 focus:ring-blue-400" />
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
                onClick={() => window.confirm('Do you want to cancel editing?') ? handleCancel() : setEditFormDisplay(false)}
                className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded shadow"
              >
                <XCircle size={16} /> Cancel
              </button>
            </div>
          </div>

        </div>
      )}

      {student && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{student.name}'s Attendance</h2>
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
                    <td className="border px-4 py-2">{date.is_present ? 'Yes' : 'No'}</td>
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