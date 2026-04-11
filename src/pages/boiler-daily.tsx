import { useState } from "react";
import { useToast } from "../hooks/use-toast";
import { Flame, Droplets, Gauge, Activity, Zap, Loader2, Send, User, Calendar } from "lucide-react";

type ShiftType = "Day" | "Night" | "";
type OnlineStatus = "Online" | "Offline" | "";
type SoftenerStatus = "Online" | "Regen" | "Offline" | "Bypass" | "";
type BoilerStatus = "Online" | "Offline" | "Standby" | "";

export default function BoilerDailyPage() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [shift, setShift] = useState<ShiftType>("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [inspector, setInspector] = useState("");

  // City Water
  const [cityWaterMeter, setCityWaterMeter] = useState("");
  const [cityWaterMeterWeekly, setCityWaterMeterWeekly] = useState("");

  // Softener
  const [eastSoftener, setEastSoftener] = useState<SoftenerStatus>("");
  const [westSoftener, setWestSoftener] = useState<SoftenerStatus>("");

  // Feed Water Tank
  const [tankLevel, setTankLevel] = useState("");
  const [tankTemp, setTankTemp] = useState("");

  // Pumps
  const [pump1Status, setPump1Status] = useState<OnlineStatus>("");
  const [pump1Psi, setPump1Psi] = useState("");
  const [pump2Status, setPump2Status] = useState<OnlineStatus>("");
  const [pump2Psi, setPump2Psi] = useState("");

  // Boilers
  const [boiler1Status, setBoiler1Status] = useState<BoilerStatus>("");
  const [boiler1Pressure, setBoiler1Pressure] = useState("");
  const [boiler2Status, setBoiler2Status] = useState<BoilerStatus>("");
  const [boiler2Pressure, setBoiler2Pressure] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shift || !date || !inspector) {
      toast({ title: "Missing Fields", description: "Shift, date, and inspector name are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const payload = {
      formType: "boiler-daily",
      shift, date, inspector,
      cityWater: { meter: cityWaterMeter, weeklyMeter: cityWaterMeterWeekly },
      softener: { east: eastSoftener, west: westSoftener },
      feedWaterTank: { level: tankLevel, temp: tankTemp },
      pumps: { pump1: { status: pump1Status, psi: pump1Psi }, pump2: { status: pump2Status, psi: pump2Psi } },
      boilers: { boiler1: { status: boiler1Status, pressure: boiler1Pressure }, boiler2: { status: boiler2Status, pressure: boiler2Pressure } },
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
    toast({ title: "Boiler Daily Submitted", description: `${shift} shift report saved.` });
    setSubmitting(false);
  };

  const numField = (label: string, value: string, setValue: (v: string) => void, unit?: string, hint?: string) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground uppercase tracking-wide">{label}{unit ? ` (${unit})` : ""}</label>
      <input type="number" step="any" value={value} onChange={e => setValue(e.target.value)}
        className="h-10 px-3 rounded-lg border border-slate-200 dark:border-input bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
  );

  const onlineOfflineBtn = (label: string, status: OnlineStatus, setStatus: (v: OnlineStatus) => void) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      <div className="flex gap-2">
        {(["Online","Offline"] as OnlineStatus[]).map(s => (
          <button key={s} type="button" onClick={() => setStatus(s)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
              status === s
                ? s === "Online" ? "bg-emerald-500 border-emerald-500 text-white shadow-md" : "bg-red-500 border-red-500 text-white shadow-md"
                : s === "Online" ? "border-slate-200 text-slate-500 hover:border-emerald-300" : "border-slate-200 text-slate-500 hover:border-red-300"
            }`}>{s}</button>
        ))}
      </div>
    </div>
  );

  const softenerBtn = (label: string, status: SoftenerStatus, setStatus: (v: SoftenerStatus) => void) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      <div className="flex gap-1.5 flex-wrap">
        {([
          { val: "Online", active: "bg-emerald-500 border-emerald-500 text-white", hover: "hover:border-emerald-300" },
          { val: "Regen", active: "bg-amber-500 border-amber-500 text-white", hover: "hover:border-amber-300" },
          { val: "Offline", active: "bg-red-500 border-red-500 text-white", hover: "hover:border-red-300" },
          { val: "Bypass", active: "bg-slate-500 border-slate-500 text-white", hover: "hover:border-slate-400" },
        ] as const).map(({ val, active, hover }) => (
          <button key={val} type="button" onClick={() => setStatus(val)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${status === val ? `${active} shadow-md` : `border-slate-200 text-slate-500 ${hover}`}`}>
            {val}
          </button>
        ))}
      </div>
    </div>
  );

  const boilerStatusBtn = (label: string, status: BoilerStatus, setStatus: (v: BoilerStatus) => void) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      <div className="flex gap-2">
        {([
          { val: "Online", active: "bg-emerald-500 border-emerald-500 text-white", hover: "hover:border-emerald-300" },
          { val: "Offline", active: "bg-red-500 border-red-500 text-white", hover: "hover:border-red-300" },
          { val: "Standby", active: "bg-amber-500 border-amber-500 text-white", hover: "hover:border-amber-300" },
        ] as const).map(({ val, active, hover }) => (
          <button key={val} type="button" onClick={() => setStatus(val)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${status === val ? `${active} shadow-md` : `border-slate-200 text-slate-500 ${hover}`}`}>
            {val}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-5 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Boiler Daily Log</h1>
            <p className="text-sm text-slate-300">Shift operations report</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

          {/* Shift/Date/Inspector */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
            <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-slate-500 bg-slate-50 dark:bg-muted/30">
              <Calendar className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">Report Info</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Shift</label>
                <div className="flex gap-2">
                  {(["Day","Night"] as ShiftType[]).map(s => (
                    <button key={s} type="button" onClick={() => setShift(s)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold border-2 transition-all ${
                        shift === s
                          ? s === "Day" ? "bg-amber-400 border-amber-400 text-white shadow-md" : "bg-indigo-600 border-indigo-600 text-white shadow-md"
                          : s === "Day" ? "border-slate-200 text-slate-500 hover:border-amber-300" : "border-slate-200 text-slate-500 hover:border-indigo-300"
                      }`}>
                      {s === "Day" ? "☀️ Day" : "🌙 Night"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    className="h-10 px-3 rounded-lg border border-slate-200 dark:border-input bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1"><User className="w-3 h-3" /> Inspector</label>
                  <input type="text" value={inspector} onChange={e => setInspector(e.target.value)} placeholder="Your name"
                    className="h-10 px-3 rounded-lg border border-slate-200 dark:border-input bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          </div>

          {/* City Water */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
            <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-blue-500 bg-slate-50 dark:bg-muted/30">
              <Droplets className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">City Water</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {numField("City Water Meter", cityWaterMeter, setCityWaterMeter)}
              {numField("Weekly Reading", cityWaterMeterWeekly, setCityWaterMeterWeekly)}
            </div>
          </div>

          {/* Softener Status */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
            <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-teal-500 bg-slate-50 dark:bg-muted/30">
              <Activity className="w-4 h-4 text-teal-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">Softener Status</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {softenerBtn("East Softener", eastSoftener, setEastSoftener)}
              {softenerBtn("West Softener", westSoftener, setWestSoftener)}
            </div>
          </div>

          {/* Feed Water Tank */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
            <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-sky-500 bg-slate-50 dark:bg-muted/30">
              <Gauge className="w-4 h-4 text-sky-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">Feed Water Tank</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {numField("Tank Level", tankLevel, setTankLevel, "%")}
              {numField("Tank Temperature", tankTemp, setTankTemp, "°F")}
            </div>
          </div>

          {/* Pump Status */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
            <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-indigo-500 bg-slate-50 dark:bg-muted/30">
              <Zap className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">Pump Status</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {onlineOfflineBtn("Pump 1 Status", pump1Status, setPump1Status)}
              {numField("Pump 1 PSI", pump1Psi, setPump1Psi, "PSI")}
              {onlineOfflineBtn("Pump 2 Status", pump2Status, setPump2Status)}
              {numField("Pump 2 PSI", pump2Psi, setPump2Psi, "PSI")}
            </div>
          </div>

          {/* Boiler Status */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
            <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-orange-500 bg-slate-50 dark:bg-muted/30">
              <Flame className="w-4 h-4 text-orange-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">Boiler Status</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {boilerStatusBtn("Boiler 1 Status", boiler1Status, setBoiler1Status)}
              {numField("Boiler 1 Steam Pressure", boiler1Pressure, setBoiler1Pressure, "PSI")}
              {boilerStatusBtn("Boiler 2 Status", boiler2Status, setBoiler2Status)}
              {numField("Boiler 2 Steam Pressure", boiler2Pressure, setBoiler2Pressure, "PSI")}
            </div>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4" /> Submit Boiler Daily Log</>}
          </button>
        </div>
      </form>
    </div>
  );
}
