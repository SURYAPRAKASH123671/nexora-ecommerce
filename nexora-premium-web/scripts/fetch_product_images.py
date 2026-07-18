"""Fetch product-specific reference images and normalize them for the storefront.

Run with a Python runtime that provides Pillow. The generated
manifest records the source URL used for every image.
"""

from __future__ import annotations

import html
import io
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "app" / "catalog.ts"
OUTPUT = ROOT / "public" / "products"
MANIFEST = ROOT / "product-image-sources.json"
SEARCH_RESULTS = ROOT / "product-image-search-results.json"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36"

SOURCE_OVERRIDES = {
    "Bose QuietComfort Ultra Headphones": "https://m.media-amazon.com/images/I/51NC9ErIQtL._AC_SL1500_.jpg",
    "OnePlus Buds Pro 3": "https://image01.oneplus.net/media/202408/16/cf620b0ec66e27ef110de1f324a595b7.png?x-amz-process=image/format,webp/quality,Q_80",
    "Noise Air Buds Pro 6": "https://cdn.jiostore.online/v2/jmd-asp/jdprod/wrkr/products/pictures/item/free/original/SddaF6WrBj-noise-earbuds-494623537-i-1-1200wx1200h.jpeg",
    "Sony PlayStation 5 Slim": "https://store.sony.com.au/dw/image/v2/ABBC_PRD/on/demandware.static/-/Sites-sony-master-catalog/default/dw7eb86f65/images/PLAYSTATION5WSLIM/PLAYSTATION5WSLIM_1.png",
    "PUMA Palermo": "https://www.sneaker10.gr/3169250-product_large/puma-palermo-premium.jpg",
    "Skechers GO WALK 7": "https://www.skechers.in/on/demandware.static/-/Sites-skechers_india/default/dw8ab43825/images/large/196989294063-5.jpg",
    "Pigeon by Stovekraft Handy Chopper": "https://m.media-amazon.com/images/I/61D6rzkMxdL._SL1092_.jpg",
    "Voltas 1.5 Ton 5 Star Inverter AC": "https://mahajanelectronics.com/cdn/shop/products/3_461f0c4d-74d3-4f08-b89c-b87a1f3aac57.jpg?v=1681379381&width=1946",
    "Mamaearth Vitamin C Daily Glow Face Serum": "https://www.bbassets.com/media/uploads/p/l/40333315_1-mamaearth-vitamin-c-daily-glow-face-serum.jpg",
}


def slugify(value: str) -> str:
    value = value.lower().replace("&", "and")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def product_names() -> list[str]:
    source = CATALOG.read_text(encoding="utf-8")
    return re.findall(r'^\s+\["([^"]+)",', source, flags=re.MULTILINE)


def search_candidates(name: str) -> list[str]:
    query = urllib.parse.quote(f"{name} product photo")
    request = urllib.request.Request(
        f"https://www.bing.com/images/search?q={query}&form=HDRSC2",
        headers={"User-Agent": USER_AGENT},
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        page = response.read().decode("utf-8", errors="ignore")
    urls = [html.unescape(item) for item in re.findall(r'murl&quot;:&quot;(.*?)&quot;', page)]
    unique: list[str] = []
    for url in urls:
        if url.startswith("http") and url not in unique:
            unique.append(url)
    if name in SOURCE_OVERRIDES:
        unique.insert(0, SOURCE_OVERRIDES[name])
    return unique[:20]


def download_image(url: str) -> tuple[Image.Image, bytes]:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "image/*"})
    with urllib.request.urlopen(request, timeout=18) as response:
        payload = response.read(12_000_000)
    if len(payload) < 8_000:
        raise ValueError("image payload too small")
    image = Image.open(io.BytesIO(payload))
    image.load()
    if image.width < 350 or image.height < 350:
        raise ValueError("image dimensions too small")
    return image, payload


def normalize(image: Image.Image, destination: Path) -> None:
    image = ImageOps.exif_transpose(image).convert("RGB")
    image.thumbnail((960, 960), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (960, 960), "#f4f5f7")
    x = (canvas.width - image.width) // 2
    y = (canvas.height - image.height) // 2
    canvas.paste(image, (x, y))
    canvas.save(destination, "WEBP", quality=84, method=6)


def main() -> int:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    existing = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
    resolved_sources = json.loads(SEARCH_RESULTS.read_text(encoding="utf-8-sig")) if SEARCH_RESULTS.exists() else {}
    names = product_names()
    if len(names) != 80:
        raise RuntimeError(f"Expected 80 catalogue products, found {len(names)}")

    failures: list[str] = []
    force = "--force" in sys.argv
    for index, name in enumerate(names, start=1):
        slug = slugify(name)
        destination = OUTPUT / f"{slug}.webp"
        if not force and destination.exists() and destination.stat().st_size > 10_000 and slug in existing:
            print(f"[{index:02d}/80] existing {name}", flush=True)
            continue

        try:
            candidates = search_candidates(name)
            if name in resolved_sources:
                candidates.insert(0, resolved_sources[name])
        except Exception as error:
            print(f"[{index:02d}/80] search failed {name}: {error}", flush=True)
            failures.append(name)
            continue

        saved = False
        for url in candidates:
            try:
                image, _ = download_image(url)
                normalize(image, destination)
                existing[slug] = {"product": name, "source": url}
                MANIFEST.write_text(json.dumps(existing, indent=2, ensure_ascii=False), encoding="utf-8")
                print(f"[{index:02d}/80] saved {name}", flush=True)
                saved = True
                break
            except Exception:
                continue
        if not saved:
            print(f"[{index:02d}/80] no usable image for {name}", flush=True)
            failures.append(name)
        time.sleep(0.15)

    print(f"Completed with {len(failures)} failures", flush=True)
    if failures:
        print("FAILED: " + " | ".join(failures), flush=True)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
