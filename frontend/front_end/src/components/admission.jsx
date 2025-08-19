import { useEffect, useState } from "react"
import { Pencil, Trash2, Save, XCircle } from 'lucide-react';
import { useNavigate } from "react-router-dom";

function Admission(){
    const [classes, setClasses] = useState([])
    const [newStudent, setNewStudent] = useState({ 'name': '', 'f_name': '', 'role_number': '', 'parent_mobile_number': '', 'address': '', 'total_fee':'','amount_paid':'' })
    const [selectedClassId,setSelectedClassId]=useState(null)
    
    const navigate=useNavigate()
    const add_student=async (e)=>{
        e.preventDefault()

        const studentData={
            ...newStudent,
            studentClass:selectedClassId
        }
        
        const response=await fetch(`http://127.0.0.1:8000/students/`,{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify(studentData)
            
            
        })

        if (!response.ok) {
                throw new Error('could not add new student')
            }
        
        setNewStudent({ 'name': '', 'f_name': '', 'role_number': '', 'parent_mobile_number': '', 'address': '', 'total_fee':'','amount_paid':'' })
    }
    const fetchClasses = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/classes/');
            if (!response.ok) {
                throw new Error('could not fetch classes from the API')
            };
            const data = await response.json();
            setClasses(data)

        }
        catch (error) {
            console.error(error.message)
        }
    }

    useEffect(()=>{
        fetchClasses();
    },[])

    console.log(selectedClassId)
    const handleStudentInfo=(e)=>{
        setNewStudent(prev=>({
            ...prev,[e.target.name]:e.target.value
        }))

        }
        
    
    return(
        <div className="flex justify-center items-center mt-[20px]">
            
            <div className="bg-white rounded w-full max-w-xl p-6 shadow-lg">
                <h2 className="text-xl font-bold mg-6 font-mono">Addmission Form</h2>
                <form onSubmit={(e)=>add_student(e)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-[25px]">
                        <input type="text"
                            placeholder="name"
                            className="border border-gray-300 p-2 rounded"
                            name='name'
                            value={newStudent.name}
                            onChange={handleStudentInfo}

                        />

                        <input 
                            type="text"
                            placeholder="Father's name"
                            className="border border-gray-300 p-2 rounded"
                            name='f_name'
                            value={newStudent.f_name}
                            onChange={handleStudentInfo}
                        />
                            
                        <select value={selectedClassId} onChange={(e)=>setSelectedClassId(e.target.value)} className="border border-gray-300 p-2 rounded">
                            <option value=''>Class name</option>
                            {classes.map((cls)=>(
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>

                        <input  
                            type='number'
                            placeholder="roll number"
                            name='role_number'
                            value={newStudent.role_number}
                            onChange={handleStudentInfo}
                            className="border border-gray-300 p-2 rounded"

                        />

                        <input 
                            type="tel" 
                            placeholder="parent mobile number"
                            className="border border-gray-300 p-2 rounded"
                            name='parent_mobile_number'
                            value={newStudent.parent_mobile_number}
                            onChange={handleStudentInfo}
                            />

                        <input 
                            type="text" 
                            placeholder="address"
                            value={newStudent.address}
                            name='address'
                            className="border border-gray-300 p-2 rounded"
                            onChange={handleStudentInfo}
                            />

                        
                        <input 
                            type="number" 
                            placeholder="Total fee"
                            value={newStudent.total_fee}
                            name='total_fee'
                            onChange={handleStudentInfo}
                            className="border border-gray-300 p-2 rounded"

                            />

                        <input 
                            type="number" 
                            placeholder="Amount paid"
                            value={newStudent.amount_paid}
                            name='amount_paid'
                            onChange={handleStudentInfo}
                            className="border border-gray-300 p-2 rounded"/>
                        
                    </div>
                    <div className="flex justify-center space-x-2 mt-10">
                        <button type="submit"  className="bg-blue-600 hover:bg-blue-700 active:bg-blue-600 text-white px-4 py-2 rounded inline-flex items-center gap-2">
                            <Save size={16}/>Sumbit
                        </button>
                        <button onClick={()=>navigate('/classes')}  className="bg-gray-500 hover:bg-gray-600 active:bg-gray-500 text-white px-4 py-2 rounded inline-flex items-center gap-2">
                            <XCircle size={16}/>Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
export default Admission