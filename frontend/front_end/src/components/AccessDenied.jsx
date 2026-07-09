import { Link } from "react-router-dom";

export default function AccessDenied() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <section className="max-w-md rounded-lg bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-red-50 text-xl font-bold text-red-600">!</div>
        <h1 className="text-xl font-semibold text-slate-950">Access Denied</h1>
        <p className="mt-2 text-sm text-slate-500">You do not have permission to access this page.</p>
        <Link className="mt-5 inline-flex rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white" to="/admin/dashboard">
          Back to Dashboard
        </Link>
      </section>
    </div>
  );
}
