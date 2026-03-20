import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import func2url from "../../backend/func2url.json";

const AUTH_URL = func2url.auth;

export interface User {
  id: number;
  nickname: string;
  email: string;
  role: "owner" | "admin" | "subscriber";
  is_blocked?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterData {
  nickname: string;
  email: string;
  password: string;
  gdpr_consent: boolean;
  invite_code?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${AUTH_URL}?action=me`, {
      headers: { "X-Auth-Token": token },
    })
      .then(r => r.json())
      .then(data => {
        if (data.user) setUser(data.user);
        else { setToken(null); localStorage.removeItem("auth_token"); }
      })
      .catch(() => { setToken(null); localStorage.removeItem("auth_token"); })
      .finally(() => setLoading(false));
  }, []);

  const saveSession = (tok: string, usr: User) => {
    localStorage.setItem("auth_token", tok);
    setToken(tok);
    setUser(usr);
  };

  const login = async (email: string, password: string) => {
    const res = await fetch(`${AUTH_URL}?action=login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ошибка входа");
    saveSession(data.token, data.user);
  };

  const register = async (formData: RegisterData) => {
    const res = await fetch(`${AUTH_URL}?action=register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ошибка регистрации");
    saveSession(data.token, data.user);
  };

  const logout = async () => {
    if (token) {
      await fetch(`${AUTH_URL}?action=logout`, {
        method: "POST",
        headers: { "X-Auth-Token": token },
      }).catch(() => {});
    }
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
