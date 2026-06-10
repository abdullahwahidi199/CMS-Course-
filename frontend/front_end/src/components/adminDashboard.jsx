import { useContext, useEffect } from "react";
import { AuthContext } from "../AuthProvider";
import { Outlet } from "react-router-dom";
import Navbar from "./navbar";
import instance from "../api/axiosInstance";
export default function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);
  const savedTokens = localStorage.getItem("tokens");
  const fetchDashboard = async () => {
    try {
      const parsedTokens = JSON.parse(savedTokens);
      const response = await instance.get("/dashboard/");
      const data = await response.data;

      console.log(data);
    } catch (error) {
      console.error(error.message);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-60 bg-gray-800 text-white p-4 flex-shrink-0">
        <Navbar />
      </div>
      <main className="flex-1 bg-gray-100 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
