import { useState } from "react";
import { useToast } from "../hooks/use-toast";
import { ClipboardList, CheckCircle2, XCircle, MinusCircle, Loader2, Send, User, Calendar } from "lucide-react";

type CheckResult = "Pass" | "Fail" | "N/A" | "";

interface CheckItem {
  id: string;
  label: string;
  result: CheckResult;
  comments: string;
  initials: string;
}

const INITIAL_ITEMS: Omit<CheckItem, "result" | "comments" | "initials">[] = [
  { id: "asbestos",      label: "Asbestos Insulation — Intact/Undamaged" },
  { id: "doorsWindows",  label: "Doors & Windows — Secure/No Gaps" },
  { id: "pumpDischarge", label: "Pump Discharge / Firewater (704)" },
  { id: "carSealsVis",   label: "Car Seals Visible" },
  { id: "housekeeping",  label: "Boiler House Housekeeping" },
  { id: "carSealCheck",  label: "Car Seal Check" },
  { id: "valvePlantAir", label: "Valve Under Relief — Plant Air" },
  { id: "reducingStation", label: "Reducing Station" },
  { id: "valveAirDryer",  label: "Valves Under Relief — Air Dryer" },
  { id: "otherAreas",    label: "Other Areas" },
  { id: "campusHousekeeping", label: "General Campus Housekeeping" },
];

function makeItems(): CheckItem[] {
  return INITIAL_ITEMS.map(i => ({ ...i, result: "", comments: "", initials: "" }));
}

function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function WeeklyOpsPage() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [inspector, setInspector] = useState("");
  const [date, setDate] = useState(getLocalDateString());
  const [items, setItems] = useState<CheckItem[]>(makeItems());

  const updateItem = (id: string, field: keyof CheckItem, value: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const passCount = items.filter(i => i.result === "Pass").length;
  const failCount = items.filter(i => i.result === "Fail").length;
  const naCount   = items.filter(i => i.result === "N/A").length;
  const doneCount = items.filter(i => i.result !== "").length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspector || !date) {
      toast({ title: "Missing Fields", description: "Inspector name and date are required.", variant: "destructive" });
      return;
    }
    const incomplete = items.filter(i => i.result === "");
    if (incomplete.length > 0) {
      toast({ title: "Incomplete", description: `${incomplete.length} item(s) have no result selected.`, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const payload = {
      formType: "weekly-ops",
      inspector, date,
      items: items.map(({ id, label, result, comments, initials }) => ({ id, label, result, comments, initials })),
      summary: { pass: passCount, fail: failCount, na: naCount },
      submittedAt: new Date().toISOString(),
    };
    const webhookUrl = (import.meta.env as Record<string, string | undefined>)["VITE_WEBHOOK_URL"];
    if (!webhookUrl) {
      toast({ title: "Submit Failed", description: "Webhook is not configured. This checklist could not be saved.", variant: "destructive" });
      setSubmitting(false);
      return;
    }
    try {
      const response = await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) {
        toast({ title: "Submit Failed", description: `Webhook returned HTTP ${response.status}.`, variant: "destructive" });
        setSubmitting(false);
        return;
      }
    } catch {
      toast({ title: "Submit Failed", description: "Could not deliver to webhook.", variant: "destructive" });
      setSubmitting(false);
      return;
    }
    toast({ title: "Weekly Ops Submitted", description: `${passCount} Pass / ${failCount} Fail / ${naCount} N/A` });
    setItems(makeItems()); setInspector(""); setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-5 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Weekly Ops Checklist</h1>
            <p className="text-sm text-slate-300">Weekly operational inspection — {INITIAL_ITEMS.length} items</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

          {/* Live counter bar */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md border border-slate-200 dark:border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Progress — {doneCount} / {INITIAL_ITEMS.length}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-3">
              <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${(doneCount / INITIAL_ITEMS.length) * 100}%` }} />
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-600">{passCount}</span>
                <span className="text-xs text-slate-400">Pass</span>
              </div>
              <div className="flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-bold text-red-600">{failCount}</span>
                <span className="text-xs text-slate-400">Fail</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MinusCircle className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-500">{naCount}</span>
                <span className="text-xs text-slate-400">N/A</span>
              </div>
            </div>
          </div>

          {/* Inspector / Date */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
            <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-slate-500 bg-slate-50 dark:bg-muted/30">
              <Calendar className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">Inspector Info</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1"><User className="w-3 h-3" /> Inspector</label>
                <input type="text" value={inspector} onChange={e => setInspector(e.target.value)} placeholder="Your name"
                  className="h-10 px-3 rounded-lg border border-slate-200 dark:border-input bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-slate-200 dark:border-input bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Checklist Items */}
          {items.map((item, idx) => (
            <div key={item.id} className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
              <div className={`flex items-center gap-3 px-5 py-3 border-l-4 bg-slate-50 dark:bg-muted/30 ${item.result === "Pass" ? "border-emerald-500" : item.result === "Fail" ? "border-red-500" : item.result === "N/A" ? "border-slate-400" : "border-blue-400"}`}>
                <span className="text-xs font-bold text-slate-400 w-5 shrink-0">{idx + 1}</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-foreground">{item.label}</span>
                {item.result === "Pass" && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />}
                {item.result === "Fail" && <XCircle className="w-4 h-4 text-red-500 ml-auto shrink-0" />}
                {item.result === "N/A" && <MinusCircle className="w-4 h-4 text-slate-400 ml-auto shrink-0" />}
              </div>
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  {(["Pass","Fail","N/A"] as CheckResult[]).map(r => (
                    <button key={r} type="button" onClick={() => updateItem(item.id, "result", r)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                        item.result === r
                          ? r === "Pass" ? "bg-emerald-500 border-emerald-500 text-white shadow-md"
                            : r === "Fail" ? "bg-red-500 border-red-500 text-white shadow-md"
                            : "bg-slate-400 border-slate-400 text-white shadow-md"
                          : r === "Pass" ? "border-slate-200 text-slate-500 hover:border-emerald-300"
                            : r === "Fail" ? "border-slate-200 text-slate-500 hover:border-red-300"
                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}>{r}</button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 flex flex-col gap-1">
                    <label className="text-xs text-slate-400 font-semibold uppercase">Comments</label>
                    <input type="text" value={item.comments} onChange={e => updateItem(item.id, "comments", e.target.value)} placeholder="Optional comments"
                      className="h-9 px-3 rounded-lg border border-slate-200 bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400 font-semibold uppercase">Initials</label>
                    <input type="text" value={item.initials} onChange={e => updateItem(item.id, "initials", e.target.value)} placeholder="e.g. JD" maxLength={5}
                      className="h-9 px-3 rounded-lg border border-slate-200 bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button type="submit" disabled={submitting}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4" /> Submit Weekly Ops Checklist</>}
          </button>
        </div>
      </form>
    </div>
  );
}
