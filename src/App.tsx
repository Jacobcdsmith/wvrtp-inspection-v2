import { Router, Route, Switch, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider, useAuth } from "./context/auth-context";
import LoginPage from "./pages/login";
import InspectPage from "./pages/inspect";
import HistoryPage from "./pages/history";
import NotFound from "./pages/not-found";
import WaterChemistryPage from "./pages/water-chemistry";
import BoilerDailyPage from "./pages/boiler-daily";
import DailyLogPage from "./pages/daily-log";
import OilCheckPage from "./pages/oil-check";
import WeeklyOpsPage from "./pages/weekly-ops";
import EventLogPage from "./pages/event-log";
import { ClipboardCheck, History, LogOut, Droplets, Flame, TableProperties, Droplet, ClipboardList, Bolt } from "lucide-react";
import { Link, useRoute } from "wouter";
import { WORKBOOKS } from "./lib/workbooks";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [isActive] = useRoute(href);
  return (
    <Link href={href}>
      <span className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${
        isActive
          ? "bg-primary text-primary-foreground border-t-2 border-t-primary-foreground/60"
          : "text-muted-foreground/70 hover:text-foreground hover:bg-muted"
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
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14 gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
            <rect width="32" height="32" rx="6" fill="hsl(207,61%,27%)" />
            <path d="M6 22L10 10L14 18L18 10L22 18L26 10" stroke="hsl(29,82%,56%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <rect x="8" y="24" width="16" height="2" rx="1" fill="hsl(206,29%,42%)" opacity="0.7" />
          </svg>
          <span className="text-sm font-bold tracking-tight">WVRTP</span>
        </div>
        <nav className="flex items-center gap-0.5 overflow-x-auto flex-nowrap flex-1 min-w-0 scrollbar-hide">
          {WORKBOOKS.map((wb) => (
            <NavLink key={wb.id} href={`/inspect/${wb.id}`}>
              <ClipboardCheck className="w-3.5 h-3.5" />
              {wb.label}
            </NavLink>
          ))}
          <NavLink href="/history">
            <History className="w-3.5 h-3.5" />
            History
          </NavLink>
          <span className="text-border px-1 text-lg select-none shrink-0">|</span>
          <NavLink href="/inspect/water-chemistry">
            <Droplets className="w-3.5 h-3.5" />
            Water Chem
          </NavLink>
          <NavLink href="/inspect/boiler-daily">
            <Flame className="w-3.5 h-3.5" />
            Boiler Daily
          </NavLink>
          <NavLink href="/inspect/daily-log">
            <TableProperties className="w-3.5 h-3.5" />
            Daily Log
          </NavLink>
          <NavLink href="/inspect/oil-check">
            <Droplet className="w-3.5 h-3.5" />
            Oil Check
          </NavLink>
          <NavLink href="/inspect/weekly-ops">
            <ClipboardList className="w-3.5 h-3.5" />
            Weekly Ops
          </NavLink>
          <NavLink href="/event-log">
            <Bolt className="w-3.5 h-3.5" />
            Event Log
          </NavLink>
        </nav>
        <button
          onClick={logout}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </header>
  );
}

function RootRedirect() {
  const hash = window.location.hash;
  const qIdx = hash.indexOf("?");
  const qs = qIdx !== -1 ? hash.substring(qIdx) : "";
  return <Redirect to={`/inspect/${WORKBOOKS[0].id}${qs}`} />;
}

function ProtectedApp() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={RootRedirect} />
          {WORKBOOKS.map((wb) => (
            <Route key={wb.id} path={`/inspect/${wb.id}`}>
              <InspectPage workbook={wb} />
            </Route>
          ))}
          <Route path="/history" component={HistoryPage} />
          <Route path="/inspect/water-chemistry" component={WaterChemistryPage} />
          <Route path="/inspect/boiler-daily" component={BoilerDailyPage} />
          <Route path="/inspect/daily-log" component={DailyLogPage} />
          <Route path="/inspect/oil-check" component={OilCheckPage} />
          <Route path="/inspect/weekly-ops" component={WeeklyOpsPage} />
          <Route path="/event-log" component={EventLogPage} />
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
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Router hook={useHashLocation}>
          <AppRouter />
        </Router>
      </TooltipProvider>
    </AuthProvider>
  );
}
