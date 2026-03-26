import { createContext, useContext, useState, useCallback, ReactNode } from "react";

const AUTH_KEY = "wvrtp_auth";
const VALID_USERNAME = "WVRTP";
// Reads from VITE_APP_PASSWORD at build time. Falls back to "inspector2026" if
// the env var is not set. Note: this value is embedded in the JS bundle —
// it is not secret. See README § Auth for details.
const VALID_PASSWORD = import.meta.env.VITE_APP_PASSWORD ?? "inspector2026";

interface AuthContextValue {
  isAuthenticated: boolean;
  loginError: string | null;
  loginPending: boolean;
  login: (creds: { username: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(AUTH_KEY) === "true"
  );
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginPending, setLoginPending] = useState(false);

  const login = useCallback(async (creds: { username: string; password: string }) => {
    setLoginPending(true);
    setLoginError(null);
    await new Promise((r) => setTimeout(r, 300));
    if (creds.username.trim() === VALID_USERNAME && creds.password === VALID_PASSWORD) {
      localStorage.setItem(AUTH_KEY, "true");
      setIsAuthenticated(true);
    } else {
      setLoginError("Invalid username or password.");
    }
    setLoginPending(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, loginError, loginPending, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
