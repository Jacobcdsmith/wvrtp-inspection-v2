import { useState, useEffect, useCallback } from "react";
import { useToast } from "../hooks/use-toast";
import {
  CheckCircle2, AlertTriangle, XCircle,
  MapPin, Camera, Send, Loader2, Shield,
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
  const [photoFile, setPhotoFile]             = useState<File | null>(null);
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
      "Photo":          photoFile?.name || "",
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
    setNotes(""); setPhotoFile(null);
    setSubmitting(false);
  };

  const currentChecklist = equipmentType ? (workbook.checklists[equipmentType] ?? []) : [];

  return (
    <div className="max-w-lg mx-auto px-4 pb-8">
      <div className="pt-5 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">{workbook.label} Equipment Inspection</h1>
        </div>
        <p className="text-sm text-muted-foreground">Complete all fields and submit your inspection.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Equipment ID */}
        <div className="space-y-2">
          <label htmlFor="equipmentId" className="text-sm font-semibold block">
            Equipment ID <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              id="equipmentId"
              value={equipmentId}
              onChange={(e) => { setEquipmentId(e.target.value); setIsFromQr(false); }}
              placeholder="e.g. BLR-001"
              className="w-full h-12 px-3 pr-28 rounded-lg border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
            {isFromQr && equipmentId && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-600 text-white text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> QR Scanned
              </span>
            )}
          </div>
        </div>

        {/* Equipment Type */}
        <div className="space-y-2">
          <label htmlFor="equipmentType" className="text-sm font-semibold block">
            Equipment Type <span className="text-destructive">*</span>
          </label>
          <select
            id="equipmentType"
            value={equipmentType}
            onChange={(e) => setEquipmentType(e.target.value)}
            className="w-full h-12 px-3 rounded-lg border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring"
            required
          >
            <option value="">Select type...</option>
            {workbook.equipmentTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Inspector Name */}
        <div className="space-y-2">
          <label htmlFor="inspectorName" className="text-sm font-semibold block">
            Inspector Name <span className="text-destructive">*</span>
          </label>
          <input
            id="inspectorName"
            value={inspectorName}
            onChange={(e) => setInspectorName(e.target.value)}
            placeholder="Your name"
            className="w-full h-12 px-3 rounded-lg border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        {/* Dynamic Checklist */}
        {equipmentType && currentChecklist.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{equipmentType} Checklist</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              {currentChecklist.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label htmlFor={field.key} className="text-sm font-medium block">
                    {field.label}{field.unit && <span className="text-muted-foreground ml-1">({field.unit})</span>}
                  </label>
                  {field.type === "number" ? (
                    <input
                      id={field.key}
                      type="number" step="any"
                      value={checklistValues[field.key] || ""}
                      onChange={(e) => updateChecklist(field.key, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      className="w-full h-11 px-3 rounded-lg border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  ) : (
                    <select
                      id={field.key}
                      value={checklistValues[field.key] || ""}
                      onChange={(e) => updateChecklist(field.key, e.target.value)}
                      className="w-full h-11 px-3 rounded-lg border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring"
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
        <div className="space-y-2">
          <label className="text-sm font-semibold block">
            Overall Result <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(["Pass", "Attention", "Fail"] as OverallResult[]).map((r) => (
              <button
                key={r} type="button"
                onClick={() => setOverallResult(r)}
                className={`flex flex-col items-center justify-center gap-1.5 py-4 px-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                  overallResult === r
                    ? r === "Pass" ? "border-emerald-600 bg-emerald-600 text-white shadow-md"
                    : r === "Attention" ? "border-amber-500 bg-amber-500 text-white shadow-md"
                    : "border-red-600 bg-red-600 text-white shadow-md"
                    : r === "Pass" ? "border-border bg-card text-emerald-700 hover:border-emerald-400"
                    : r === "Attention" ? "border-border bg-card text-amber-600 hover:border-amber-300"
                    : "border-border bg-card text-red-600 hover:border-red-300"
                }`}
              >
                {r === "Pass" && <CheckCircle2 className="w-7 h-7" />}
                {r === "Attention" && <AlertTriangle className="w-7 h-7" />}
                {r === "Fail" && <XCircle className="w-7 h-7" />}
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label htmlFor="notes" className="text-sm font-semibold block">
            Notes {equipmentType === "Other" && <span className="text-destructive">*</span>}
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional observations, concerns, or follow-up items..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Photo */}
        <div className="space-y-2">
          <label htmlFor="photo" className="text-sm font-semibold block">Photo</label>
          <label
            htmlFor="photo"
            className="flex items-center justify-center gap-2 h-12 rounded-lg border-2 border-dashed border-border bg-card hover:border-primary/40 cursor-pointer transition-colors text-sm font-medium text-muted-foreground"
          >
            <Camera className="w-4 h-4" />
            {photoFile ? photoFile.name : "Tap to capture or upload photo"}
          </label>
          <input id="photo" type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
        </div>

        {/* GPS */}
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Location
          </label>
          <div className="bg-card border border-border rounded-lg p-3 space-y-1">
            {gpsStatus === "loading" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Acquiring GPS...
              </div>
            )}
            {gpsStatus === "error" && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertTriangle className="w-3.5 h-3.5" /> GPS unavailable — submission still allowed
              </div>
            )}
            {gpsStatus === "success" && (
              <>
                <div className="text-xs text-muted-foreground font-mono">{latitude}, {longitude}</div>
                {address && <div className="text-sm text-foreground">{address}</div>}
              </>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-14 rounded-lg bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50"
        >
          {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : <><Send className="w-5 h-5" /> Submit Inspection</>}
        </button>
      </form>
    </div>
  );
}
