#!/usr/bin/env python3
"""
WVRTP Mock QR Code Generator
================================
Generates QR codes for every piece of mock equipment defined below.
Each QR encodes a URL that pre-fills the inspection app with:
  - ?id=   → Equipment ID (triggers 'QR Scanned' badge in the UI)
  - &type= → Equipment type (auto-selects dropdown if app supports it)
  - &lat=  → Mock latitude  (overrides GPS for offline/geo testing)
  - &lng=  → Mock longitude (overrides GPS for offline/geo testing)

Outputs:
  scripts/qr_output/<ID>.png   — individual QR image per device
  scripts/qr_output/index.html — printable sheet with all QR codes

Usage:
  pip install qrcode[pil] pillow
  python scripts/generate_mock_qr.py

  # Override base URL (e.g. local dev)
  BASE_URL=http://localhost:5173 python scripts/generate_mock_qr.py
"""

import os
import json
import qrcode
from qrcode.image.pil import PilImage
from urllib.parse import urlencode
from pathlib import Path

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------
BASE_URL = os.environ.get("BASE_URL", "https://wvrtp-inspection-app.vercel.app")
OUTPUT_DIR = Path(__file__).parent / "qr_output"

# ---------------------------------------------------------------------------
# MOCK EQUIPMENT
# Each entry maps to a real EquipmentType in the app:
#   Boiler | HVAC | Pressure Vessel | Fire Suppression | Other
#
# lat/lng are realistic WV coordinates spread around different facility types:
#   - Clarksburg area (Harrison County)
#   - Morgantown area (Monongalia County)
#   - Charleston area (Kanawha County)
# ---------------------------------------------------------------------------
MOCK_EQUIPMENT = [
    # --- Boilers ---
    {"id": "BLR-001", "type": "Boiler",           "lat": 39.2806, "lng": -80.3445, "site": "Clarksburg Municipal Plant"},
    {"id": "BLR-002", "type": "Boiler",           "lat": 39.6295, "lng": -79.9559, "site": "Morgantown Power Station"},
    {"id": "BLR-003", "type": "Boiler",           "lat": 38.3498, "lng": -81.6326, "site": "Charleston Industrial Facility"},

    # --- HVAC ---
    {"id": "HVAC-001", "type": "HVAC",            "lat": 39.2812, "lng": -80.3421, "site": "Clarksburg Office Complex"},
    {"id": "HVAC-002", "type": "HVAC",            "lat": 39.6340, "lng": -79.9530, "site": "WVU Engineering Building"},
    {"id": "HVAC-003", "type": "HVAC",            "lat": 38.3512, "lng": -81.6344, "site": "Charleston Medical Center"},

    # --- Pressure Vessels ---
    {"id": "PV-001",  "type": "Pressure Vessel",  "lat": 39.2798, "lng": -80.3478, "site": "Clarksburg Tank Farm"},
    {"id": "PV-002",  "type": "Pressure Vessel",  "lat": 39.4550, "lng": -80.1500, "site": "Bridgeport Storage Facility"},
    {"id": "PV-003",  "type": "Pressure Vessel",  "lat": 38.3540, "lng": -81.6290, "site": "Charleston Refinery"},

    # --- Fire Suppression ---
    {"id": "FS-001",  "type": "Fire Suppression", "lat": 39.2820, "lng": -80.3400, "site": "Clarksburg Data Center"},
    {"id": "FS-002",  "type": "Fire Suppression", "lat": 39.6310, "lng": -79.9575, "site": "Morgantown Hospital"},
    {"id": "FS-003",  "type": "Fire Suppression", "lat": 38.3485, "lng": -81.6350, "site": "Capitol Complex"},

    # --- Other ---
    {"id": "OTH-001", "type": "Other",            "lat": 39.2800, "lng": -80.3460, "site": "Misc Equipment Bay A"},
]

# ---------------------------------------------------------------------------
# QR GENERATION
# ---------------------------------------------------------------------------
def make_url(device: dict) -> str:
    params = urlencode({
        "id":   device["id"],
        "type": device["type"],
        "lat":  device["lat"],
        "lng":  device["lng"],
        "site": device["site"],
    })
    return f"{BASE_URL}/?{params}"


def generate_qr(url: str, output_path: Path) -> None:
    qr = qrcode.QRCode(
        version=None,          # auto-size
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=8,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img: PilImage = qr.make_image(fill_color="black", back_color="white")
    img.save(output_path)
    print(f"  ✓ {output_path.name}  →  {url}")


def build_html_sheet(equipment_list: list, output_dir: Path) -> None:
    """Produces a printable A4 HTML sheet with QR + label per device."""
    cards = ""
    for dev in equipment_list:
        url = make_url(dev)
        img_path = f"{dev['id']}.png"
        cards += f"""
        <div class="card">
          <img src="{img_path}" alt="{dev['id']}" />
          <div class="label">
            <strong>{dev['id']}</strong><br/>
            {dev['type']}<br/>
            <small>{dev['site']}</small><br/>
            <small class="coords">{dev['lat']}, {dev['lng']}</small>
          </div>
        </div>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>WVRTP Mock QR Sheet</title>
  <style>
    body {{ font-family: sans-serif; margin: 20px; }}
    h1   {{ font-size: 1.1rem; color: #1a3a5c; }}
    .grid {{ display: flex; flex-wrap: wrap; gap: 16px; }}
    .card {{
      border: 1px solid #ccc; border-radius: 8px;
      padding: 12px; width: 160px; text-align: center;
      page-break-inside: avoid;
    }}
    .card img {{ width: 140px; height: 140px; }}
    .label {{ font-size: 0.72rem; margin-top: 6px; color: #333; }}
    .coords {{ color: #888; }}
    @media print {{
      body {{ margin: 0; }}
      .grid {{ gap: 8px; }}
    }}
  </style>
</head>
<body>
  <h1>WVRTP Inspection — Mock QR Test Sheet</h1>
  <p style="font-size:0.75rem;color:#555">Base URL: {BASE_URL}</p>
  <div class="grid">{cards}
  </div>
</body>
</html>"""
    index_path = output_dir / "index.html"
    index_path.write_text(html, encoding="utf-8")
    print(f"\n  ✓ index.html — printable sheet written")


def export_manifest(equipment_list: list, output_dir: Path) -> None:
    """Writes a JSON manifest for programmatic use in tests."""
    manifest = [
        {**dev, "url": make_url(dev)}
        for dev in equipment_list
    ]
    manifest_path = output_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"  ✓ manifest.json — {len(manifest)} devices")


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"\nGenerating {len(MOCK_EQUIPMENT)} QR codes → {OUTPUT_DIR}\n")

    for dev in MOCK_EQUIPMENT:
        url = make_url(dev)
        out = OUTPUT_DIR / f"{dev['id']}.png"
        generate_qr(url, out)

    build_html_sheet(MOCK_EQUIPMENT, OUTPUT_DIR)
    export_manifest(MOCK_EQUIPMENT, OUTPUT_DIR)
    print(f"\nDone. Open scripts/qr_output/index.html to print or scan.\n")


if __name__ == "__main__":
    main()
