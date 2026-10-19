import { createContext, useContext, useEffect, useState } from "react";
import { getMe, loginUser, registerUser } from "./api";

const AuthContext = createContext(null);
const TOKEN_KEY = "policypal_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load: if a saved token exists, ask the API who it belongs to
  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) {
      setLoading(false);
      return;
    }
    getMe(saved)
      .then((me) => {
        setToken(saved);
        setUser(me);
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY)) // expired or invalid
      .finally(() => setLoading(false));
  }, []);

  async function login(username, password) {
    const { access_token } = await loginUser(username, password);
    const me = await getMe(access_token);
    localStorage.setItem(TOKEN_KEY, access_token);
    setToken(access_token);
    setUser(me);
  }

  async function register(payload) {
    await registerUser(payload);
    await login(payload.username, payload.password);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}