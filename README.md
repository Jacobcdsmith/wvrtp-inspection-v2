# WVRTP QR Code Inspection System

Pure static React app. No server. No database. Deploys to Vercel in one click.

## Stack
- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui primitives
- Wouter (hash routing)
- localStorage auth + history
- Direct Power Automate webhook POST

## Auth
- Username: `WVRTP`
- Password: set via `VITE_APP_PASSWORD` env var (default: `inspector2026`)

## Deploy to Vercel
1. Import this repo in Vercel
2. Add environment variables:
   - `VITE_WEBHOOK_URL` — your Power Automate HTTP trigger URL
   - `VITE_APP_PASSWORD` — `inspector2026` (or rotate as needed)
3. Deploy — done.

## Webhook Payload
Every submission POSTs a flat JSON object:
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

## Upgrade Path
When ready to add a server:
1. Deploy backend (Railway/Render/Azure)
2. Update `VITE_WEBHOOK_URL` to point to your proxy
3. Zero frontend changes required
