import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthProvider";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,setError]=useState(null);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Step 1: Get tokens
      const res = await fetch("http://127.0.0.1:8000/api/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        setError("Invalid username or password");
        return;
      }

      const tokens = await res.json();

      // Step 2: Fetch user profile with access token
      const profileRes = await fetch("http://127.0.0.1:8000/api/profile/", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.access}`,
        },
      });

      if (!profileRes.ok) {
        alert("Could not fetch profile");
        return;
      }

      const profile = await profileRes.json();

      // Step 3: Save in context + localStorage
      login(tokens, profile);

      // Step 4: Navigate based on role
      if (profile.role === "admin") {
        navigate("/admin/dashboard");
      } else if (profile.role === "teacher") {
        navigate("/teacher/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong during login.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-200 via-blue-100 to-pink-200">
  <form
    onSubmit={handleLogin}
    className="bg-white/80 backdrop-blur-md p-10 rounded-3xl shadow-xl w-96 flex flex-col space-y-6"
  >
    <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-4">
      Welcome Back
    </h2>

    {/* Username */}
    <div className="relative">
      <input
        type="text"
        id="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder=" "
        className={`peer w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition`}
        required
      />
      <label
        htmlFor="username"
        className={`absolute left-4 text-gray-400 text-sm transition-all
          ${username ? 'top-1 text-blue-500 text-sm' : 'top-4 text-gray-400 text-base'}
          peer-focus:top-1 peer-focus:text-blue-500 peer-focus:text-sm
        `}
      >
        Username
      </label>
    </div>

    {/* Password */}
    <div className="relative">
      <input
        type="password"
        id="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder=" "
        className="peer w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition"
        required
      />
      <label
        htmlFor="password"
        className={`absolute left-4 text-gray-400 text-sm transition-all
          ${password ? 'top-1 text-blue-500 text-sm' : 'top-4 text-gray-400 text-base'}
          peer-focus:top-1 peer-focus:text-blue-500 peer-focus:text-sm
        `}
      >
        Password
      </label>
    </div>

    <button
      type="submit"
      className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:from-purple-600 hover:to-blue-600 transition-all"
    >
      Login
    </button>

    {error && (
      <h3 className="text-red-600 text-center font-medium mt-2">{error}</h3>
    )}

   
  </form>
</div>

  );
}
