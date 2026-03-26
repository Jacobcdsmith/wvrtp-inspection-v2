# WVRTP Scripts

## `generate_mock_qr.py`

Generates printable mock QR codes for every piece of equipment in the test matrix. Used to validate:
- `?id=` URL param → **QR Scanned** badge appears in inspect form
- `?lat=` / `?lng=` → app can be patched to accept injected coords (bypasses `navigator.geolocation` for desktop testing)
- `?type=` → ready for auto-select wiring if you add that feature
- `?site=` → passed through for display/webhook payload enrichment

### Setup

```bash
pip install "qrcode[pil]" pillow
```

### Run

```bash
# Production URL (default)
python scripts/generate_mock_qr.py

# Local dev
BASE_URL=http://localhost:5173 python scripts/generate_mock_qr.py
```

### Outputs

| File | Description |
|------|-------------|
| `scripts/qr_output/<ID>.png` | Individual QR per device |
| `scripts/qr_output/index.html` | Printable sheet — open in browser, Ctrl+P |
| `scripts/qr_output/manifest.json` | JSON manifest for use in automated tests |

### Mock Equipment Matrix

| ID | Type | Site | Lat | Lng |
|----|------|------|-----|-----|
| BLR-001 | Boiler | Clarksburg Municipal Plant | 39.2806 | -80.3445 |
| BLR-002 | Boiler | Morgantown Power Station | 39.6295 | -79.9559 |
| BLR-003 | Boiler | Charleston Industrial | 38.3498 | -81.6326 |
| HVAC-001 | HVAC | Clarksburg Office Complex | 39.2812 | -80.3421 |
| HVAC-002 | HVAC | WVU Engineering Building | 39.6340 | -79.9530 |
| HVAC-003 | HVAC | Charleston Medical Center | 38.3512 | -81.6344 |
| PV-001 | Pressure Vessel | Clarksburg Tank Farm | 39.2798 | -80.3478 |
| PV-002 | Pressure Vessel | Bridgeport Storage | 39.4550 | -80.1500 |
| PV-003 | Pressure Vessel | Charleston Refinery | 38.3540 | -81.6290 |
| FS-001 | Fire Suppression | Clarksburg Data Center | 39.2820 | -80.3400 |
| FS-002 | Fire Suppression | Morgantown Hospital | 39.6310 | -79.9575 |
| FS-003 | Fire Suppression | Capitol Complex | 38.3485 | -81.6350 |
| OTH-001 | Other | Misc Equipment Bay A | 39.2800 | -80.3460 |

### Geo Testing Note

The app's `InspectPage` currently calls `navigator.geolocation` directly — GPS params in the QR URL (`?lat=` / `?lng=`) are **stored in the URL but not yet auto-injected** into the GPS state. To enable full geo override for desktop testing, patch `InspectPage` to check `getUrlParam('lat')` before calling `getCurrentPosition`:

```tsx
useEffect(() => {
  const mockLat = getUrlParam('lat');
  const mockLng = getUrlParam('lng');
  if (mockLat && mockLng) {
    setLatitude(mockLat); setLongitude(mockLng); setGpsStatus('success');
    // Optionally still hit Nominatim with mock coords
    return;
  }
  // ...existing geolocation code
}, []);
```

This lets you scan any mock QR on desktop and get realistic WV coordinates without needing physical GPS.
