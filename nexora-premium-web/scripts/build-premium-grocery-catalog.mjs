import { writeFile } from "node:fs/promises";

const brandSlugs = [
  "amul", "aashirvaad", "tata-sampann", "fortune", "saffola", "britannia",
  "parle", "haldirams", "lays", "kurkure", "maggi", "nescafe", "coca-cola",
  "pepsi", "sprite", "thums-up", "paper-boat", "kissan", "dabur", "patanjali",
  "surf-excel", "ariel", "vim", "colgate", "closeup", "dove", "lux", "dettol",
  "harpic", "cadbury", "nestle", "sunfeast",
];
const headers = { "User-Agent": "Mozilla/5.0 (compatible; NexoraCatalogAudit/1.0)" };
const pageResults = [];

for (let index = 0; index < brandSlugs.length; index += 5) {
  const group = brandSlugs.slice(index, index + 5);
  const responses = await Promise.all(group.map(async (brandSlug) => {
    try {
      const response = await fetch(`https://www.bigbasket.com/pb/${brandSlug}/`, { headers });
      if (!response.ok) return { brandSlug, products: [] };
      const html = await response.text();
      const payload = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
      if (!payload) return { brandSlug, products: [] };
      const data = JSON.parse(payload);
      const tabs = data?.props?.pageProps?.SSRData?.tabs;
      const products = Array.isArray(tabs)
        ? tabs.flatMap((tab) => tab?.product_info?.products ?? [])
        : tabs?.product_info?.products ?? [];
      return { brandSlug, products };
    } catch {
      return { brandSlug, products: [] };
    }
  }));
  pageResults.push(...responses);
}

const seenIds = new Set();
const selected = pageResults.flatMap(({ products }) => products
  .filter((product) => {
    const id = String(product.id ?? "");
    const image = product.images?.[0]?.xxl;
    const price = Number(product.pricing?.discount?.prim_price?.sp);
    const mrp = Number(product.pricing?.discount?.mrp);
    const rating = Number(product.rating_info?.avg_rating);
    const ratingCount = Number(product.rating_info?.rating_count);
    const valid = /^\d+$/.test(id) && image?.startsWith("https://www.bbassets.com/") &&
      price > 0 && mrp >= price && rating > 0 && rating <= 5 && ratingCount > 0 &&
      product.availability?.avail_status === "001" && !product.availability?.not_for_sale &&
      product.brand?.name && product.desc && product.w && product.absolute_url;
    if (!valid || seenIds.has(id)) return false;
    seenIds.add(id);
    return true;
  })
  .sort((a, b) => Number(b.rating_info.rating_count) - Number(a.rating_info.rating_count))
  .slice(0, 2));

const slugify = (value) => value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const esc = (value) => `'${String(value ?? "").replaceAll("'", "''")}'`;
const curated = [];
for (let index = 0; index < selected.length; index += 8) {
  const group = selected.slice(index, index + 8);
  const enriched = await Promise.all(group.map(async (product) => {
    let food = {};
    const ean = String(product.ean_code ?? "").replace(/\D/g, "");
    if (/^\d{8,14}$/.test(ean)) {
      try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${ean}?fields=ingredients_text,nutrition_grades,nutriments`, { headers });
        if (response.ok) food = (await response.json()).product ?? {};
      } catch {}
    }
    return { product, food };
  }));
  curated.push(...enriched);
}

const records = curated.map(({ product, food }, index) => {
  const brand = String(product.brand.name).trim();
  const descriptionName = String(product.desc).trim();
  const name = descriptionName.toLowerCase().startsWith(brand.toLowerCase()) ? descriptionName : `${brand} ${descriptionName}`;
  const size = String(product.w).trim();
  const price = Number(product.pricing.discount.prim_price.sp);
  const mrp = Number(product.pricing.discount.mrp);
  const rating = Number(product.rating_info.avg_rating);
  const ratingCount = Number(product.rating_info.rating_count);
  const actualReviews = Number(product.rating_info.review_count ?? 0);
  const ingredients = String(food.ingredients_text ?? "").replace(/\s+/g, " ").trim().slice(0, 260);
  const grade = String(food.nutrition_grades ?? "").toUpperCase();
  const nutrition = grade ? ` Open Food Facts nutrition grade: ${grade}.` : "";
  const ingredientText = ingredients ? ` Ingredients: ${ingredients}.` : " Refer to the sealed retail pack for the current ingredient and nutrition declaration.";
  const description = `${name}, ${size}. ${brand} product in ${product.category?.llc_name ?? product.category?.tlc_name ?? "Grocery"}.${ingredientText}${nutrition} BigBasket India catalogue snapshot recorded 18 July 2026: ${rating.toFixed(1)} from ${ratingCount.toLocaleString("en-IN")} ratings and ${actualReviews.toLocaleString("en-IN")} written reviews. Prices and availability vary by delivery location.`;
  const productSlug = `${slugify(name)}-${product.id}`;
  const imagePath = `/products/grocery/${productSlug}.jpg`;
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  return {
    id: 11000 + index,
    sourceId: String(product.id),
    name, brand, size, price, mrp, rating, ratingCount, actualReviews,
    category: String(product.category?.tlc_name ?? "Grocery"),
    subcategory: String(product.category?.llc_name ?? "General"),
    imageSource: product.images[0].xxl,
    imagePath,
    productSlug,
    sourceUrl: `https://www.bigbasket.com${product.absolute_url}`,
    description,
    discount,
    bestSeller: /\d+[KM]\+ SOLD/i.test(String(product.number_of_skus_sold ?? "")) || ratingCount >= 5000,
  };
});

const statements = [
  "DELETE FROM catalog_products WHERE category_name = 'Grocery'",
  ...records.map((item) => `INSERT INTO catalog_products (id, name, slug, sku, brand, model, official_description, category_name, subcategory_name, price_paise, previous_price_paise, stock_quantity, image_url, source_url, verification_status, rating_tenths, review_count, size, discount_percent, new_arrival, best_seller, warranty_text, shipping_text, return_policy_text, created_at, updated_at) VALUES (${item.id}, ${esc(item.name)}, ${esc(item.productSlug)}, ${esc(`BB-${item.sourceId}`)}, ${esc(item.brand)}, ${esc(item.size)}, ${esc(item.description)}, 'Grocery', ${esc(item.subcategory)}, ${Math.round(item.price * 100)}, ${Math.round(item.mrp * 100)}, 0, ${esc(item.imagePath)}, ${esc(item.sourceUrl)}, 'RETAILER_CATALOG_VERIFIED', ${Math.round(item.rating * 10)}, ${item.ratingCount}, ${esc(item.size)}, ${item.discount}, 0, ${item.bestSeller ? 1 : 0}, 'Manufacturer warranty is not applicable to grocery and household consumables', 'Delivery estimate available after Nexora supplier inventory confirmation', 'Returns accepted only for damaged, expired or incorrect consumable products', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`),
];
await writeFile(new URL("../premium-grocery-source.json", import.meta.url), JSON.stringify({ generatedAt: "2026-07-18", source: "BigBasket India public catalogue and Open Food Facts", records }, null, 2));
await writeFile(new URL("../drizzle/0006_premium_grocery_catalog.sql", import.meta.url), statements.join(";\n--> statement-breakpoint\n") + ";\n");
console.log(JSON.stringify({ brandsRequested: brandSlugs.length, brandsReached: pageResults.filter((item) => item.products.length).length, products: records.length }));
