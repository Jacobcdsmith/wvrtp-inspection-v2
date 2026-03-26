# WVRTP Scripts

## `generate_mock_qr.py`

Generates styled WVRTP-branded QR codes for field testing the inspection app.

### Setup

```bash
pip install "qrcode[pil]" pillow
```

### Run

```bash
python scripts/generate_mock_qr.py
```

Run from the repo root or any directory — outputs land in the working directory.

### Outputs

| File | Description |
|------|-------------|
| `qr-BLR-001.png` | Boiler — Building 740 Main Boiler |
| `qr-HVAC-001.png` | HVAC — Building 740 Main AHU |
| `qr-PV-001.png` | Pressure Vessel — Lab A |
| `qr-test-sheet.png` | Combined 900×1200 print sheet (all 3 QRs) |

### Test Items

| ID | Label |
|----|-------|
| BLR-001 | Building 740 Main Boiler |
| HVAC-001 | Building 740 Main AHU |
| PV-001 | Lab A Pressure Vessel |

### How It Works on Mobile

Each QR encodes `https://wvrtp-inspection-app.vercel.app/?id=<ID>` — no mock coordinates injected.

When scanned on a real device:
- `?id=` pre-fills Equipment ID and triggers the **QR Scanned** badge
- `navigator.geolocation` fires normally and captures **live device coordinates**
- Nominatim reverse-geocodes the real location to a street address

This tests the full production flow end-to-end.
