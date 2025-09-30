import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Pencil, Trash2, Save, XCircle } from 'lucide-react';



export default function IndividualExpense() {
    const { id } = useParams()
    const [expense, setExpense] = useState(null)
    const [editFormDisplay, setEditFormDisplay] = useState(false)


    const savedTokens = localStorage.getItem("tokens");
    const navigate = useNavigate()

    const getTheExpense = async () => {
        const parsedTokens = JSON.parse(savedTokens);
        const response = await fetch(`http://127.0.0.1:8000/expenses/${id}/`, {
            headers: {
                Authorization: `Bearer ${parsedTokens.access}`,
            },
        })
        if (response.ok) {
            const data = await response.json()
            setExpense(data)
        }
    }

    useEffect(() => {
        getTheExpense();
    }, [])

    const handleExpenseEdit = async () => {
        const updatedFields = {};

        Object.keys(expense).forEach(key => {
            if (expense[key] !== "" && expense[key] !== null) {
                updatedFields[key] = expense[key]
            }
        })
        const parsedTokens = JSON.parse(savedTokens);
        const response = await fetch(`http://127.0.0.1:8000/expenses/${id}/`, {
            method: 'PATCH',
            headers: {
                "Content-Type": "application/json",
                headers: { Authorization: `Bearer ${parsedTokens.access}` }
            },
            body: JSON.stringify(updatedFields)
        })

        navigate('/expenses')
        getTheExpense();

    }

    const handleDelete = async () => {
        const parsedTokens = JSON.parse(savedTokens);
        const response = await fetch(`http://127.0.0.1:8000/expenses/${id}/`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${parsedTokens.access}`,
            }
        })
        navigate('/expenses')
        getTheExpense();
    }
    const handleChange = (e) => {
        setExpense(prev => ({
            ...prev, [e.target.name]: e.target.value
        }))
    }

    return (
        <div>
            {expense && (
                <div className=" rounded shadow-lg p-15 flex flex-col">
                    <div className="flex justify-between items-center">
                        <div className=" space-y-3 text-sm md:text-base">
                            <p>Name</p>
                            <p>Amount</p>
                            <p>Date</p>
                            <p>Discription</p>

                        </div>

                        <div className="space-y-3 text-sm md:text-base">
                            <p>{expense.name}</p>
                            <p>{expense.amount}</p>
                            <p>{expense.date}</p>
                            <p>{expense.description}</p>
                        </div>
                    </div>
                    <div className="inline-flex gap-2 space-x-4">
                        <button
                            onClick={() => window.confirm('Are you sure you want to delete the student?') ? handleDelete() : navigate('/admin/dashboard/expenses')}
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
                        {/* <button 
                                onClick={()=>navigate('/expenses')}
                                className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white rounded shadow px-4 py-2 mt-6"
                            >
                                <XCircle size={16}/> Cancel
                            </button> */}
                    </div>


                </div>

            )}

            {editFormDisplay && (
                <div className="fixed bg-gray-300 inset-0 z-50 flex justify-center items-center">
                    <div
                        // onSubmit={(e)=>handleExpenseEdit(e)}
                        className="space-y-6 bg-white p-6 rounded-2xl shadow-lg max-w-2xl border border-gray-200"
                    >
                        <h2 className="text-2xl font-bold text-center mb-4">Edit the Expense</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-medium text-gray-700">Name</label>
                                <input
                                    name='name'
                                    type="text"
                                    placeholder={expense.name}
                                    vlaue={expense.name || ""}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-lg focus:ouline-none focus:ringe-2 focus:ring-blue-400"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-medium text-gray-700">Amount</label>
                                <input
                                    name='amount'
                                    type="number"
                                    placeholder={expense.amount}
                                    vlaue={expense.amount || ""}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-lg focus:ouline-none focus:ringe-2 focus:ring-blue-400"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="mb-1 text-sm font-medium text-gray-700">Date</label>
                                <input
                                    name='date'
                                    type="date"
                                    placeholder={expense.date}
                                    vlaue={expense.date || ""}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-lg focus:ouline-none focus:ringe-2 focus:ring-blue-400"
                                />
                            </div>
                            <div className="flex flex-col md:col-span-2">
                                <label className="mb-1 text-sm font-medium text-gray-700">discription</label>
                                <textarea
                                    name='description'
                                    type="text"
                                    placeholder={expense.description}
                                    vlaue={expense.description || ""}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-lg focus:ouline-none focus:ringe-2 focus:ring-blue-400"
                                />
                            </div>
                        </div>

                        <div className="inline-flex items-center gap-3">
                            <button
                                // type="submit"
                                onClick={handleExpenseEdit}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow flex justify-between items-center transition-colors duration-200 gap-2"
                            >
                                <Save size={16} />Save
                            </button>
                            <button

                                onClick={() => navigate('/admin/dashboard/expenses')}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded shadow flex justify-between items-center transition-colors duration-200 gap-2"
                            >
                                <XCircle size={16} />Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}