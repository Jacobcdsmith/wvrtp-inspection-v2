import { useState, useCallback } from "react";

const AUTH_KEY = "wvrtp_auth";
const VALID_USERNAME = "WVRTP";
const VALID_PASSWORD = "inspector2026";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(AUTH_KEY) === "true";
  });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginPending, setLoginPending] = useState(false);

  const login = useCallback(async (creds: { username: string; password: string }) => {
    setLoginPending(true);
    setLoginError(null);

    await new Promise((r) => setTimeout(r, 300));

    if (
      creds.username.trim() === VALID_USERNAME &&
      creds.password === VALID_PASSWORD
    ) {
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

  return { isAuthenticated, login, logout, loginError, loginPending };
}
