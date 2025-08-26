import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(null);

  useEffect(() => {
    // restore from localStorage
    const savedTokens = localStorage.getItem("tokens");
    if (savedTokens) {
      const parsedTokens = JSON.parse(savedTokens);
      setTokens(parsedTokens);
      fetch("http://127.0.0.1:8000/api/profile/", {
        headers: {
          Authorization: `Bearer ${parsedTokens.access}`,
        },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          console.log(data)
          if (data) setUser(data);
          else logout();
        });
    }
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
  };

  return (
    <AuthContext.Provider value={{ user, tokens, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
