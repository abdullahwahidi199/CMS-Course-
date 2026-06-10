import { useEffect, useState } from "react";
import { Pencil, Trash2, Save, XCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import instance from "../api/axiosInstance";

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [addExpenseDisplay, setAddTeacherDisply] = useState(false);
  const [newExpense, setNewExpense] = useState({
    name: "",
    date: "",
    amount: "",
    description: "",
  });
  const [financialSummary, setFinancialSummary] = useState("");
  const navigate = useNavigate();

  const addNewExpense = async (e) => {
    e.preventDefault();
    try {
      await instance.post("/expenses/", newExpense);
      setNewExpense({ name: "", date: "", amount: "", description: "" });
      getAllExpenses();
      handleAddExpenseDisplay();
    } catch (error) {
      console.log(error.message);
    }
  };

  const getAllExpenses = async () => {
    try {
      const response = await instance.get("/expenses/");
      setExpenses(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const getFinancialSummary = async () => {
    try {
      const response = await instance.get("/school/financial-summary/");
      setFinancialSummary(response.data);
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    getAllExpenses();
    getFinancialSummary();
  }, []);

  const handleAddExpenseDisplay = () => {
    setAddTeacherDisply(!addExpenseDisplay);
  };

  const handleNewExpenseInfo = (e) => {
    setNewExpense((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold mb-5">Expenses</h1>
        <div className="flex gap-6">
          <button
            className="bg-yellow-500 p-3 rounded-lg shadow-md hover:bg-yellow-600 py-2  font-bold font-mono"
            onClick={handleAddExpenseDisplay}
          >
            Make Expense
          </button>

          <button
            className="bg-blue-600 p-3 rounded-lg shadow-md hover:bg-blue-700 py-2 font-bold font-mono text-white"
            onClick={() => navigate("history/")}
          >
            View History
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-10 ">
        <div className="bg-green-100 p-4 rounded-lg shadow text-center">
          <p className="text-sm text-green-700 font-semibold">Total Earnings</p>
          <p className="text-2xl font-bold text-green-800">
            {financialSummary.total_earnings} afs
          </p>
        </div>
        <div className="bg-red-100 p-4 rounded-lg shadow text-center">
          <p className="text-sm text-red-700 font-semibold">Expenses</p>
          <p className="text-2xl font-bold text-red-800">
            {financialSummary.total_expenses}
          </p>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg shadow text-center">
          <p className="text-sm text-blue-700 font-semibold">
            Remaining Balance
          </p>
          <p className="text-2xl font-bold text-blue-800">
            {financialSummary.net_balance}
          </p>
        </div>
      </div>
      <div className="grid gap-4">
        {expenses.length > 0 ? (
          expenses.map((expense) => (
            <div
              key={expense.id}
              className="bg-white p-4 rounded-2xl shadow-md hover:shadow-lg cursor-pointer transition-shadow border border-gray-200"
            >
              <Link to={`history/${expense.id}`}>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">{expense.name}</h2>
                  <span className="text-lg font-bold text-red-500">
                    {expense.amount}af
                  </span>
                </div>
                <p className="text-gray-600 mt-2">{expense.description}</p>
                <div className="mt-3 text-sm text-gray-500 flex justify-end">
                  {new Date(expense.date).toLocaleDateString()}
                </div>
              </Link>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">No expense recorded.</p>
        )}
      </div>

      {addExpenseDisplay && (
        <div className="fixed bg-gray-300 inset-0 z-50 flex justify-center items-center">
          <form
            onSubmit={addNewExpense}
            className="space-y-6 mt-6 bg-white p-6 rounded-2xl shadow-lg max-w-2xl mx-auto border border-gray-200"
          >
            <h2 className="text-2xl font-bold text-center mb-4">
              Add New Expense
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  Expense Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={newExpense.name}
                  onChange={handleNewExpenseInfo}
                  placeholder="Enter expense name"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  value={newExpense.amount}
                  onChange={handleNewExpenseInfo}
                  placeholder="Enter amount"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={newExpense.date}
                  onChange={handleNewExpenseInfo}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="mb-1 text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={newExpense.description}
                  onChange={handleNewExpenseInfo}
                  placeholder="Write a short description..."
                  rows="3"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>
            </div>

            <div className="inline-flex items-center gap-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition-colors duration-200 inline-flex items-center gap-2"
              >
                <Save size={16} />
                Save Expense
              </button>
              <button
                onClick={handleAddExpenseDisplay}
                className="bg-gray-500 hover:bg-gray-6400 rounded shadow inline-flex items-center gap-2 px-6 py-2 text-white transition-colors duration-200"
              >
                <XCircle size={16} />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
export default Expenses;
