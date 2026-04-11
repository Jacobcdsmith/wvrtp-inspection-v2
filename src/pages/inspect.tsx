import { useState, useEffect, useCallback } from "react";
import { useToast } from "../hooks/use-toast";
import {
  CheckCircle2, AlertTriangle, XCircle,
  MapPin, Send, Loader2, Shield, ClipboardCheck, User,
} from "lucide-react";
import type { WorkbookConfig } from "../lib/workbooks";

type OverallResult = "Pass" | "Attention" | "Fail";

interface Props {
  workbook: WorkbookConfig;
}

function getUrlParam(key: string): string {
  const params = new URLSearchParams(window.location.search);
  const val = params.get(key);
  if (val) return val;
  const hash = window.location.hash;
  if (hash.includes("?")) {
    const hashParams = new URLSearchParams(hash.split("?")[1]);
    return hashParams.get(key) || "";
  }
  return "";
}

const HISTORY_KEY = "wvrtp_inspections";

function saveToHistory(record: Record<string, unknown>) {
  try {
    const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    existing.unshift(record);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(existing.slice(0, 200)));
  } catch {
    // silently fail — history is convenience only
  }
}

export default function InspectPage({ workbook }: Props) {
  const { toast } = useToast();
  const [equipmentId, setEquipmentId]         = useState(getUrlParam("id"));
  const [isFromQr, setIsFromQr]               = useState(!!getUrlParam("id"));
  const [equipmentType, setEquipmentType]     = useState("");
  const [inspectorName, setInspectorName]     = useState("");
  const [checklistValues, setChecklistValues] = useState<Record<string, string>>({});
  const [overallResult, setOverallResult]     = useState<OverallResult | "">("");
  const [notes, setNotes]                     = useState("");
  const [latitude, setLatitude]               = useState("");
  const [longitude, setLongitude]             = useState("");
  const [address, setAddress]                 = useState("");
  const [gpsStatus, setGpsStatus]             = useState<"loading"|"success"|"error">("loading");
  const [submitting, setSubmitting]           = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) { setGpsStatus("error"); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toString();
        const lng = pos.coords.longitude.toString();
        setLatitude(lat); setLongitude(lng); setGpsStatus("success");
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { "User-Agent": "WVRTPInspectionApp/1.0" } }
          );
          const d = await r.json();
          if (d.display_name) setAddress(d.display_name);
        } catch { /* address is optional */ }
      },
      () => setGpsStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => { setChecklistValues({}); }, [equipmentType]);

  const updateChecklist = useCallback((key: string, value: string) => {
    setChecklistValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentId || !equipmentType || !inspectorName || !overallResult) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    if (equipmentType === "Other" && !notes.trim()) {
      toast({ title: "Notes Required", description: "Notes are required for 'Other' equipment type.", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    const flatPayload: Record<string, string> = {
      "ID":             equipmentId,
      "Equipment Type": equipmentType,
      "Inspector":      inspectorName,
      "Result":         overallResult,
      "Date":           new Date().toISOString(),
      "Latitude":       latitude || "",
      "Longitude":      longitude || "",
      "Address":        address || "",
      "Notes":          notes || "",
      "Workbook":       workbook.id,
      ...checklistValues,
    };

    // Save to local history regardless of webhook outcome
    saveToHistory(flatPayload);

    // Fire webhook if configured
    const webhookUrl = (import.meta.env as Record<string, string | undefined>)[workbook.webhookEnvVar];
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(flatPayload),
        });
      } catch {
        toast({
          title: "Webhook Warning",
          description: "Inspection saved locally. Webhook delivery failed — will not retry.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
    }

    toast({ title: "Inspection Submitted", description: "Record saved successfully." });

    // Reset form
    setEquipmentId(""); setIsFromQr(false); setEquipmentType("");
    setInspectorName(""); setChecklistValues({}); setOverallResult("");
    setNotes("");
    setSubmitting(false);
  };

  const currentChecklist = equipmentType ? (workbook.checklists[equipmentType] ?? []) : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-5 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{workbook.label} Equipment Inspection</h1>
            <p className="text-sm text-slate-300">Record inspection results for a single piece of equipment.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

          {/* Equipment ID & Inspector */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
            <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-blue-500 bg-slate-50 dark:bg-muted/30">
              <Shield className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">Equipment Info</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="equipmentId" className="text-xs font-semibold text-slate-500 dark:text-muted-foreground uppercase tracking-wide">
                  Equipment ID <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    id="equipmentId"
                    value={equipmentId}
                    onChange={(e) => { setEquipmentId(e.target.value); setIsFromQr(false); }}
                    placeholder="e.g. BLR-001"
                    className="w-full h-10 px-3 pr-28 rounded-lg border border-slate-200 dark:border-input bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  {isFromQr && equipmentId && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-600 text-white text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> QR Scanned
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="inspectorName" className="text-xs font-semibold text-slate-500 dark:text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <User className="w-3 h-3" /> Inspector Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="inspectorName"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  placeholder="Your name"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-input bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label htmlFor="equipmentType" className="text-xs font-semibold text-slate-500 dark:text-muted-foreground uppercase tracking-wide">
                  Equipment Type <span className="text-destructive">*</span>
                </label>
                <select
                  id="equipmentType"
                  value={equipmentType}
                  onChange={(e) => setEquipmentType(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-input bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select type...</option>
                  {workbook.equipmentTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Dynamic Checklist */}
          {equipmentType && currentChecklist.length > 0 && (
            <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
              <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-indigo-500 bg-slate-50 dark:bg-muted/30">
                <ClipboardCheck className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">{equipmentType} Checklist</h2>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentChecklist.map((field) => (
                  <div key={field.key} className="flex flex-col gap-1.5">
                    <label htmlFor={field.key} className="text-xs font-semibold text-slate-500 dark:text-muted-foreground uppercase tracking-wide">
                      {field.label}{field.unit && <span className="text-slate-400 ml-1 normal-case">({field.unit})</span>}
                    </label>
                    {field.type === "number" ? (
                      <input
                        id={field.key}
                        type="number" step="any"
                        value={checklistValues[field.key] || ""}
                        onChange={(e) => updateChecklist(field.key, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        className="h-10 px-3 rounded-lg border border-slate-200 dark:border-input bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <select
                        id={field.key}
                        value={checklistValues[field.key] || ""}
                        onChange={(e) => updateChecklist(field.key, e.target.value)}
                        className="h-10 px-3 rounded-lg border border-slate-200 dark:border-input bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select...</option>
                        {field.options?.map((opt) => <option key={opt}>{opt}</option>)}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overall Result */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
            <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-slate-500 bg-slate-50 dark:bg-muted/30">
              <Shield className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">Overall Result <span className="text-destructive">*</span></h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(["Pass", "Attention", "Fail"] as OverallResult[]).map((r) => (
                  <button
                    key={r} type="button"
                    onClick={() => setOverallResult(r)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl border-2 font-semibold text-sm transition-all ${
                      overallResult === r
                        ? r === "Pass" ? "bg-emerald-500 border-emerald-500 text-white shadow-md"
                        : r === "Attention" ? "bg-amber-500 border-amber-500 text-white shadow-md"
                        : "bg-red-500 border-red-500 text-white shadow-md"
                        : r === "Pass" ? "border-slate-200 text-emerald-600 hover:border-emerald-300"
                        : r === "Attention" ? "border-slate-200 text-amber-600 hover:border-amber-300"
                        : "border-slate-200 text-red-600 hover:border-red-300"
                    }`}
                  >
                    {r === "Pass" && <CheckCircle2 className="w-6 h-6" />}
                    {r === "Attention" && <AlertTriangle className="w-6 h-6" />}
                    {r === "Fail" && <XCircle className="w-6 h-6" />}
                    {r}
                  </button>
                ))}
              </div>
              {overallResult && (
                <p className={`text-xs mt-3 ${
                  overallResult === "Pass" ? "text-emerald-700 dark:text-emerald-400"
                  : overallResult === "Attention" ? "text-amber-600 dark:text-amber-400"
                  : "text-red-600 dark:text-red-400"
                }`}>
                  {overallResult === "Pass" && "No follow-up required."}
                  {overallResult === "Attention" && "Creates a follow-up item."}
                  {overallResult === "Fail" && "Equipment must be tagged out of service."}
                </p>
              )}
            </div>
          </div>

          {/* Notes & Location */}
          <div className="bg-white dark:bg-card rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-border">
            <div className="flex items-center gap-3 px-5 py-3 border-l-4 border-slate-400 bg-slate-50 dark:bg-muted/30">
              <MapPin className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">Notes &amp; Location</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="notes" className="text-xs font-semibold text-slate-500 dark:text-muted-foreground uppercase tracking-wide">
                  Notes {equipmentType === "Other" && <span className="text-destructive">*</span>}
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes or follow-up items..."
                  rows={3}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-input bg-white dark:bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Location <span className="font-normal normal-case text-slate-400">(auto-detected)</span>
                </label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-slate-200 dark:border-input bg-slate-50 dark:bg-muted/20 text-sm">
                  {gpsStatus === "loading" && (
                    <>
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />
                      <span className="text-slate-400">Acquiring GPS...</span>
                    </>
                  )}
                  {gpsStatus === "error" && (
                    <>
                      <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-slate-400">Unavailable</span>
                    </>
                  )}
                  {gpsStatus === "success" && (
                    <>
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-mono text-xs truncate">{latitude}, {longitude}</span>
                    </>
                  )}
                </div>
                {gpsStatus === "error" && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" /> GPS unavailable. You can still submit.
                  </p>
                )}
                {gpsStatus === "success" && address && (
                  <p className="text-xs text-slate-400 truncate">{address}</p>
                )}
              </div>
            </div>
          </div>

          {gpsStatus === "loading" && (
            <p className="text-xs text-slate-400 text-center">Waiting for GPS… you may submit without location.</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4" /> Submit Inspection</>}
          </button>

        </div>
      </form>
    </div>
  );
}
