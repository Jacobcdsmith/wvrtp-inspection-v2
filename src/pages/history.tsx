import { useState, useEffect } from "react";
import { History, CheckCircle2, AlertTriangle, XCircle, Trash2 } from "lucide-react";

const HISTORY_KEY = "wvrtp_inspections";

type InspectionRecord = Record<string, string>;

function ResultBadge({ result }: { result: string }) {
  if (result === "Pass") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
      <CheckCircle2 className="w-3 h-3" /> Pass
    </span>
  );
  if (result === "Attention") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
      <AlertTriangle className="w-3 h-3" /> Attention
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-semibold">
      <XCircle className="w-3 h-3" /> Fail
    </span>
  );
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
    <div className="max-w-lg mx-auto px-4 pb-8">
      <div className="pt-5 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Inspection History</h1>
        </div>
        {records.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No inspections submitted yet on this device.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((rec, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="font-semibold text-sm text-foreground">{rec["ID"] || "—"}</span>
                  <span className="text-muted-foreground text-xs ml-2">{rec["Equipment Type"] || ""}</span>
                </div>
                <ResultBadge result={rec["Result"] || ""} />
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>Inspector: {rec["Inspector"] || "—"}</div>
                {rec["Date"] && <div>{new Date(rec["Date"]).toLocaleString()}</div>}
                {rec["Address"] && <div className="truncate">{rec["Address"]}</div>}
                {rec["Notes"] && <div className="text-foreground italic">"{rec["Notes"]}"</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
