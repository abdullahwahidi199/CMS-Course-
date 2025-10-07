import { useEffect, useState } from "react"
import { HiPencil } from "react-icons/hi";
import { Pencil, Trash2, Save, XCircle } from 'lucide-react';
import { useNavigate } from "react-router-dom";


function Staff() {
    const [formDisplay, setFormDisplay] = useState(false)
    const [name, setName] = useState("")
    const [role, setRole] = useState("")
    const [phone_number, setPhoneNum] = useState("")
    const [email, setEmail] = useState("")
    const [photo, setPhoto] = useState(null)

    const navigate=useNavigate()
    const [staff, setStaff] = useState([])
    const [editStaff, setEditStaff] = useState(null)

    const savedTokens = localStorage.getItem("tokens");

    const fetchStaff = async () => {
        try {
            const parsedTokens=JSON.parse(savedTokens);
            const response = await fetch('http://127.0.0.1:8000/staff/',{
                headers:{
                    Authorization: `Bearer ${parsedTokens.access}`,
                }
            })
            if (!response.ok) {
                throw new Error('could not fetch staff!')
            }
            const data = await response.json()
            setStaff(data)

        }
        catch (error) {
            console.log(error.message)
        }

    }
    useEffect(() => {
        fetchStaff();
    }, [])

    const addStaff = async (e) => {
        e.preventDefault();

        let formData = new FormData()
        formData.append('name', name)
        formData.append('role', role)
        formData.append('phone_number', phone_number)
        formData.append('email', email)
        formData.append('photo', photo)

        try {
            const parsedTokens=JSON.parse(savedTokens);
            const response = await fetch(`http://127.0.0.1:8000/staff/`, {
                method: 'POST',

                body: formData,
                headers:{
                    Authorization: `Bearer ${parsedTokens.access}`,
                }
            });
            if (!response.ok) {
                const erroData=await response.json()
                console.log(erroData)
                throw new Error('could not add staff')
            }
            const result = await response.json()
            fetchStaff();
            setName("")
            setRole("")
            setPhoneNum("")
            setEmail("")
            setPhoto(null)
            handleFormdisplay()
        }
        catch (error) {
            console.log(error)
        }
    }

    const updateStaff = async () => {
        console.log(editStaff)
        const formData = new FormData();
        formData.append('name', editStaff.name)
        formData.append('role', editStaff.role)
        formData.append('phone_number', editStaff.phone_number)
        formData.append('email', editStaff.email)


        if (editStaff.photo && editStaff.photo instanceof File) {
            formData.append('photo', editStaff.photo)
        }
        formData.append('photo', editStaff.photo)
        console.log(formData)
        try {
            const parsedTokens=JSON.parse(savedTokens);
            const response = await fetch(`http://127.0.0.1:8000/staff/${editStaff.id}/`, {
                method: 'PUT',
                body: formData,
                headers:{
                    Authorization: `Bearer ${parsedTokens.access}`,
                }
            })
            if (!response.ok) {
                throw new Error('could not edit staff')
            }
            fetchStaff();
            handleFormdisplay();
        }
        catch (error) {
            console.log(error)
        }

    }

    const deleteStaff = async (id) => {
        if (window.confirm('Are you sure u want to delete?')) {
            const parsedTokens=JSON.parse(savedTokens);
            const response = await fetch(`http://127.0.0.1:8000/staff/${id}/`, {
                method: 'DELETE',
                headers:{
                    Authorization: `Bearer ${parsedTokens.access}`,
                }
            })
            if (response.ok) {
                fetchStaff();
            }
        }
    }
    const handleFormdisplay = () => {
        setFormDisplay(!formDisplay)
    }
    return (
        <div className="p-6 space-y-6">
            <div className='flex justify-between items-center'>
                <h1 className="text-2xl font-bold">All staff</h1>
                <button
                    className="bg-blue-600 hover:bg-blue-700 cursor-pointer rounded p-2 text-white"
                    onClick={handleFormdisplay}
                >+ Add Staff</button>
            </div>
            {formDisplay && (
                <div className="bg-white shadow-md rounded-lg p-6">
                    <form onSubmit={addStaff} encType="multipart/form-data">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                            <div >
                                <label className="block mb-1 font-medium">Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full border border-gray-300 p-2 rounded"
                                />
                            </div>

                            <div >
                                <label className="block mb-1 font-medium">Role</label>
                                <input

                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full border border-gray-300 p-2 rounded"
                                />
                            </div>

                            <div>
                                <label className="block mb-1 font-medium">photo</label>
                                <div>
                                <input
                                type='file'
                                onChange={(e) => setImage(e.target.files[0])}
                                className="block mb-1 font-medium cursor-pointer border-1 p-2 h-10 w-54"
                            ></input>
                            </div>
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">email</label>
                                <input
                                    type="email"
                                    value={email} onChange={(e) => setEmail(e.target.value)}
                                    className="w-full border border-gray-300 p-2 rounded"
                                />

                            </div>
                            <div>
                                <label className="block mb-1 font-medium">phone number</label>
                                <input
                                    type="tel"
                                    value={phone_number} onChange={(e) => setPhoneNum(e.target.value)}
                                    className="w-full border border-gray-300 p-2 rounded"
                                />

                            </div><br/>

                            <div className=" inline-flex gap-3 items-center mt-[25px]">
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 rounded text-white inline-flex gap-2 p-2 py-1 items-center"
                                ><Save size={16} />Save</button>
                               

                                <button
                                    onClick={handleFormdisplay}
                                    className="bg-gray-600 hover:bg-gray-700 rounded text-white inline-flex gap-2 items-center p-2 py-1"
                                ><XCircle size={16} />Cancel</button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            <div className="p-6">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {staff.map((staff) => (
                        <div key={staff.id} className="bg-white shadow-md rounded-2xl p-4 border border-gray-200">
                            <div className="flex justify-center items-center ">
                                <img
                                    src={`http://127.0.0.1:8000/${staff.photo}`}
                                    className="rounded-full w-55 h-55 shadow-lg mb-4"
                                />
                            </div>
                            <h1 className="text-xl font-bold mb-2">{staff.name}</h1>
                            <p className="text-gray-700 mb-1"><strong>Role: </strong>{staff.role}</p>
                            <p className="text-gray-700 mb-1"><strong>phone number: </strong> {staff.phone_number}</p>
                            <p className="text-gray-700 mb-1"><strong>Email: </strong>{staff.email}</p>
                            <div className="inline-flex gap-3 items-center">
                                <button
                                    className="inline-flex items-center gap-1 cursor-pointer px-4 p-1 bg-blue-600 hover:bg-blue-700 rounded text-white"
                                    onClick={() => setEditStaff(staff)}
                                >
                                    <HiPencil size={16} />Edit
                                </button>
                                <button
                                    onClick={() => deleteStaff(staff.id)}
                                    className="bg-red-600 hover:bg-red-700 cursor-pointer rounded inline-flex items-center gap-2 p-2 py-1"
                                >
                                    <Trash2 size={16} />Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {editStaff && (
                <div className="fixed inset-0 z-50 bg-gray-300 flex justify-center items-center">
                    <div className="w-full max-w-xl mt-10 rounded-lg bg-white p-6 shadow-lg">
                        <h2 className="font-bold text-xl mg-4 text-center mb-[20px] ">Edit Staff</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input
                                type="text"
                                value={editStaff.name}
                                onChange={(e) => setEditStaff({ ...editStaff, name: e.target.value })}
                                className="border border-gray-300 p-2 rounded"
                                placeholder="Name"
                            />
                            <input
                                type="text"
                                value={editStaff.role}
                                onChange={(e) => setEditStaff({ ...editStaff, role: e.target.value })}
                                placeholder="New Role"
                                className="border border-gray-300 p-2 rounded"
                            />
                            <input
                                type="email"
                                value={editStaff.email}
                                onChange={(e) => setEditStaff({ ...editStaff, email: e.target.value })}
                                placeholder="New Email"
                                className="border border-gray-300 p-2 rounded"
                            />
                            <input
                                type="tel"
                                value={editStaff.phone_number}
                                onChange={(e) => setEditStaff({ ...editStaff, phone_number: e.target.value })}
                                placeholder="New mobile number"
                                className="border border-gray-300 p-2 rounded"
                            />
                            <input
                                type="file"
                                onChange={(e) => setEditStaff({ ...editStaff, photo: e.target.files[0] })}
                                className="border border-gray-300 p-2 rounded"

                            /><br />
                            <div className="flex gap-3 items-center">
                                <button
                                    onClick={updateStaff}
                                    className="bg-blue-600 hover:bg-blue-700 rounded text-white inline-flex gap-2 p-2 py-1 items-center"
                                ><Save size={16} />Save</button>
                                <button
                                    onClick={() => window.confirm("Are you sure") ? setEditStaff(null) : ''}
                                    className="bg-gray-600 hover:bg-gray-700 rounded text-white inline-flex gap-2 items-center py-1 p-2"
                                ><XCircle size={16} />Cancel</button>


                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    )
}
export default Staff