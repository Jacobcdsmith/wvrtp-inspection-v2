export type EquipmentType =
  | "Boiler"
  | "HVAC"
  | "Pressure Vessel"
  | "Fire Suppression"
  | "Other";

export interface PhotoAsset {
  filename: string;
  description: string;
}

export interface DocumentAsset {
  filename: string;
  description: string;
  relevantTypes: (EquipmentType | "All")[];
  format: "Excel" | "Word" | "PDF";
}

export const PUBLIC_PHOTOS: PhotoAsset[] = [
  { filename: "IMG_0108.jpg", description: "Facility inspection reference photo 1" },
  { filename: "IMG_0109.jpg", description: "Facility inspection reference photo 2" },
  { filename: "IMG_0110.jpg", description: "Facility inspection reference photo 3" },
  { filename: "IMG_0111.jpg", description: "Facility inspection reference photo 4" },
];

export const PUBLIC_DOCUMENTS: DocumentAsset[] = [
  {
    filename: "Boiler Check Sheet.xls",
    description: "Legacy boiler inspection checklist",
    relevantTypes: ["Boiler"],
    format: "Excel",
  },
  {
    filename: "WWRTP_updated_checklist.xlsx",
    description: "Updated WVRTP facility checklist",
    relevantTypes: ["All"],
    format: "Excel",
  },
  {
    filename: "704 Master  Logsheet.xlsx",
    description: "Master inspection logsheet template",
    relevantTypes: ["All"],
    format: "Excel",
  },
  {
    filename: "Updated Facilities and Ops Substation Oil Checklist.xlsx",
    description: "Substation oil inspection checklist",
    relevantTypes: ["Other"],
    format: "Excel",
  },
  {
    filename: "Weekly Checklist.docx",
    description: "Weekly operations checklist",
    relevantTypes: ["All"],
    format: "Word",
  },
  {
    filename: "Operator Check List.pdf",
    description: "Operator inspection instructions",
    relevantTypes: ["All"],
    format: "PDF",
  },
  {
    filename: "WVRTP-QR-Inspection-System-Design.pdf",
    description: "QR Inspection System technical design",
    relevantTypes: ["All"],
    format: "PDF",
  },
];

/** Absolute URL for a file in the public folder. */
export function assetUrl(filename: string): string {
  return `${window.location.origin}/${encodeURIComponent(filename)}`;
}

/** Documents relevant to a given equipment type (includes "All" docs). */
export function docsForType(type: EquipmentType | ""): DocumentAsset[] {
  if (!type) return PUBLIC_DOCUMENTS;
  return PUBLIC_DOCUMENTS.filter(
    (d) =>
      d.relevantTypes.includes("All") ||
      d.relevantTypes.includes(type as EquipmentType),
  );
}
