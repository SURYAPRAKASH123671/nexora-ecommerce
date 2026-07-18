import { writeFile } from "node:fs/promises";

const headers = {
  "User-Agent": "NexoraCommerce/1.0 (suryakannan32123@gmail.com)",
};
const observations = [];
for (let page = 1; page <= 4; page += 1) {
  const response = await fetch(
    `https://prices.openfoodfacts.org/api/v1/prices?currency=INR&size=100&page=${page}`,
    { headers },
  );
  if (!response.ok) throw new Error(`Open Prices request failed: ${response.status}`);
  const payload = await response.json();
  observations.push(...payload.items);
}

const seenCodes = new Set();
const seenNames = new Set();
const seenImages = new Set();
const products = observations
  .sort((a, b) => String(b.date).localeCompare(String(a.date)))
  .filter((item) => {
    const product = item.product;
    const code = String(item.product_code ?? product?.code ?? "").trim();
    const name = String(product?.product_name ?? item.product_name ?? "").trim();
    const image = String(product?.image_url ?? "").trim();
    const country = item.location?.osm_address_country_code;
    if (
      item.currency !== "INR" ||
      country !== "IN" ||
      !/^\d{8,14}$/.test(code) ||
      name.length < 3 ||
      !image.startsWith("https://images.openfoodfacts.org/") ||
      !Number.isFinite(Number(item.price)) ||
      Number(item.price) <= 0 ||
      seenCodes.has(code) ||
      seenNames.has(name.toLowerCase()) ||
      seenImages.has(image)
    )
      return false;
    seenCodes.add(code);
    seenNames.add(name.toLowerCase());
    seenImages.add(image);
    return true;
  });

const esc = (value) => `'${String(value ?? "").replaceAll("'", "''")}'`;
const slug = (value) =>
  value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const statements = products.map((item, index) => {
  const product = item.product;
  const code = String(item.product_code ?? product.code);
  const name = String(product.product_name).trim();
  const brand = String(product.brands ?? "Independent").split(",")[0].trim();
  const quantity = String(product.quantity ?? "").trim();
  const subcategory = String(product.categories_tags?.at(-1) ?? "en:grocery")
    .replace(/^[a-z]{2}:/, "")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  const description = `${name}${quantity ? ` (${quantity})` : ""}. Product and packaging information sourced from Open Food Facts. Observed INR price dated ${item.date}.`;
  const price = Math.round(Number(item.price) * 100);
  const previous = item.price_without_discount
    ? Math.round(Number(item.price_without_discount) * 100)
    : "NULL";
  const discount = previous !== "NULL" && previous > price
    ? Math.round(((previous - price) / previous) * 100)
    : 0;
  return `INSERT OR IGNORE INTO catalog_products (id, name, slug, sku, brand, model, official_description, category_name, subcategory_name, price_paise, previous_price_paise, stock_quantity, image_url, source_url, verification_status, rating_tenths, review_count, discount_percent, new_arrival, best_seller, warranty_text, shipping_text, return_policy_text, created_at, updated_at) VALUES (${10000 + index}, ${esc(name)}, ${esc(`${slug(name)}-${code}`)}, ${esc(`OFF-${code}`)}, ${esc(brand || "Independent")}, ${esc(quantity || code)}, ${esc(description)}, 'Grocery', ${esc(subcategory)}, ${price}, ${previous}, 0, ${esc(product.image_url)}, ${esc(`https://world.openfoodfacts.org/product/${code}`)}, 'OPEN_DATA_VERIFIED', 0, 0, ${discount}, 0, 0, 'Manufacturer warranty is not applicable to grocery products', 'Availability pending supplier confirmation', 'Returns accepted only for damaged or incorrect grocery items', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`;
});

await writeFile(
  new URL("../drizzle/0005_open_prices_india_catalog.sql", import.meta.url),
  statements.join("\n--> statement-breakpoint\n") + "\n",
);
console.log(JSON.stringify({ fetched: observations.length, accepted: products.length }));
