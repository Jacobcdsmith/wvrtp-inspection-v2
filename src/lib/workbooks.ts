export interface ChecklistField {
  key: string;
  label: string;
  type: "number" | "select";
  unit?: string;
  options?: string[];
  min?: number;
  max?: number;
}

export interface WorkbookConfig {
  id: string;              // route segment: /inspect/mechanical
  label: string;           // nav label and page heading
  webhookEnvVar: string;   // import.meta.env key
  equipmentTypes: string[];
  checklists: Record<string, ChecklistField[]>;
}

export const WORKBOOKS: WorkbookConfig[] = [
  {
    id: "mechanical",
    label: "Mechanical",
    webhookEnvVar: "VITE_WEBHOOK_URL",
    equipmentTypes: ["Boiler", "HVAC", "Pressure Vessel", "Fire Suppression", "Other"],
    checklists: {
      Boiler: [
        { key: "pressure",       label: "Pressure",          type: "number", unit: "PSI", min: 0, max: 1000 },
        { key: "temperature",    label: "Temperature",        type: "number", unit: "°F",  min: 0, max: 1000 },
        { key: "waterLevel",     label: "Water Level",        type: "select", options: ["Normal", "Low", "High"] },
        { key: "safetyValve",    label: "Safety Valve",       type: "select", options: ["Pass", "Fail"] },
        { key: "lowWaterCutoff", label: "Low-Water Cutoff",   type: "select", options: ["Pass", "Fail"] },
        { key: "flameSafeguard", label: "Flame Safeguard",    type: "select", options: ["Pass", "Fail"] },
      ],
      HVAC: [
        { key: "temperature",      label: "Temperature",      type: "number", unit: "°F",  min: -50, max: 200 },
        { key: "filterCondition",  label: "Filter Condition",  type: "select", options: ["Pass", "Fail"] },
        { key: "refrigerantLevel", label: "Refrigerant Level", type: "select", options: ["Normal", "Low"] },
        { key: "thermostat",       label: "Thermostat",        type: "select", options: ["Pass", "Fail"] },
        { key: "ductwork",         label: "Ductwork",          type: "select", options: ["Pass", "Fail"] },
      ],
      "Pressure Vessel": [
        { key: "pressure",          label: "Pressure",            type: "number", unit: "PSI", min: 0, max: 3000 },
        { key: "safetyReliefValve", label: "Safety Relief Valve",  type: "select", options: ["Pass", "Fail"] },
        { key: "shellCondition",    label: "Shell Condition",      type: "select", options: ["Pass", "Fail"] },
        { key: "fittings",          label: "Fittings",             type: "select", options: ["Pass", "Fail"] },
      ],
      "Fire Suppression": [
        { key: "gaugePressure", label: "Gauge Pressure", type: "number", unit: "PSI", min: 0, max: 500 },
        { key: "tamperSeal",    label: "Tamper Seal",    type: "select", options: ["Intact", "Broken"] },
        { key: "signage",       label: "Signage",        type: "select", options: ["Pass", "Fail"] },
        { key: "accessClear",   label: "Access Clear",   type: "select", options: ["Pass", "Fail"] },
      ],
      Other: [
        { key: "generalCondition", label: "General Condition", type: "select", options: ["Pass", "Fail"] },
      ],
    },
  },
  {
    id: "electrical",
    label: "Electrical",
    webhookEnvVar: "VITE_WEBHOOK_URL_ELECTRICAL",
    equipmentTypes: ["Panel", "Generator", "UPS", "Transfer Switch", "Substation", "Switchgear", "Transformer", "Chiller", "Other"],
    checklists: {
      Panel: [
        { key: "voltage",     label: "Voltage",     type: "number", unit: "V", min: 0, max: 600 },
        { key: "amperage",    label: "Amperage",    type: "number", unit: "A", min: 0, max: 5000 },
        { key: "breakers",    label: "Breakers",    type: "select", options: ["All Closed", "Tripped"] },
        { key: "groundFault", label: "Ground Fault", type: "select", options: ["Pass", "Fail"] },
      ],
      Generator: [
        { key: "voltage",          label: "Output Voltage",   type: "number", unit: "V", min: 0, max: 600 },
        { key: "fuelLevel",        label: "Fuel Level",       type: "select", options: ["Full", "3/4", "1/2", "1/4", "Low"] },
        { key: "oilLevel",         label: "Oil Level",        type: "select", options: ["Normal", "Low"] },
        { key: "coolantLevel",     label: "Coolant Level",    type: "select", options: ["Normal", "Low"] },
        { key: "batteryCondition", label: "Battery Condition", type: "select", options: ["Pass", "Fail"] },
      ],
      UPS: [
        { key: "batteryHealth", label: "Battery Health",  type: "select", options: ["Good", "Replace"] },
        { key: "loadPercent",   label: "Load",            type: "number", unit: "%", min: 0, max: 100 },
        { key: "runtime",       label: "Est. Runtime",    type: "number", unit: "min", min: 0, max: 480 },
      ],
      "Transfer Switch": [
        { key: "position",  label: "Switch Position", type: "select", options: ["Normal", "Emergency", "Test"] },
        { key: "condition", label: "Condition",        type: "select", options: ["Pass", "Fail"] },
      ],
      Other: [
        { key: "generalCondition", label: "General Condition", type: "select", options: ["Pass", "Fail"] },
      ],
      Substation: [
        { key: "voltage",       label: "Voltage",        type: "number", unit: "V", min: 0, max: 15000 },
        { key: "amps",          label: "Amps",           type: "number", unit: "A", min: 0, max: 5000 },
        { key: "batteryVoltage",label: "Battery Voltage", type: "number", unit: "V", min: 0, max: 200 },
        { key: "batteryAmps",   label: "Battery Amps",   type: "number", unit: "A", min: 0, max: 100 },
        { key: "lighting",      label: "Lighting",       type: "select", options: ["Pass", "Fail"] },
        { key: "ventFan",       label: "Vent Fan",       type: "select", options: ["Pass", "Fail"] },
        { key: "groundLights",  label: "Ground Lights",  type: "select", options: ["Pass", "Fail"] },
        { key: "oilLevel",      label: "Oil Level",      type: "select", options: ["Normal", "Low"] },
        { key: "housekeeping",  label: "Housekeeping",   type: "select", options: ["Pass", "Fail"] },
      ],
      Switchgear: [
        { key: "voltage",       label: "Voltage",        type: "number", unit: "V", min: 0, max: 15000 },
        { key: "amps",          label: "Amps",           type: "number", unit: "A", min: 0, max: 5000 },
        { key: "switchPosition",label: "Switch Position", type: "select", options: ["Closed", "Open", "Test"] },
      ],
      Transformer: [
        { key: "oilLevel",  label: "Oil Level",  type: "select", options: ["Normal", "Low"] },
        { key: "oilLeak",   label: "Oil Leak",   type: "select", options: ["None", "Minor", "Major"] },
      ],
      Chiller: [
        { key: "oilLevel",          label: "Oil Level",          type: "select", options: ["Normal", "Low"] },
        { key: "refrigerantLevel",  label: "Refrigerant Level",  type: "select", options: ["Normal", "Low"] },
        { key: "oilLeak",           label: "Oil Leak",           type: "select", options: ["None", "Minor", "Major"] },
      ],
    },
  },
];
