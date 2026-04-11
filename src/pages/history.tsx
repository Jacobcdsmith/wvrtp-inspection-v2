import { useState, useEffect } from "react";
import { History, CheckCircle2, AlertTriangle, XCircle, Trash2, ClipboardList, MapPin } from "lucide-react";

const HISTORY_KEY = "wvrtp_inspections";

type InspectionRecord = Record<string, string>;

function ResultBadge({ result }: { result: string }) {
  if (result === "Pass")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
        <CheckCircle2 className="h-3 w-3" />
        Pass
      </span>
    );
  if (result === "Attention")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
        <AlertTriangle className="h-3 w-3" />
        Attention
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-950/50 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
      <XCircle className="h-3 w-3" />
      Fail
    </span>
  );
}

// Stable key from record identity, not array position.
function recordKey(rec: InspectionRecord, i: number): string {
  if (rec["ID"] && rec["Date"]) return `${rec["ID"]}-${rec["Date"]}`;
  if (rec["Date"]) return rec["Date"];
  return String(i);
}

export default function HistoryPage() {
  const [records, setRecords] = useState<InspectionRecord[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      setRecords(stored);
    } catch {
      setRecords([]);
    }
  }, []);

  const clearHistory = () => {
    if (confirm("Clear all local inspection history?")) {
      localStorage.removeItem(HISTORY_KEY);
      setRecords([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-5 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Inspection History</h1>
              <p className="text-sm text-slate-300">{records.length} record{records.length !== 1 ? "s" : ""} on this device</p>
            </div>
          </div>
          {records.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1.5 rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {records.length === 0 ? (
          <div className="bg-white dark:bg-card rounded-xl shadow-md border border-slate-200 dark:border-border p-10 flex flex-col items-center gap-3">
            <ClipboardList className="w-10 h-10 text-slate-300" />
            <p className="text-slate-500 dark:text-muted-foreground text-sm font-medium">No inspections submitted yet on this device.</p>
          </div>
        ) : (
          records.map((rec, i) => (
            <div
              key={recordKey(rec, i)}
              className="bg-white dark:bg-card rounded-xl shadow-md border border-slate-200 dark:border-border overflow-hidden"
            >
              <div className={`flex items-center justify-between px-5 py-3 border-l-4 bg-slate-50 dark:bg-muted/30 ${
                rec["Result"] === "Pass" ? "border-emerald-500" : rec["Result"] === "Attention" ? "border-amber-500" : "border-red-500"
              }`}>
                <span className="font-bold text-sm text-slate-800 dark:text-foreground">{rec["ID"] || "—"}</span>
                <ResultBadge result={rec["Result"] || ""} />
              </div>
              <div className="px-5 py-3 space-y-1.5">
                {rec["Equipment Type"] && (
                  <p className="text-sm font-medium text-slate-700 dark:text-foreground">{rec["Equipment Type"]}</p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {rec["Inspector"] && (
                    <span className="text-xs text-slate-500 dark:text-muted-foreground">Inspector: {rec["Inspector"]}</span>
                  )}
                  {rec["Workbook"] && (
                    <span className="text-xs text-slate-400 dark:text-muted-foreground italic">{rec["Workbook"]}</span>
                  )}
                </div>
                {rec["Date"] && (
                  <p className="text-xs text-slate-400 dark:text-muted-foreground">{new Date(rec["Date"]).toLocaleString()}</p>
                )}
                {rec["Address"] && (
                  <p className="text-xs text-slate-400 dark:text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {rec["Address"]}
                  </p>
                )}
                {rec["Notes"] && (
                  <p className="text-xs italic text-slate-400 dark:text-muted-foreground">"{rec["Notes"]}"</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
