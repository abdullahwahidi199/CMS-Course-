import { Outlet } from "react-router-dom";
import Navbar from "./navbar";

export default function AdminDashboard() {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 flex-shrink-0 bg-gray-900 p-4 text-white">
        <Navbar />
      </aside>
      <main className="flex-1 overflow-auto bg-gray-100 p-6">
        <Outlet />
      </main>
    </div>
  );
}
