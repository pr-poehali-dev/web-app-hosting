import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import func2url from "../../backend/func2url.json";

const AUTH_URL = func2url.auth;
const SUBS_URL = func2url.subscriptions;

export interface User {
  id: number;
  nickname: string;
  email: string;
  role: "owner" | "admin" | "subscriber";
  is_blocked?: boolean;
}

export interface Subscription {
  id: number;
  plan: string;
  plan_label: string;
  status: string;
  started_at: string;
  expires_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  subscription: Subscription | null;
  hasAccess: boolean;
  loading: boolean;
  subLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
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
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);

  const fetchSubscription = useCallback(async (tok: string) => {
    setSubLoading(true);
    try {
      const r = await fetch(`${SUBS_URL}?action=status`, { headers: { "X-Auth-Token": tok } });
      const d = await r.json();
      setSubscription(d.subscription || null);
    } catch {
      setSubscription(null);
    } finally {
      setSubLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${AUTH_URL}?action=me`, { headers: { "X-Auth-Token": token } })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          fetchSubscription(token);
        } else {
          setToken(null);
          localStorage.removeItem("auth_token");
        }
      })
      .catch(() => { setToken(null); localStorage.removeItem("auth_token"); })
      .finally(() => setLoading(false));
  }, []);

  const saveSession = (tok: string, usr: User) => {
    localStorage.setItem("auth_token", tok);
    setToken(tok);
    setUser(usr);
    fetchSubscription(tok);
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
    setSubscription(null);
  };

  const refreshSubscription = async () => {
    if (token) await fetchSubscription(token);
  };

  // owner и admin всегда имеют доступ; subscriber — только при активной подписке
  const hasAccess = !!user && (
    user.role === "owner" ||
    user.role === "admin" ||
    !!subscription
  );

  return (
    <AuthContext.Provider value={{
      user, token, subscription, hasAccess,
      loading, subLoading,
      login, register, logout, refreshSubscription,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
