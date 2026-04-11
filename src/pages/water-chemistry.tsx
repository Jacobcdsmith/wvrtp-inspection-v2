import { useState } from "react";
import { useToast } from "../hooks/use-toast";
import { Droplets, Beaker, FlaskConical, Package, Loader2, Send, User, Calendar } from "lucide-react";

type ShiftNum = "1" | "2" | "3" | "";
type ChemStatus = "OK" | "Low" | "Order" | "";

export default function WaterChemistryPage() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Header fields
  const [shift, setShift] = useState<ShiftNum>("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [inspector, setInspector] = useState("");

  // Feedwater
  const [fwPh, setFwPh] = useState("");
  const [fwConductivity, setFwConductivity] = useState("");
  const [fwIronSulfite, setFwIronSulfite] = useState("");
  const [fwHardness, setFwHardness] = useState("");

  // Boiler 1
  const [b1Ph, setB1Ph] = useState("");
  const [b1Conductivity, setB1Conductivity] = useState("");
  const [b1PAlkalinity, setB1PAlkalinity] = useState("");
  const [b1MAlkalinity, setB1MAlkalinity] = useState("");
  const [b1Sulfite, setB1Sulfite] = useState("");

  // Boiler 2
  const [b2Ph, setB2Ph] = useState("");
  const [b2Conductivity, setB2Conductivity] = useState("");
  const [b2PAlkalinity, setB2PAlkalinity] = useState("");
  const [b2MAlkalinity, setB2MAlkalinity] = useState("");
  const [b2Sulfite, setB2Sulfite] = useState("");

  // Chemical Inventory
  const [optisperse, setOptisperse] = useState<ChemStatus>("");
  const [steamate, setSteamate] = useState<ChemStatus>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shift || !date || !inspector) {
      toast({ title: "Missing Fields", description: "Shift, date, and inspector name are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const payload = {
      formType: "water-chemistry",
      shift, date, inspector,
      feedwater: { ph: fwPh, conductivity: fwConductivity, ironSulfite: fwIronSulfite, hardness: fwHardness },
      boiler1: { ph: b1Ph, conductivity: b1Conductivity, pAlkalinity: b1PAlkalinity, mAlkalinity: b1MAlkalinity, sulfite: b1Sulfite },
      boiler2: { ph: b2Ph, conductivity: b2Conductivity, pAlkalinity: b2PAlkalinity, mAlkalinity: b2MAlkalinity, sulfite: b2Sulfite },
      inventory: { optisperse, steamate },
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
    toast({ title: "Water Chemistry Submitted", description: `Shift ${shift} report saved.` });
    setSubmitting(false);
  };

  const shiftColors: Record<string, string> = {
    "1": "bg-blue-500 border-blue-500 text-white shadow-md",
    "2": "bg-green-500 border-green-500 text-white shadow-md",
    "3": "bg-purple-500 border-purple-500 text-white shadow-md",
  };
  const shiftInactive: Record<string, string> = {
    "1": "border-slate-200 text-slate-500 hover:border-blue-300",
    "2": "border-slate-200 text-slate-500 hover:border-green-300",
    "3": "border-slate-200 text-slate-500 hover:border-purple-300",
  };

  const inventoryOptions: ChemStatus[] = ["OK", "Low", "Order"];
  const inventoryColors: Record<string, string> = {
    OK: "bg-emerald-500 border-emerald-500 text-white shadow-md",
    Low: "bg-amber-500 border-amber-500 text-white shadow-md",
    Order: "bg-red-500 border-red-500 text-white shadow-md",
  };
  const inventoryInactive: Record<string, string> = {
    OK: "border-slate-200 text-slate-500 hover:border-emerald-300",
    Low: "border-slate-200 text-slate-500 hover:border-amber-300",
    Order: "border-slate-200 text-slate-500 hover:border-red-300",
  };

  const numField = (label: string, value: string, setValue: (v: string) => void, hint?: string) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground uppercase tracking-wide">{label}</label>
      <input type="number" step="any" value={value} onChange={e => setValue(e.target.value)}
        className="h-10 px-3 rounded-lg border border-slate-200 dark:border-input bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-5 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <Droplets className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Water Chemistry</h1>
            <p className="text-sm text-slate-300">Boiler feedwater & chemical inventory log</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

          {/* Shift / Date / Inspector */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
            <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-slate-500 bg-slate-50 dark:bg-muted/30">
              <Calendar className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">Report Info</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Shift</label>
                <div className="flex gap-2">
                  {(["1","2","3"] as ShiftNum[]).map(s => (
                    <button key={s} type="button" onClick={() => setShift(s)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold border-2 transition-all ${shift === s ? shiftColors[s] : shiftInactive[s]}`}>
                      Shift {s}
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

          {/* Feedwater Analysis */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
            <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-cyan-500 bg-slate-50 dark:bg-muted/30">
              <Beaker className="w-4 h-4 text-cyan-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">Feedwater Analysis</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {numField("pH", fwPh, setFwPh, "Range: 8.5 – 9.5")}
              {numField("Conductivity", fwConductivity, setFwConductivity, "Record value")}
              {numField("Iron / Sulfite (ppm)", fwIronSulfite, setFwIronSulfite, "< 0.1 ppm")}
              {numField("Hardness (ppm)", fwHardness, setFwHardness, "< 0.1 ppm")}
            </div>
          </div>

          {/* Boiler #1 */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
            <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-orange-500 bg-slate-50 dark:bg-muted/30">
              <FlaskConical className="w-4 h-4 text-orange-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">Boiler #1</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {numField("pH", b1Ph, setB1Ph, "Range: 10.0 – 12.0")}
              {numField("Conductivity", b1Conductivity, setB1Conductivity, "Range: 3500 – 4000")}
              {numField("P-Alkalinity", b1PAlkalinity, setB1PAlkalinity)}
              {numField("M-Alkalinity (ppm)", b1MAlkalinity, setB1MAlkalinity, "Range: 300 – 600 ppm")}
              {numField("Sulfite (ppm)", b1Sulfite, setB1Sulfite, "Range: 15 – 35 ppm")}
            </div>
          </div>

          {/* Boiler #2 */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
            <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-red-500 bg-slate-50 dark:bg-muted/30">
              <FlaskConical className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">Boiler #2</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {numField("pH", b2Ph, setB2Ph, "Range: 10.0 – 12.0")}
              {numField("Conductivity", b2Conductivity, setB2Conductivity, "Range: 3500 – 4000")}
              {numField("P-Alkalinity", b2PAlkalinity, setB2PAlkalinity)}
              {numField("M-Alkalinity (ppm)", b2MAlkalinity, setB2MAlkalinity, "Range: 300 – 600 ppm")}
              {numField("Sulfite (ppm)", b2Sulfite, setB2Sulfite, "Range: 15 – 35 ppm")}
            </div>
          </div>

          {/* Chemical Inventory */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
            <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-green-500 bg-slate-50 dark:bg-muted/30">
              <Package className="w-4 h-4 text-green-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">Chemical Inventory</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(["optisperse","steamate"] as const).map(chem => {
                const val = chem === "optisperse" ? optisperse : steamate;
                const setVal = chem === "optisperse" ? setOptisperse : setSteamate;
                return (
                  <div key={chem} className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{chem === "optisperse" ? "Optisperse" : "Steamate"}</label>
                    <div className="flex gap-2">
                      {inventoryOptions.map(opt => (
                        <button key={opt} type="button" onClick={() => setVal(opt as ChemStatus)}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${val === opt ? inventoryColors[opt] : inventoryInactive[opt]}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={submitting}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4" /> Submit Water Chemistry Report</>}
          </button>

        </div>
      </form>
    </div>
  );
}
