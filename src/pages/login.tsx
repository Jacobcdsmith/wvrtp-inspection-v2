import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { Loader2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const { login, loginError, loginPending } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo + Title */}
        <div className="flex flex-col items-center mb-8">
          <svg viewBox="0 0 48 48" fill="none" className="w-14 h-14 mb-3">
            <rect width="48" height="48" rx="10" fill="hsl(207,61%,27%)" />
            <path d="M8 34L14 14L20 26L26 14L32 26L38 14" stroke="hsl(29,82%,56%)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <rect x="12" y="36" width="24" height="3" rx="1.5" fill="hsl(206,29%,42%)" opacity="0.7" />
          </svg>
          <h1 className="text-xl font-bold text-foreground tracking-tight">WVRTP Inspection</h1>
          <p className="text-sm text-muted-foreground mt-1">West Virginia Regional Technology Park</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Inspector Sign In</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-medium text-foreground">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                autoCapitalize="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="WVRTP"
                required
                className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
            </div>

            {loginError && (
              <p className="text-sm text-destructive font-medium">{loginError}</p>
            )}

            <button
              type="submit"
              disabled={loginPending}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loginPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Readyfuels · WVRTP Field Inspection System
        </p>
      </div>
    </div>
  );
}
