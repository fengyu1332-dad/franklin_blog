import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

interface AuthContextType {
  token: string | null;
  login: (password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  authHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "admin_token";

// localStorage (not sessionStorage) so that opening the draft preview in a new
// tab keeps the admin session — sessionStorage is per-tab and would 404 drafts.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY)
  );

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      // Verify token is still valid on mount
      fetch("/api/auth/check", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        if (!res.ok) {
          setToken(null);
          localStorage.removeItem(TOKEN_KEY);
        }
      });
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  const login = useCallback(async (password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        return { ok: true };
      }
      const err = await res.json().catch(() => ({ error: "Login failed" }));
      return { ok: false, error: err.error ?? "Invalid password" };
    } catch {
      return { ok: false, error: "Network error. Please check your connection." };
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
  }, []);

  const authHeaders = useCallback(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  return (
    <AuthContext.Provider
      value={{
        token,
        login,
        logout,
        isAuthenticated: !!token,
        authHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
