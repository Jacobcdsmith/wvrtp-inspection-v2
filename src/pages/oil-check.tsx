import { useState } from "react";
import { useToast } from "../hooks/use-toast";
import { Droplet, AlertTriangle, Info, Loader2, Send, User, Clock } from "lucide-react";

type OilLevel = "Normal" | "Low" | "High" | "";
type LeakDetected = "No" | "Yes" | "";

const EQUIPMENT_LIST = [
  "SUB-51 2.4KV", "SUB-51 480V", "SUB-52 2.4KV", "SUB-52 480V South",
  "SUB-52 480V Center", "SUB-53 480V N", "SUB-53 480V W", "SUB-53 480V E",
  "SUB-55 480V Spare", "SUB-55 480V W", "SUB-55 480V Center", "SUB-55 480V Semi-Works",
  "SUB-56 480V E", "SUB-56 480V W", "Cinergy 2.4KV", "Transformer 729",
  "Transformer 740", "South Chiller", "North Chiller", "770 HVAC", "2000 ATC",
];

export default function OilCheckPage() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [equipment, setEquipment] = useState("");
  const [oilLevel, setOilLevel] = useState<OilLevel>("");
  const [oilLeak, setOilLeak] = useState<LeakDetected>("");
  const [initials, setInitials] = useState("");
  const now = new Date();
  const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const [checkDateTime, setCheckDateTime] = useState(localIso);
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipment || !oilLevel || !oilLeak || !initials) {
      toast({ title: "Missing Fields", description: "Equipment, oil level, leak status, and initials are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const payload = {
      formType: "oil-check",
      equipment, oilLevel, oilLeak, initials, checkDateTime, notes,
      submittedAt: new Date().toISOString(),
    };
    const webhookUrl = (import.meta.env as Record<string, string | undefined>)["VITE_WEBHOOK_URL"];
    if (!webhookUrl) {
      toast({ title: "Submit Failed", description: "Webhook is not configured. This check could not be saved.", variant: "destructive" });
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
    toast({ title: "Oil Check Submitted", description: `${equipment} check recorded.` });
    setOilLevel(""); setOilLeak(""); setNotes("");
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-5 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <Droplet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Oil Check</h1>
            <p className="text-sm text-slate-300">Substation &amp; transformer oil inspection</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

          {/* Equipment Selection */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
            <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-slate-500 bg-slate-50 dark:bg-muted/30">
              <Info className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">Equipment</h2>
            </div>
            <div className="p-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Select Equipment</label>
                <select value={equipment} onChange={e => setEquipment(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-slate-200 dark:border-input bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Choose equipment...</option>
                  {EQUIPMENT_LIST.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Oil Level */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
            <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-blue-500 bg-slate-50 dark:bg-muted/30">
              <Droplet className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">Oil Level</h2>
            </div>
            <div className="p-5">
              <div className="flex gap-3">
                {([
                  { val: "Normal", active: "bg-emerald-500 border-emerald-500 text-white shadow-md", hover: "hover:border-emerald-300" },
                  { val: "Low", active: "bg-red-500 border-red-500 text-white shadow-md", hover: "hover:border-red-300" },
                  { val: "High", active: "bg-amber-500 border-amber-500 text-white shadow-md", hover: "hover:border-amber-300" },
                ] as const).map(({ val, active, hover }) => (
                  <button key={val} type="button" onClick={() => setOilLevel(val)}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold border-2 transition-all ${oilLevel === val ? active : `border-slate-200 text-slate-500 ${hover}`}`}>
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Oil Leak */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
            <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-red-500 bg-slate-50 dark:bg-muted/30">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">Oil Leak Detected</h2>
            </div>
            <div className="p-5">
              <div className="flex gap-3">
                {([
                  { val: "No", active: "bg-emerald-500 border-emerald-500 text-white shadow-md", hover: "hover:border-emerald-300" },
                  { val: "Yes", active: "bg-red-500 border-red-500 text-white shadow-md", hover: "hover:border-red-300" },
                ] as const).map(({ val, active, hover }) => (
                  <button key={val} type="button" onClick={() => setOilLeak(val)}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold border-2 transition-all ${oilLeak === val ? active : `border-slate-200 text-slate-500 ${hover}`}`}>
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Status Summary */}
          {(equipment || oilLevel || oilLeak) && (
            <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
              <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-violet-500 bg-slate-50 dark:bg-muted/30">
                <Info className="w-4 h-4 text-violet-500" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">Status Summary</h2>
              </div>
              <div className="p-5 flex flex-wrap gap-2">
                {equipment && <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">{equipment}</span>}
                {oilLevel && <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${oilLevel === "Normal" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : oilLevel === "Low" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>Oil: {oilLevel}</span>}
                {oilLeak && <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${oilLeak === "No" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>Leak: {oilLeak}</span>}
              </div>
            </div>
          )}

          {/* Inspector / DateTime / Notes */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
            <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-slate-400 bg-slate-50 dark:bg-muted/30">
              <User className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">Inspector Details</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Initials</label>
                <input type="text" value={initials} onChange={e => setInitials(e.target.value)} placeholder="e.g. JD" maxLength={5}
                  className="h-10 px-3 rounded-lg border border-slate-200 dark:border-input bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1"><Clock className="w-3 h-3" /> Date &amp; Time</label>
                <input type="datetime-local" value={checkDateTime} onChange={e => setCheckDateTime(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-slate-200 dark:border-input bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Additional observations..."
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-input bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4" /> Submit Oil Check</>}
          </button>
        </div>
      </form>
    </div>
  );
}
