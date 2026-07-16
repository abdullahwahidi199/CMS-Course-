import { KeyRound, Loader2, LogOut, Save, User } from "lucide-react";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../AuthProvider";
import instance from "../../api/axiosInstance";
import { Modal } from "./SuperAdminUi";

const inputClass = "mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-700 focus:ring-4 focus:ring-cyan-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-950";

function errorText(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (Array.isArray(error)) return error.join(" ");
  if (typeof error === "object") return Object.values(error).flat().join(" ");
  return "Action failed.";
}

export default function ProfileModal({ onClose, onNotify }) {
  const { user, hydrate, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    username: user?.username || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState("");

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setError("");
    try {
      const formData = new FormData();
      Object.entries(profile).forEach(([key, value]) => formData.append(key, value || ""));
      await instance.patch("/auth/profile/", formData);
      await hydrate();
      onNotify?.("Profile updated.");
      onClose();
    } catch (err) {
      setError(errorText(err?.response?.data) || "Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setSavingPassword(true);
    setError("");
    if (passwords.new_password !== passwords.confirm_password) {
      setError("New passwords do not match.");
      setSavingPassword(false);
      return;
    }
    try {
      await instance.post("/auth/change-password/", {
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      setPasswords({ current_password: "", new_password: "", confirm_password: "" });
      onNotify?.("Password changed.");
    } catch (err) {
      setError(errorText(err?.response?.data) || "Could not change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <Modal title="My Profile" description="Update your Super Admin account." onClose={onClose} maxWidth="max-w-3xl">
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Account</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Username and contact details</p>
            </div>
          </div>
          <form onSubmit={saveProfile} className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Username
              <input className={inputClass} value={profile.username} onChange={(event) => setProfile({ ...profile, username: event.target.value })} required />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                First Name
                <input className={inputClass} value={profile.first_name} onChange={(event) => setProfile({ ...profile, first_name: event.target.value })} />
              </label>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Last Name
                <input className={inputClass} value={profile.last_name} onChange={(event) => setProfile({ ...profile, last_name: event.target.value })} />
              </label>
            </div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Email
              <input type="email" className={inputClass} value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Phone
              <input className={inputClass} value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} />
            </label>
            <button type="submit" disabled={savingProfile} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60">
              {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Profile
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Security</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Change password or end session</p>
            </div>
          </div>
          <form onSubmit={changePassword} className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Current Password
              <input type="password" className={inputClass} value={passwords.current_password} onChange={(event) => setPasswords({ ...passwords, current_password: event.target.value })} required />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              New Password
              <input type="password" className={inputClass} value={passwords.new_password} onChange={(event) => setPasswords({ ...passwords, new_password: event.target.value })} required />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Confirm Password
              <input type="password" className={inputClass} value={passwords.confirm_password} onChange={(event) => setPasswords({ ...passwords, confirm_password: event.target.value })} required />
            </label>
            <button type="submit" disabled={savingPassword} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              {savingPassword ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
              Change Password
            </button>
            <button type="button" onClick={handleLogout} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950">
              <LogOut size={16} />
              Logout
            </button>
          </form>
        </section>
      </div>
      {error ? <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">{error}</div> : null}
    </Modal>
  );
}
