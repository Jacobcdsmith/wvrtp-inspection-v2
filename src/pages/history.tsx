import { useState, useEffect } from "react";
import { History, CheckCircle2, AlertTriangle, XCircle, Trash2 } from "lucide-react";

const HISTORY_KEY = "wvrtp_inspections";

type InspectionRecord = Record<string, string>;

function ResultBadge({ result }: { result: string }) {
  if (result === "Pass")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        Pass
      </span>
    );
  if (result === "Attention")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
        <AlertTriangle className="h-3 w-3" />
        Attention
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
      <XCircle className="h-3 w-3" />
      Fail
    </span>
  );
}

// Stable key from record identity, not array position.
// Falls back to index only if both ID and Date are missing (shouldn't happen).
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
    <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <History className="h-5 w-5" />
          Inspection History
        </h1>
        {records.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1 rounded-md border border-destructive px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <p className="text-muted-foreground text-sm">No inspections submitted yet on this device.</p>
      ) : (
        <ul className="space-y-3">
          {records.map((rec, i) => (
            <li
              key={recordKey(rec, i)}
              className="rounded-lg border bg-card p-4 shadow-sm space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{rec["ID"] || "\u2014"}</span>
                <ResultBadge result={rec["Result"] || ""} />
              </div>
              <div className="text-xs text-muted-foreground">{rec["Equipment Type"] || ""}</div>
              <div className="text-xs text-muted-foreground">Inspector: {rec["Inspector"] || "\u2014"}</div>
              {rec["Date"] && (
                <div className="text-xs text-muted-foreground">{new Date(rec["Date"]).toLocaleString()}</div>
              )}
              {rec["Address"] && (
                <div className="text-xs text-muted-foreground">{rec["Address"]}</div>
              )}
              {rec["Notes"] && (
                <div className="text-xs italic text-muted-foreground">"{rec["Notes"]}"</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
