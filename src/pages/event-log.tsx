import { useState } from "react";
import { useToast } from "../hooks/use-toast";
import { Bolt, Loader2, Send, User, Clock, FileText } from "lucide-react";

type EventCode = "CH" | "SH" | "SD" | "ST" | "";

const FEEDER_LIST = [
  "Feeder 1","Feeder 2","Feeder 3","Feeder 4","Feeder 5",
  "Feeder 6","Feeder 7","Feeder 8","Feeder 9","Feeder 10",
  "Bus 1","Bus 2","Bus 3",
];

const EVENT_CODES = [
  { code: "CH" as EventCode, label: "Connect High", active: "bg-blue-500 border-blue-500 text-white shadow-md", hover: "hover:border-blue-300" },
  { code: "SH" as EventCode, label: "Switch High",  active: "bg-amber-500 border-amber-500 text-white shadow-md", hover: "hover:border-amber-300" },
  { code: "SD" as EventCode, label: "Switch Down",  active: "bg-emerald-500 border-emerald-500 text-white shadow-md", hover: "hover:border-emerald-300" },
  { code: "ST" as EventCode, label: "Switch Trip",  active: "bg-red-500 border-red-500 text-white shadow-md", hover: "hover:border-red-300" },
];

export default function EventLogPage() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [feederID, setFeederID] = useState("");
  const [equipmentID, setEquipmentID] = useState("");
  const [eventCode, setEventCode] = useState<EventCode>("");
  const [description, setDescription] = useState("");
  const [operator, setOperator] = useState("");
  const now = new Date();
  const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const [timestamp, setTimestamp] = useState(localIso);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feederID || !eventCode || !operator) {
      toast({ title: "Missing Fields", description: "Feeder ID, event code, and operator are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const payload = {
      formType: "event-log",
      feederID, equipmentID, eventCode,
      eventLabel: EVENT_CODES.find(ec => ec.code === eventCode)?.label ?? "",
      description, operator, timestamp,
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
    toast({ title: "Event Logged", description: `${eventCode} — ${feederID}` });
    setEventCode(""); setDescription(""); setEquipmentID("");
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-5 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <Bolt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Equipment Event Log</h1>
            <p className="text-sm text-slate-300">Record switching events and equipment changes</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

          {/* Feeder / Equipment */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
            <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-slate-500 bg-slate-50 dark:bg-muted/30">
              <FileText className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">Equipment Details</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Feeder ID</label>
                <select value={feederID} onChange={e => setFeederID(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-slate-200 dark:border-input bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select feeder...</option>
                  {FEEDER_LIST.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Equipment ID</label>
                <input type="text" value={equipmentID} onChange={e => setEquipmentID(e.target.value)} placeholder="e.g. BKR-12A"
                  className="h-10 px-3 rounded-lg border border-slate-200 dark:border-input bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Event Code */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
            <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-purple-500 bg-slate-50 dark:bg-muted/30">
              <Bolt className="w-4 h-4 text-purple-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">Event Code</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3">
                {EVENT_CODES.map(({ code, label, active, hover }) => (
                  <button key={code} type="button" onClick={() => setEventCode(code)}
                    className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all ${eventCode === code ? active : `border-slate-200 text-slate-600 ${hover}`}`}>
                    <span className="text-2xl font-black">{code}</span>
                    <span className="text-xs mt-1 font-medium opacity-80">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
            <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-slate-400 bg-slate-50 dark:bg-muted/30">
              <FileText className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">Event Details</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe the event..."
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-input bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1"><User className="w-3 h-3" /> Operator</label>
                  <input type="text" value={operator} onChange={e => setOperator(e.target.value)} placeholder="Operator name"
                    className="h-10 px-3 rounded-lg border border-slate-200 dark:border-input bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1"><Clock className="w-3 h-3" /> Timestamp</label>
                  <input type="datetime-local" value={timestamp} onChange={e => setTimestamp(e.target.value)}
                    className="h-10 px-3 rounded-lg border border-slate-200 dark:border-input bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4" /> Log Event</>}
          </button>
        </div>
      </form>
    </div>
  );
}
