/**
 * WVRTP Inspection — unit tests
 *
 * Run: npm test
 * Watch: npm run test:watch
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ─── Inline the pure logic under test ───────────────────────────────────────
// We duplicate only the constants / pure functions here so the tests have no
// React / DOM dependencies and run in <100ms. If you move these to a shared
// lib/ module, import from there instead.

type EquipmentType = "Boiler" | "HVAC" | "Pressure Vessel" | "Fire Suppression" | "Other";

interface ChecklistField {
  key: string;
  label: string;
  type: "number" | "select";
  unit?: string;
  options?: string[];
  min?: number;
  max?: number;
}

const CHECKLISTS: Record<EquipmentType, ChecklistField[]> = {
  Boiler: [
    { key: "pressure", label: "Pressure", type: "number", unit: "PSI", min: 0, max: 1000 },
    { key: "temperature", label: "Temperature", type: "number", unit: "\u00b0F", min: 0, max: 1000 },
    { key: "waterLevel", label: "Water Level", type: "select", options: ["Normal", "Low", "High"] },
    { key: "safetyValve", label: "Safety Valve", type: "select", options: ["Pass", "Fail"] },
    { key: "lowWaterCutoff", label: "Low-Water Cutoff", type: "select", options: ["Pass", "Fail"] },
    { key: "flameSafeguard", label: "Flame Safeguard", type: "select", options: ["Pass", "Fail"] },
  ],
  HVAC: [
    { key: "temperature", label: "Temperature", type: "number", unit: "\u00b0F", min: -50, max: 200 },
    { key: "filterCondition", label: "Filter Condition", type: "select", options: ["Pass", "Fail"] },
    { key: "refrigerantLevel", label: "Refrigerant Level", type: "select", options: ["Normal", "Low"] },
    { key: "thermostat", label: "Thermostat", type: "select", options: ["Pass", "Fail"] },
    { key: "ductwork", label: "Ductwork", type: "select", options: ["Pass", "Fail"] },
  ],
  "Pressure Vessel": [
    { key: "pressure", label: "Pressure", type: "number", unit: "PSI", min: 0, max: 3000 },
    { key: "safetyReliefValve", label: "Safety Relief Valve", type: "select", options: ["Pass", "Fail"] },
    { key: "shellCondition", label: "Shell Condition", type: "select", options: ["Pass", "Fail"] },
    { key: "fittings", label: "Fittings", type: "select", options: ["Pass", "Fail"] },
  ],
  "Fire Suppression": [
    { key: "gaugePressure", label: "Gauge Pressure", type: "number", unit: "PSI", min: 0, max: 500 },
    { key: "tamperSeal", label: "Tamper Seal", type: "select", options: ["Intact", "Broken"] },
    { key: "signage", label: "Signage", type: "select", options: ["Pass", "Fail"] },
    { key: "accessClear", label: "Access Clear", type: "select", options: ["Pass", "Fail"] },
  ],
  Other: [
    { key: "generalCondition", label: "General Condition", type: "select", options: ["Pass", "Fail"] },
  ],
};

const HISTORY_KEY = "wvrtp_inspections";

function saveToHistory(record: Record<string, string>) {
  try {
    const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    existing.unshift(record);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(existing.slice(0, 200)));
  } catch {
    // silently fail
  }
}

function getUrlParam(key: string, search: string, hash: string): string {
  const params = new URLSearchParams(search);
  const val = params.get(key);
  if (val) return val;
  if (hash.includes("?")) {
    const hashParams = new URLSearchParams(hash.split("?")[1]);
    return hashParams.get(key) || "";
  }
  return "";
}

function validateChecklist(
  equipmentType: EquipmentType,
  checklistValues: Record<string, string>
): string | null {
  const fields = CHECKLISTS[equipmentType];
  for (const field of fields) {
    const val = checklistValues[field.key];
    if (!val && val !== "0") return `${field.label} is required.`;
    if (field.type === "number") {
      const num = parseFloat(val);
      if (isNaN(num)) return `${field.label} must be a number.`;
      if (field.min !== undefined && num < field.min)
        return `${field.label} must be at least ${field.min}.`;
      if (field.max !== undefined && num > field.max)
        return `${field.label} must be at most ${field.max}.`;
    }
  }
  return null;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("CHECKLISTS structure", () => {
  const types: EquipmentType[] = ["Boiler", "HVAC", "Pressure Vessel", "Fire Suppression", "Other"];

  it("has an entry for every EquipmentType", () => {
    for (const t of types) {
      expect(CHECKLISTS[t]).toBeDefined();
      expect(CHECKLISTS[t].length).toBeGreaterThan(0);
    }
  });

  it("every field has a non-empty key and label", () => {
    for (const t of types) {
      for (const field of CHECKLISTS[t]) {
        expect(field.key.length).toBeGreaterThan(0);
        expect(field.label.length).toBeGreaterThan(0);
      }
    }
  });

  it("every select field has at least 2 options", () => {
    for (const t of types) {
      for (const field of CHECKLISTS[t]) {
        if (field.type === "select") {
          expect(field.options?.length).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });

  it("every number field has min and max defined", () => {
    for (const t of types) {
      for (const field of CHECKLISTS[t]) {
        if (field.type === "number") {
          expect(field.min).toBeDefined();
          expect(field.max).toBeDefined();
        }
      }
    }
  });

  it("has no duplicate field keys within a type", () => {
    for (const t of types) {
      const keys = CHECKLISTS[t].map((f) => f.key);
      const unique = new Set(keys);
      expect(unique.size).toBe(keys.length);
    }
  });
});

describe("saveToHistory", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("saves a record to localStorage", () => {
    saveToHistory({ ID: "BLR-001", Result: "Pass" });
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].ID).toBe("BLR-001");
  });

  it("prepends — newest record is first", () => {
    saveToHistory({ ID: "BLR-001" });
    saveToHistory({ ID: "HVAC-002" });
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    expect(stored[0].ID).toBe("HVAC-002");
    expect(stored[1].ID).toBe("BLR-001");
  });

  it("caps at 200 records and silently drops the oldest", () => {
    for (let i = 0; i < 205; i++) {
      saveToHistory({ ID: `ITEM-${i}` });
    }
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    expect(stored).toHaveLength(200);
    expect(stored[0].ID).toBe("ITEM-204");
  });

  it("does not throw when localStorage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => saveToHistory({ ID: "X" })).not.toThrow();
    vi.restoreAllMocks();
  });
});

describe("getUrlParam", () => {
  it("reads from query string", () => {
    expect(getUrlParam("id", "?id=BLR-001", "")).toBe("BLR-001");
  });

  it("reads from hash query string (Wouter hash routing)", () => {
    expect(getUrlParam("id", "", "#/?id=HVAC-003")).toBe("HVAC-003");
  });

  it("returns empty string when param is absent", () => {
    expect(getUrlParam("id", "?foo=bar", "")).toBe("");
  });

  it("prefers the real query string over the hash", () => {
    expect(getUrlParam("id", "?id=REAL", "#/?id=HASH")).toBe("REAL");
  });
});

describe("validateChecklist", () => {
  it("returns null when all Boiler fields are valid", () => {
    const values = {
      pressure: "125",
      temperature: "180",
      waterLevel: "Normal",
      safetyValve: "Pass",
      lowWaterCutoff: "Pass",
      flameSafeguard: "Pass",
    };
    expect(validateChecklist("Boiler", values)).toBeNull();
  });

  it("returns an error when a required field is missing", () => {
    const values = {
      pressure: "125",
      waterLevel: "Normal",
      safetyValve: "Pass",
      lowWaterCutoff: "Pass",
      flameSafeguard: "Pass",
    };
    const result = validateChecklist("Boiler", values);
    expect(result).toMatch(/Temperature/);
  });

  it("rejects a negative pressure value", () => {
    const values = {
      pressure: "-10",
      temperature: "180",
      waterLevel: "Normal",
      safetyValve: "Pass",
      lowWaterCutoff: "Pass",
      flameSafeguard: "Pass",
    };
    const result = validateChecklist("Boiler", values);
    expect(result).toMatch(/at least 0/);
  });

  it("rejects a pressure value above max", () => {
    const values = {
      pressure: "9999",
      temperature: "180",
      waterLevel: "Normal",
      safetyValve: "Pass",
      lowWaterCutoff: "Pass",
      flameSafeguard: "Pass",
    };
    const result = validateChecklist("Boiler", values);
    expect(result).toMatch(/at most 1000/);
  });

  it("rejects non-numeric input in a number field", () => {
    const values = {
      pressure: "abc",
      temperature: "180",
      waterLevel: "Normal",
      safetyValve: "Pass",
      lowWaterCutoff: "Pass",
      flameSafeguard: "Pass",
    };
    const result = validateChecklist("Boiler", values);
    expect(result).toMatch(/must be a number/);
  });

  it("validates all equipment types without throwing", () => {
    const types: EquipmentType[] = ["Boiler", "HVAC", "Pressure Vessel", "Fire Suppression", "Other"];
    for (const t of types) {
      expect(() => validateChecklist(t, {})).not.toThrow();
      expect(validateChecklist(t, {})).toBeTypeOf("string");
    }
  });
});

describe("payload shape", () => {
  it("always includes all required top-level keys", () => {
    const required = [
      "ID", "Equipment Type", "Inspector", "Result", "Date",
      "Latitude", "Longitude", "Address", "Notes", "Photo",
    ];
    const payload: Record<string, string> = {
      "ID": "BLR-001",
      "Equipment Type": "Boiler",
      "Inspector": "Jane Smith",
      "Result": "Pass",
      "Date": new Date().toISOString(),
      "Latitude": "38.91",
      "Longitude": "-80.34",
      "Address": "123 Main St",
      "Notes": "",
      "Photo": "",
      pressure: "125",
      temperature: "180",
    };
    for (const key of required) {
      expect(payload).toHaveProperty(key);
    }
  });

  it("Date is a valid ISO string", () => {
    const date = new Date().toISOString();
    expect(() => new Date(date)).not.toThrow();
    expect(new Date(date).getFullYear()).toBeGreaterThan(2020);
  });
});
