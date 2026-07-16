import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthProvider";
import { ArrowRight, Eye, EyeOff, GraduationCap, Lock, ShieldCheck, User } from "lucide-react";
import instance from "../api/axiosInstance";
import { firstAccessiblePath, firstAccessibleTeacherPath } from "../routes/appRoutes";

const SUPER_ADMIN_DASHBOARD = "/super-admin/dashboard";

function isSuperAdmin(roleSlug) {
  return roleSlug === "super-admin" || roleSlug === "super_admin";
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { login, user, permissions, initializing } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (initializing || !user) return;
    const roleSlug = user.role_slug || user.role_details?.slug;
    if (isSuperAdmin(roleSlug)) {
      navigate(SUPER_ADMIN_DASHBOARD, { replace: true });
    } else if (roleSlug === "teacher") {
      navigate(firstAccessibleTeacherPath(permissions), { replace: true });
    } else if (roleSlug === "student") {
      navigate("/student/dashboard", { replace: true });
    } else {
      navigate(firstAccessiblePath(permissions), { replace: true });
    }
  }, [initializing, navigate, permissions, user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const tokenRes = await instance.post("/token/", {
        username,
        password,
      });
      const tokens = tokenRes.data;

      const profile = await login(tokens, remember);
      if (!profile) {
        setError("Could not restore your session.");
        return;
      }

      const roleSlug = profile.role_slug || profile.role_details?.slug;
      if (isSuperAdmin(roleSlug)) {
        navigate(SUPER_ADMIN_DASHBOARD, { replace: true });
      } else if (roleSlug === "teacher") {
        navigate(firstAccessibleTeacherPath(profile.permissions || []), { replace: true });
      } else if (roleSlug === "student") {
        navigate("/student/dashboard");
      } else {
        const nextPath = firstAccessiblePath(profile.permissions || []);
        if (nextPath === "/access-denied") {
          setError("Your account has not been assigned any permissions. Please contact your administrator.");
          return;
        }
        navigate(nextPath, { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.response?.status === 401 || err.response?.status === 400) {
        setError("Invalid username or password");
      } else {
        setError("Something went wrong during login.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 lg:block">
          <img
            src="/school-image.png"
            alt="School campus"
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-slate-950/55" />
          <div className="relative flex h-full flex-col justify-between p-12 text-white">
            <div className="inline-flex w-fit items-center gap-3 rounded-md bg-white/10 px-4 py-3 backdrop-blur">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-500 text-white">
                <GraduationCap size={22} />
              </span>
              <div>
                <p className="text-sm font-semibold">Education Management</p>
                <p className="text-xs text-slate-200">Secure administration portal</p>
              </div>
            </div>

            <div className="max-w-xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">Welcome back</p>
              <h1 className="text-5xl font-semibold leading-tight">Run your center with clarity and control.</h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-200">
                Access attendance, students, billing, reports, and public page tools from one focused workspace.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              {["Attendance", "Billing", "Reports"].map((item) => (
                <div key={item} className="rounded-md border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="font-semibold">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-cyan-700 text-white">
                <GraduationCap size={23} />
              </span>
              <div>
                <p className="font-semibold text-slate-950">Education Management</p>
                <p className="text-sm text-slate-500">Secure administration portal</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
                  <ShieldCheck size={24} />
                </div>
                <h2 className="text-2xl font-semibold text-slate-950">Sign in to your account</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Your session remains active for one day unless you log out.
                </p>
              </div>

              {error ? (
                <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="space-y-5">
                <label className="block text-sm">
                  <span className="mb-2 block font-medium text-slate-700">Username</span>
                  <span className="relative block">
                    <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-cyan-700 focus:ring-4 focus:ring-cyan-50"
                      placeholder="Enter username"
                      autoComplete="username"
                      required
                    />
                  </span>
                </label>

                <label className="block text-sm">
                  <span className="mb-2 block font-medium text-slate-700">Password</span>
                  <span className="relative block">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-11 text-sm text-slate-900 outline-none transition focus:border-cyan-700 focus:ring-4 focus:ring-cyan-50"
                      placeholder="Enter password"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-cyan-700"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </span>
                </label>
              </div>

              <label className="mt-5 flex items-center gap-3 text-sm font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-700"
                />
                Keep me signed in on this device
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {submitting ? "Signing in..." : "Sign in"}
                {!submitting ? <ArrowRight size={18} /> : null}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              Protected access for administrators, teachers, and students.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
