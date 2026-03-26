import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.colormasks import SolidFillColorMask

BASE = "https://wvrtp-inspection-app.vercel.app"

test_items = [
    ("BLR-001", "Building 740 Main Boiler"),
    ("HVAC-001", "Building 740 Main AHU"),
    ("PV-001", "Lab A Pressure Vessel"),
]

for item_id, name in test_items:
    url = f"{BASE}/?id={item_id}"
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=12, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(
        image_factory=StyledPilImage,
        color_mask=SolidFillColorMask(back_color=(255,255,255), front_color=(27,74,110))  # WVRTP Navy
    )
    path = f"qr-{item_id}.png"
    img.save(path)
    print(f"Generated: {path} -> {url}")

# Also make a combined print sheet
from PIL import Image, ImageDraw, ImageFont

sheet = Image.new("RGB", (900, 1200), "white")
draw = ImageDraw.Draw(sheet)

try:
    font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
    font_label = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
    font_sub = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
except:
    font_title = ImageFont.load_default()
    font_label = font_title
    font_sub = font_title

draw.text((50, 30), "WVRTP QR Code Test Sheet", fill=(27,74,110), font=font_title)
draw.text((50, 70), "Scan any code with your phone camera to open the inspection form", fill=(100,100,100), font=font_sub)
draw.line([(50, 100), (850, 100)], fill=(234,137,51), width=3)

y = 130
for i, (item_id, name) in enumerate(test_items):
    qr_img = Image.open(f"qr-{item_id}.png").resize((280, 280))
    sheet.paste(qr_img, (50, y))
    draw.text((360, y + 40), item_id, fill=(27,74,110), font=font_label)
    draw.text((360, y + 70), name, fill=(47,46,46), font=font_sub)
    draw.text((360, y + 100), f"{BASE}/?id={item_id}", fill=(100,100,100), font=font_sub)
    if i < len(test_items) - 1:
        draw.line([(50, y + 300), (850, y + 300)], fill=(220,220,220), width=1)
    y += 330

sheet.save("qr-test-sheet.png")
print("Generated: qr-test-sheet.png")
