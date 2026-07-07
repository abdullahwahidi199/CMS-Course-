import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import instance, { clearAuthStorage, getStoredTokens, storeTokens } from "./api/axiosInstance";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(getStoredTokens);
  const [permissions, setPermissions] = useState([]);
  const [menus, setMenus] = useState([]);
  const [tenant, setTenant] = useState(null);
  const [profile, setProfile] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const hydrate = useCallback(async () => {
    const savedTokens = getStoredTokens() || JSON.parse(sessionStorage.getItem("tokens") || "null");
    if (!savedTokens) {
      setInitializing(false);
      return null;
    }
    try {
      setTokens(savedTokens);
      const response = await instance.get("/auth/me/");
      const currentUser = response.data;
      setUser(currentUser);
      setPermissions(currentUser.permissions || []);
      setMenus(currentUser.menus || []);
      setTenant(currentUser.tenant || null);
      setProfile(currentUser.profile || null);
      localStorage.setItem("auth_user", JSON.stringify(currentUser));
      localStorage.setItem("username", currentUser.username);
      return currentUser;
    } catch {
      clearAuthStorage();
      setUser(null);
      setTokens(null);
      setPermissions([]);
      setMenus([]);
      setTenant(null);
      setProfile(null);
      return null;
    } finally {
      setInitializing(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const currentTokens = getStoredTokens() || JSON.parse(sessionStorage.getItem("tokens") || "null");
    try {
      if (currentTokens?.refresh) {
        await instance.post("/auth/logout/", { refresh: currentTokens.refresh });
      }
    } catch {
      // Local logout should always continue even if token blacklist is unavailable.
    }
    clearAuthStorage();
    setTokens(null);
    setUser(null);
    setPermissions([]);
    setMenus([]);
    setTenant(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    hydrate();
    const onLogout = () => logout();
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [hydrate, logout]);

  const login = useCallback(async (nextTokens, remember = true) => {
    storeTokens(nextTokens, remember);
    setTokens(nextTokens);
    return hydrate();
  }, [hydrate]);

  const can = useCallback((permission) => permissions.includes(permission), [permissions]);

  const value = useMemo(
    () => ({
      user,
      tokens,
      permissions,
      menus,
      tenant,
      profile,
      initializing,
      hydrate,
      login,
      logout,
      can,
    }),
    [can, hydrate, initializing, login, logout, menus, permissions, profile, tenant, tokens, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
