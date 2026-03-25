import { Router, Route, Switch, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { useAuth } from "./hooks/use-auth";
import LoginPage from "./pages/login";
import InspectPage from "./pages/inspect";
import HistoryPage from "./pages/history";
import NotFound from "./pages/not-found";
import { ClipboardCheck, History, LogOut } from "lucide-react";
import { Link, useRoute } from "wouter";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [isActive] = useRoute(href);
  return (
    <Link href={href}>
      <span className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
        isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}>
        {children}
      </span>
    </Link>
  );
}

function TopNav() {
  const { logout } = useAuth();
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
            <rect width="32" height="32" rx="6" fill="hsl(207,61%,27%)" />
            <path d="M6 22L10 10L14 18L18 10L22 18L26 10" stroke="hsl(29,82%,56%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <rect x="8" y="24" width="16" height="2" rx="1" fill="hsl(206,29%,42%)" opacity="0.7" />
          </svg>
          <span className="text-sm font-bold tracking-tight">WVRTP</span>
        </div>
        <nav className="flex items-center gap-1">
          <NavLink href="/">
            <ClipboardCheck className="w-4 h-4" />
            Inspect
          </NavLink>
          <NavLink href="/history">
            <History className="w-4 h-4" />
            History
          </NavLink>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </nav>
      </div>
    </header>
  );
}

function ProtectedApp() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={InspectPage} />
          <Route path="/history" component={HistoryPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function AppRouter() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <LoginPage />;
  return <ProtectedApp />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router hook={useHashLocation}>
          <AppRouter />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
