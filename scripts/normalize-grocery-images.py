import io
import json
import urllib.request
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / "premium-grocery-source.json").read_text(encoding="utf-8"))
output = ROOT / "public" / "products" / "grocery"
output.mkdir(parents=True, exist_ok=True)

for item in manifest["records"]:
    request = urllib.request.Request(item["imageSource"], headers={"User-Agent": "NexoraCommerce/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        original = Image.open(io.BytesIO(response.read(8_000_000))).convert("RGB")
    clean = ImageOps.contain(original, (1000, 1000), Image.Resampling.LANCZOS)
    clean = ImageEnhance.Sharpness(clean).enhance(1.08)
    pixels = clean.load()
    for y in range(clean.height):
        for x in range(clean.width):
            red, green, blue = pixels[x, y]
            if min(red, green, blue) >= 222 and max(red, green, blue) - min(red, green, blue) <= 26:
                pixels[x, y] = (255, 255, 255)
    canvas = Image.new("RGB", (1200, 1200), (255, 255, 255))
    canvas.paste(clean, ((1200 - clean.width) // 2, (1200 - clean.height) // 2))
    destination = ROOT / "public" / item["imagePath"].lstrip("/")
    canvas.save(destination, "JPEG", quality=92, optimize=True, progressive=True)

print(json.dumps({"normalized": len(manifest["records"]), "size": "1200x1200"}))
