# WVRTP QR Code Inspection System — v2

Internal technical documentation for the WVRTP equipment inspection web app. For the system design overview and Excel template, see `/WVRTP-QR-Inspection-System-Design-1-2.pdf` and `WVRTP-Master-Inspection-Workbook.xlsx` in this repo.

---

## What this is

A static React SPA deployed to Vercel. Staff scan a QR code on any tracked piece of equipment (boilers, HVAC units, pressure vessels, fire suppression stations), the form opens in their phone browser with the Equipment ID pre-filled, they complete the type-specific checklist, and hit Submit. The app POSTs a flat JSON payload to a Power Automate HTTP trigger, which writes a new row to the shared Excel inspection log.

No backend. No database. No app install. All storage and automation lives in Microsoft 365.

---

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Build | Vite 6 + TypeScript 5.6 | `npm run dev` / `npm run build` |
| UI framework | React 18 | Functional components, hooks throughout |
| Routing | Wouter (hash routing) | Hash-based so Vercel serves `index.html` for all routes |
| Styling | Tailwind CSS 3 + shadcn/ui primitives | Radix UI under the hood |
| State | React context + localStorage | Auth state and inspection history |
| HTTP | Native `fetch` | Direct webhook POST, no proxy |
| Icons | Lucide React | |
| Testing | Vitest | `npm test` / `npm run test:watch` |
| Deployment | Vercel (static) | `vercel.json` rewrites all routes to `index.html` |

---

## Project structure

```
src/
  App.tsx              # Root — AuthProvider, Router, TopNav, protected routes
  main.tsx             # Entry point
  index.css            # Tailwind base styles
  pages/
    login.tsx          # Login form — validates against VITE_APP_PASSWORD
    inspect.tsx        # Main inspection form — dynamic checklist, GPS, webhook POST
    history.tsx        # localStorage inspection history viewer
    not-found.tsx      # 404 fallback
  context/
    auth-context.tsx   # Auth state: isAuthenticated, login(), logout() via localStorage
  components/
    ui/                # shadcn/ui components (toast, tooltip, etc.)
  hooks/
    use-toast.ts       # Toast hook
  __tests__/
    inspection.test.ts # Unit tests — CHECKLISTS, saveToHistory, getUrlParam, validation
  lib/
    utils.ts           # cn() utility
```

---

## Auth

Front-end only. There is no server-side session.

- Username is hardcoded: `WVRTP`
- Password is set via `VITE_APP_PASSWORD` — read at **build time** by Vite and embedded verbatim in the JS bundle
- On successful login, `isAuthenticated: true` is written to `localStorage`
- `AuthProvider` in `auth-context.tsx` reads this on mount and exposes `login()` / `logout()`
- All routes other than `/` (login) are gated by `isAuthenticated` in `AppRouter`

> **Security note:** `VITE_` prefixed variables are embedded in the compiled JavaScript at build time. The password is therefore visible to anyone who downloads the JS bundle — it is a deterrent, not a secret. This is acceptable for an internal campus tool. Do not use this pattern if the app is ever exposed to the public internet.

> **To change the password:** update `VITE_APP_PASSWORD` in Vercel environment settings and redeploy. Vite will embed the new value in the next build. The old bundle (with the old password) continues to work until it is replaced by the new deployment.

---

## Inspection form — how it works

`src/pages/inspect.tsx` is the core of the app.

**QR pre-fill:** The form reads `?id=` from the URL query string (with fallback to hash-based query for Wouter compatibility). If an ID is found, the Equipment ID field is pre-filled and a "QR Scanned" badge appears.

**Dynamic checklist:** Equipment type selection drives the checklist rendered on screen. Checklists are defined in the `CHECKLISTS` constant at the top of `inspect.tsx`:

| Type | Fields |
|---|---|
| Boiler | Pressure (PSI), Temperature (°F), Water Level, Safety Valve, Low-Water Cutoff, Flame Safeguard |
| HVAC | Temperature (°F), Filter Condition, Refrigerant Level, Thermostat, Ductwork |
| Pressure Vessel | Pressure (PSI), Safety Relief Valve, Shell Condition, Fittings |
| Fire Suppression | Gauge Pressure (PSI), Tamper Seal, Signage, Access Clear |
| Other | General Condition + Notes (required) |

Changing the type clears all checklist values. All fields are required before submission. Number fields enforce `min`/`max` bounds defined in `CHECKLISTS`.

**Inspector name persistence:** The inspector name is saved to `localStorage` under `wvrtp_inspector_name` and restored on page load, so staff do not need to retype their name between submissions.

**GPS:** `navigator.geolocation.getCurrentPosition` fires on page load. Coordinates are reverse-geocoded to a human-readable address via Nominatim (OpenStreetMap, no API key). GPS failure is non-blocking — the form still submits.

**Local history:** Every submission is saved to `localStorage` under `wvrtp_inspections` (capped at 200 records) before the webhook fires. If the webhook fails, the local record is still saved and the user sees a warning toast including the HTTP status code.

**Webhook POST:** If `VITE_WEBHOOK_URL` is set, the form POSTs a flat JSON object to that URL. A non-2xx HTTP response is treated as a failure (same as a network error).

---

## Webhook payload

Every submission sends this shape:

```json
{
  "ID": "BLR-001",
  "Equipment Type": "Boiler",
  "Inspector": "Jane Smith",
  "Result": "Pass",
  "Date": "2026-03-25T23:00:00.000Z",
  "Latitude": "38.91",
  "Longitude": "-80.34",
  "Address": "123 Main St, Clarksburg, WV",
  "Notes": "",
  "Photo": "",
  "pressure": "125",
  "temperature": "180",
  "waterLevel": "Normal",
  "safetyValve": "Pass",
  "lowWaterCutoff": "Pass",
  "flameSafeguard": "Pass"
}
```

- Top-level fields are always present. Checklist fields are merged in flat — only the fields relevant to the selected equipment type will be populated.
- `Photo` is the filename only. The file itself is not uploaded — photo upload to storage is a future enhancement.
- Power Automate receives this and maps fields to the Inspection Log Excel table columns.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_WEBHOOK_URL` | Yes (for data to flow) | Power Automate HTTP trigger URL |
| `VITE_APP_PASSWORD` | No | App password — defaults to `inspector2026` if not set |

Set these in Vercel under Project → Settings → Environment Variables. Both are `VITE_` prefixed so Vite embeds them at build time.

---

## Deploying to Vercel

1. Import this repo in Vercel
2. Framework preset: **Vite** (auto-detected)
3. Add environment variables (see above)
4. Deploy

`vercel.json` rewrites all routes to `index.html` so hash routing works correctly on direct URL access.

Local dev:

```bash
npm install
cp .env.example .env.local   # fill in your values
npm run dev
```

Run tests:

```bash
npm test          # single run
npm run test:watch  # watch mode
```

---

## Excel workbook

See `WVRTP-Master-Inspection-Workbook.xlsx` in this repo. It has three sheets:

- **Equipment Registry** — master list of all tracked equipment, QR Code URL per item, QR code image via Excel `IMAGE` formula. Add a row here when installing new equipment; QR code generates automatically.
- **Inspection Log** — one row per submission, populated by Power Automate. The `Type` column auto-fills from the Registry via VLOOKUP. Do not manually edit this sheet.
- **Dashboard** — formula-driven summary: total inspections, pass rate, open failures, attention items, counts by type.

For QR code labels: print column L (QR Code) from the Equipment Registry, laminate, and affix to equipment.

---

## Adding a new equipment type

1. Add the type to the `CHECKLISTS` constant in `src/pages/inspect.tsx` — include `min`/`max` on any `number` fields
2. Add the type to the `EquipmentType` union type in the same file
3. Add `<option>` to the Equipment Type `<select>` in the form
4. Add the type to the Equipment Registry `Type` data validation list in the Excel workbook
5. Redeploy to Vercel (auto-deploys on push to `main` if connected)

No structural changes to the Excel schema or Power Automate flow are needed — new checklist fields merge into the existing flat payload.

---

## Upgrade path

When a backend is needed (user management, retry logic, file uploads, etc.):

1. Deploy a backend service (Railway, Render, Azure Functions, etc.)
2. Point `VITE_WEBHOOK_URL` at your new API endpoint
3. Zero frontend code changes required — the payload contract is already defined

---

## Known limitations

- **No webhook retry.** If the POST fails, the inspection is saved locally but not re-sent. A future enhancement would queue failed submissions and retry on reconnect.
- **Photo filename only.** The photo input captures a file reference but does not upload the file. Photo URL in the payload will be blank unless a separate upload mechanism is added.
- **Front-end auth only.** The password is embedded in the built JS bundle. This is acceptable for an internal campus tool but should be replaced with a proper auth layer if the app is ever exposed publicly.
- **GPS accuracy indoors.** Nominatim reverse geocoding relies on device GPS, which is typically 50–100m accuracy indoors. Sufficient to confirm on-campus presence; not precise enough for room-level verification.
- **localStorage cap.** Local history is capped at 200 records. Records beyond that are silently dropped from local storage (all records still flow to Excel via webhook).
