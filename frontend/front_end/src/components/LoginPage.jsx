import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthProvider";
import { Eye, EyeOff } from "lucide-react";
import instance from "../api/axiosInstance";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Get tokens
      const tokenRes = await instance.post("/token/", {
        username,
        password,
      });
      const tokens = tokenRes.data;

      // Save tokens FIRST so the interceptor can use them for the profile call
      localStorage.setItem("tokens", JSON.stringify(tokens));

      // Fetch profile
      const profileRes = await instance.get("/profile/");
      const profile = profileRes.data;
      console.log(profile);

      login(tokens, profile);

      if (profile.role === "super_admin") {
        navigate("/super-admin/dashboard");
        return;
      } else if (profile.role === "admin") {
        navigate("/admin/dashboard");
      } else if (profile.role === "teacher") {
        navigate("/teacher/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.response?.status === 401 || err.response?.status === 400) {
        setError("Invalid username or password");
      } else {
        alert("Something went wrong during login.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200">
      <form
        onSubmit={handleLogin}
        className="bg-white p-10 rounded-xl shadow-md w-96"
      >
        <h2 className="text-3xl font-semibold text-center text-gray-800 mb-8">
          Welcome Back
        </h2>

        <div className="relative mb-8">
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="peer w-full border-b-2 border-gray-300 bg-transparent py-2 px-1 text-gray-800 placeholder-transparent focus:outline-none focus:border-blue-500"
            placeholder="Username"
            required
          />
          <label
            htmlFor="username"
            className={`absolute left-1 text-gray-500 text-base transition-all duration-200
              ${
                username
                  ? "-top-3 text-sm text-blue-600"
                  : "top-2 text-gray-400 text-base"
              }
              peer-focus:-top-3 peer-focus:text-sm peer-focus:text-blue-600`}
          >
            Username
          </label>
        </div>

        <div className="relative mb-10">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="peer w-full border-b-2 border-gray-300 bg-transparent py-2 px-1 text-gray-800 placeholder-transparent focus:outline-none focus:border-blue-500"
            placeholder="Password"
            required
          />
          <label
            htmlFor="password"
            className={`absolute left-1 text-gray-500 text-base transition-all duration-200
              ${
                password
                  ? "-top-3 text-sm text-blue-600"
                  : "top-2 text-gray-400 text-base"
              }
              peer-focus:-top-3 peer-focus:text-sm peer-focus:text-blue-600`}
          >
            Password
          </label>

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-1 top-2.5 text-gray-500 hover:text-blue-600"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition"
        >
          Login
        </button>

        {error && (
          <p className="text-red-600 text-center mt-3 text-sm">{error}</p>
        )}
      </form>
    </div>
  );
}
