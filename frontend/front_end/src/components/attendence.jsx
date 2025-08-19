
import { CheckCircle, UserCheck, Users, Save } from 'lucide-react';
import React, { useState, useEffect } from 'react';


export default function Attendance() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([])
  const [attendance, setAttendance] = useState([]);
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [classid, setClassid] = useState('')

  const fetchClasses = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/classes/`)
      if (!response.ok) {
        throw new Error('could not fetch classes')
      }
      const data = await response.json();
      setClasses(data)
    }
    catch (error) {
      console.log(error.message)
    }
  }
  const fetchStudents = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/students/by-class/${classid}/`);
      const data = await response.json();
      const initialAttendance = data.map(student => ({
        student_id: student.id,
        is_present: false
      }));
      setStudents(data);
      setAttendance(initialAttendance);
    } catch (error) {
      console.log(error.message())
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchClasses();
    fetchStudents();
  }, [classid]);

  const handleCheckboxChange = (studentId) => {
    setAttendance(attendance.map(item =>
      item.student_id === studentId ? { ...item, is_present: !item.is_present } : item
    ));
  };

  const handleSubmit = async () => {
    if (!date) return setMessage("Please select a date.");


    try {
      const response = await fetch(`http://127.0.0.1:8000/attendance/mark/${classid}/`, {

        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date, attendance }),
      });

      if (response.ok) {
        setMessage("✅ Attendance saved successfully!");
      } else {
        setMessage("❌ Failed to save attendance.");
      }
    } catch (error) {
      setMessage("❌ Failed to save attendance.");
    }
  };

  if (loading) return <div className="loading">Loading students...</div>;

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <CheckCircle size={28} className='text-blue-600' /> Mark Class Attendance
      </h1>

      <div className='flex flex-wrap gap-3'>
        {classes.map((cls) => (

          <button
            onClick={() => setClassid(cls.id)}
            key={cls.id}
            className={`flex items-center gap-2 px-4 py-2 rounded shadow-md transition-all duration-200 ${classid === cls.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-blue-600 border-blue-600'} hover:bg-blue-700 hover:text-white`}
          >
            <Users size={18} />{cls.name}
          </button>
          

        ))}

      </div>

      {classid && (
        <div className="bg-white p-6 shadow rounded-lg mt-6">


          {/* <div className="date-input">
            <label>Select Date:</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div> */}

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 text-sm">
              <thead className='bf-gray-150'>
                <tr>
                  <th className='px-4 py-2 border'>#</th>
                  <th className='px-4 py-2 border'>Student Name</th>
                  <th className='px-4 py-2 border'>Father's Name</th>
                  <th className='px-4 py-2 border'>Present</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={student.id} className='hover:bg-gray-50'>
                    <td className='px-4 py-2 border text-center'>{index + 1}</td>
                    <td className='flex items-center px-4 py-2 border gap-2'>
                      <UserCheck className='text-green-500 size={16}'/>{student.name}
                    </td>
                    <td className='px-4 py-2 border text-center'>{student.f_name}</td>
                    <td className="px-4 py-2 border text-center">
                      <input
                        type="checkbox"
                        className='w-5 h-5 text-green-600'
                        checked={attendance.find(a => a.student_id === student.id)?.is_present || false}
                        onChange={() => handleCheckboxChange(student.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <button 
              onClick={handleSubmit}
              className='flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 shadow'
              ><Save size={18} /> Save Attendance</button>
            {message && <span className="text-sm text-blue-600">{message}</span>}
          </div>
          <br />
          <hr />
        </div>
      )}
    </div>


  );
}
