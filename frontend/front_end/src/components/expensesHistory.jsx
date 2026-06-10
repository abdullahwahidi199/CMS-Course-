import { useEffect, useState } from "react";
import instance from "../api/axiosInstance";

function ExpenseHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const savedTokens=localStorage.getItem("tokens");
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        
        const response=await instance.get('/school/expenses/history/')
        
        const data = response.data
        console.log(data)
        setHistory(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="p-4 bg-white rounded shadow-md">
      <h2 className="text-xl font-bold mb-4">Expense History</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && history.length === 0 && <p>No history found</p>}
      {!loading && !error && history.length > 0 && (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2">Expense Name</th>
              <th className="border p-2">Amount</th>
              <th className="border p-2">Action</th>
              <th className="border p-2">Date</th>
              <th className="border p-2">Changes</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, index) => (
              <tr key={index}>
                <td className="border p-2">{item.name}</td>
                <td className="border p-2">{item.amount} AFN</td>
                <td className="border p-2 capitalize">{item.action}</td>
                <td className="border p-2">
                  {new Date(item.date_time).toLocaleString()}
                </td>
                <td className="border p-2">
                  {item.changed_fields
                    ? Object.entries(item.changed_fields).map(([field, values]) => (
                        <div key={field}>
                          <strong>{field}:</strong> {values.old} → {values.new}
                        </div>
                      ))
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ExpenseHistory;
