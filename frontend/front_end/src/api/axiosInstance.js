import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise = null;

export function getStoredTokens() {
  try {
    return JSON.parse(localStorage.getItem("tokens") || "null");
  } catch {
    return null;
  }
}

export function storeTokens(tokens, remember = true) {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem("tokens", JSON.stringify(tokens));
  if (!remember) localStorage.removeItem("tokens");
}

export function clearAuthStorage() {
  localStorage.removeItem("tokens");
  localStorage.removeItem("auth_user");
  localStorage.removeItem("username");
  sessionStorage.removeItem("tokens");
}

instance.interceptors.request.use((config) => {
  const tokens = getStoredTokens() || JSON.parse(sessionStorage.getItem("tokens") || "null");
  if (tokens?.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const tokens = getStoredTokens() || JSON.parse(sessionStorage.getItem("tokens") || "null");
    const isRefreshRequest = originalRequest?.url?.includes("/token/refresh/");

    if (error.response?.status !== 401 || originalRequest?._retry || !tokens?.refresh || isRefreshRequest) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      refreshPromise =
        refreshPromise ||
        instance.post("/token/refresh/", { refresh: tokens.refresh }).finally(() => {
          refreshPromise = null;
        });
      const response = await refreshPromise;
      const nextTokens = { ...tokens, access: response.data.access };
      const remember = Boolean(localStorage.getItem("tokens"));
      storeTokens(nextTokens, remember);
      originalRequest.headers.Authorization = `Bearer ${nextTokens.access}`;
      return instance(originalRequest);
    } catch (refreshError) {
      clearAuthStorage();
      window.dispatchEvent(new Event("auth:logout"));
      return Promise.reject(refreshError);
    }
  },
);

export default instance;
