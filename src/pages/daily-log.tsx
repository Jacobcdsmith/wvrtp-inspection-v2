import { useState } from "react";
import { useToast } from "../hooks/use-toast";
import { TableProperties, Loader2, Send, User, Calendar } from "lucide-react";

interface LogRow {
  fire: string;
  upperAir: string;
  lowerAir: string;
  instAir: string;
  outdoorTemp: string;
  gasPsi: string;
  notes: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

function makeEmptyRows(): LogRow[] {
  return HOURS.map(() => ({ fire: "", upperAir: "", lowerAir: "", instAir: "", outdoorTemp: "", gasPsi: "", notes: "" }));
}

export default function DailyLogPage() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [nightOperator, setNightOperator] = useState("");
  const [dayOperator, setDayOperator] = useState("");
  const [rows, setRows] = useState<LogRow[]>(makeEmptyRows());

  const updateRow = (hour: number, field: keyof LogRow, value: string) => {
    setRows(prev => {
      const next = [...prev];
      next[hour] = { ...next[hour], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !nightOperator || !dayOperator) {
      toast({ title: "Missing Fields", description: "Date and both operator names are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const payload = {
      formType: "daily-log",
      date, nightOperator, dayOperator,
      rows: rows.map((r, i) => ({ time: HOURS[i], ...r })),
      submittedAt: new Date().toISOString(),
    };
    const webhookUrl = (import.meta.env as Record<string, string | undefined>)["VITE_WEBHOOK_URL"];
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } catch {
        toast({ title: "Submit Failed", description: "Could not deliver to webhook.", variant: "destructive" });
        setSubmitting(false);
        return;
      }
    }
    toast({ title: "Daily Log Submitted", description: `Log for ${date} saved.` });
    setRows(makeEmptyRows());
    setSubmitting(false);
  };

  const cellClass = "w-full h-8 px-2 text-sm border-0 bg-transparent focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded";

  const columns = [
    { key: "fire" as keyof LogRow, label: "Fire H₂O", w: "min-w-[90px]" },
    { key: "upperAir" as keyof LogRow, label: "Upper Air", w: "min-w-[90px]" },
    { key: "lowerAir" as keyof LogRow, label: "Lower Air", w: "min-w-[90px]" },
    { key: "instAir" as keyof LogRow, label: "Inst. Air", w: "min-w-[90px]" },
    { key: "outdoorTemp" as keyof LogRow, label: "Outdoor Temp", w: "min-w-[100px]" },
    { key: "gasPsi" as keyof LogRow, label: "Gas PSI", w: "min-w-[80px]" },
    { key: "notes" as keyof LogRow, label: "Notes", w: "min-w-[140px]" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-5 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <TableProperties className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Daily Operations Log</h1>
            <p className="text-sm text-slate-300">24-hour shift data entry</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

          {/* Header info */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
            <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-slate-500 bg-slate-50 dark:bg-muted/30">
              <Calendar className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">Log Header</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-slate-200 dark:border-input bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1"><User className="w-3 h-3" /> Night Operator</label>
                <input type="text" value={nightOperator} onChange={e => setNightOperator(e.target.value)} placeholder="Name"
                  className="h-10 px-3 rounded-lg border border-slate-200 dark:border-input bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1"><User className="w-3 h-3" /> Day Operator</label>
                <input type="text" value={dayOperator} onChange={e => setDayOperator(e.target.value)} placeholder="Name"
                  className="h-10 px-3 rounded-lg border border-slate-200 dark:border-input bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Log Table */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
            <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-blue-500 bg-slate-50 dark:bg-muted/30">
              <TableProperties className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">Hourly Readings</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-muted/50 sticky top-0 z-20">
                    <th className="sticky left-0 z-10 bg-slate-100 dark:bg-muted/50 px-3 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wide border-b border-slate-200 min-w-[72px]">Time</th>
                    {columns.map(c => (
                      <th key={c.key} className={`px-2 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wide border-b border-slate-200 ${c.w}`}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HOURS.map((time, i) => (
                    <tr key={time} className={i % 2 === 0 ? "bg-white dark:bg-background" : "bg-slate-50 dark:bg-muted/20"}>
                      <td className={`sticky left-0 z-10 px-3 py-1 font-mono text-xs font-bold text-slate-600 border-b border-slate-100 ${i % 2 === 0 ? "bg-white dark:bg-background" : "bg-slate-50 dark:bg-muted/20"}`}>{time}</td>
                      {columns.map(c => (
                        <td key={c.key} className="px-1 py-0.5 border-b border-slate-100">
                          <input
                            type="text"
                            value={rows[i][c.key]}
                            onChange={e => updateRow(i, c.key, e.target.value)}
                            className={cellClass}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4" /> Submit Daily Log</>}
          </button>
        </div>
      </form>
    </div>
  );
}
