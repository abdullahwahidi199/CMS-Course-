import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: attach token automatically if you use auth
const savedTokens = localStorage.getItem("tokens");
instance.interceptors.request.use(
  (config) => {
    const savedTokens = localStorage.getItem("tokens");

    if (savedTokens) {
      const parsedTokens = JSON.parse(savedTokens);

      if (parsedTokens.access) {
        config.headers.Authorization = `Bearer ${parsedTokens.access}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default instance;
