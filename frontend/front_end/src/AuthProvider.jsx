import { createContext, useState, useEffect } from "react";
import instance from "./api/axiosInstance";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      const savedTokens = localStorage.getItem("tokens");

      if (!savedTokens) return;

      try {
        const parsedTokens = JSON.parse(savedTokens);
        setTokens(parsedTokens);

        const res = await instance.get("/api/profile/");
        const data = res.data;

        console.log(data);

        localStorage.setItem("username", data.username);
        setUser(data);
      } catch (error) {
        console.error(error);
        logout();
      }
    };

    loadProfile();
  }, []);

  const login = (tokens, profile) => {
    setTokens(tokens);
    setUser(profile);
    localStorage.setItem("tokens", JSON.stringify(tokens));
  };

  const logout = () => {
    setTokens(null);
    setUser(null);
    localStorage.removeItem("tokens");
    localStorage.removeItem("username");
  };

  return (
    <AuthContext.Provider value={{ user, tokens, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
