import io
import json
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from PIL import Image, ImageStat

ROOT = Path(__file__).resolve().parents[1]
SQL = (ROOT / "drizzle" / "0005_open_prices_india_catalog.sql").read_text(encoding="utf-8")
URLS = re.findall(r"'(https://images\.openfoodfacts\.org/[^']+)'", SQL)

def inspect(url):
    full = re.sub(r"\.\d+\.jpg$", ".full.jpg", url)
    request = urllib.request.Request(full, headers={"User-Agent": "NexoraCommerce/1.0"})
    with urllib.request.urlopen(request, timeout=25) as response:
        data = response.read(15_000_000)
    image = Image.open(io.BytesIO(data)).convert("RGB")
    width, height = image.size
    sample = image.copy()
    sample.thumbnail((300, 300))
    sw, sh = sample.size
    band = max(2, min(sw, sh) // 18)
    borders = [sample.crop((0, 0, sw, band)), sample.crop((0, sh-band, sw, sh)), sample.crop((0, 0, band, sh)), sample.crop((sw-band, 0, sw, sh))]
    pixels = [pixel for border in borders for pixel in border.getdata()]
    neutral = sum(1 for r, g, b in pixels if min(r, g, b) >= 225 and max(r, g, b) - min(r, g, b) <= 22) / max(1, len(pixels))
    contrast = sum(ImageStat.Stat(sample).stddev) / 3
    return {"source": url, "full": full, "width": width, "height": height, "neutral_border": round(neutral, 3), "contrast": round(contrast, 1), "professional_candidate": width >= 1200 and height >= 1200 and neutral >= 0.72 and contrast >= 18}

results = []
with ThreadPoolExecutor(max_workers=16) as pool:
    futures = {pool.submit(inspect, url): url for url in URLS}
    for future in as_completed(futures):
        try:
            results.append(future.result())
        except Exception as error:
            results.append({"source": futures[future], "error": str(error), "professional_candidate": False})

results.sort(key=lambda item: item["source"])
report = {"total": len(results), "reachable": sum("error" not in item for item in results), "minimum_1200_square": sum(item.get("width", 0) >= 1200 and item.get("height", 0) >= 1200 for item in results), "professional_candidates": sum(item.get("professional_candidate", False) for item in results), "items": results}
(ROOT / "grocery-image-audit.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps({key: value for key, value in report.items() if key != "items"}))
