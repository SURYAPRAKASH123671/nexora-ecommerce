import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { registerHooks } from "node:module";
import test from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "cloudflare:workers") {
      return {
        url: "data:text/javascript,export%20const%20env%20%3D%20%7B%7D%3B",
        shortCircuit: true,
      };
    }
    return nextResolve(specifier, context);
  },
});

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Nexora India storefront", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Nexora — Thoughtfully chosen<\/title>/i);
  assert.match(html, /Good things,/);
  assert.match(html, /Trending across India/);
  assert.match(
    html,
    /A preview of 80 products available across the India showcase/,
  );
  assert.match(html, /Home Appliances/);
  assert.match(html, /Personal Care/);
  assert.match(html, /src="\/products\/samsung-galaxy-s26-ultra\.jpg"/);
  assert.doesNotMatch(html, /\/_vinext\/image\?/);
  assert.doesNotMatch(html, /Your site is taking shape|starter-preview/i);
});

test("catalog contains 80 India-market products across ten categories", async () => {
  const catalog = await readFile(
    new URL("../app/catalog.ts", import.meta.url),
    "utf8",
  );
  const categoryGroups = catalog.match(/\.\.\.makeProducts\(/g) ?? [];
  const productSeeds = catalog.match(/^\s+\["/gm) ?? [];

  assert.equal(categoryGroups.length, 10);
  assert.equal(productSeeds.length, 80);
  assert.match(catalog, /Samsung Galaxy S26 Ultra/);
  assert.match(catalog, /Sony WH-1000XM5/);
  assert.match(catalog, /Prestige PIC 20 Induction Cooktop/);
  assert.match(catalog, /Mokobara Transit Backpack/);
  assert.match(catalog, /Made for India|Indian brand/);
  assert.match(catalog, /\/products\/\$\{productSlug\(name\)\}\.jpg/);
});

test("ships one unique local product image for every catalogue item", async () => {
  const imageRoot = new URL("../public/products/", import.meta.url);
  const files = (await readdir(imageRoot)).filter((file) =>
    file.endsWith(".jpg"),
  );
  const hashes = await Promise.all(
    files.map(async (file) => {
      const bytes = await readFile(new URL(file, imageRoot));
      return createHash("sha256").update(bytes).digest("hex");
    }),
  );

  assert.equal(files.length, 80);
  assert.equal(new Set(hashes).size, 80);
});

test("every storefront button is wired to an action", async () => {
  const files = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/PremiumProductPage.tsx", import.meta.url), "utf8"),
  ]);
  const buttonTags = files.join("\n").match(/<button\b[^>]*>/g) ?? [];
  const inertButtons = buttonTags.filter(
    (tag) => !/\bonClick=/.test(tag) && !/\btype=["']submit["']/.test(tag),
  );

  assert.ok(buttonTags.length > 40);
  assert.deepEqual(inertButtons, []);
});

test("hosted checkout uses same-origin identity and protected payment routes", async () => {
  const page = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );
  const schema = await readFile(
    new URL("../db/schema.ts", import.meta.url),
    "utf8",
  );

  assert.match(page, /fetch\("\/api\/site\/session"/);
  assert.match(page, /fetch\("\/api\/site\/orders"/);
  assert.match(page, /fetch\("\/api\/site\/payment-proof"/);
  assert.doesNotMatch(page, /api\/auth\/login|Bearer \$\{auth\.token\}/);
  assert.match(schema, /sqliteTable\(\s*"orders"/);
  assert.match(schema, /sqliteTable\(\s*"manual_upi_payments"/);
  assert.match(schema, /sqliteTable\(\s*"order_history"/);
});

test("iPhone 16 uses real colour-specific media and server-authoritative variants", async () => {
  const details = await readFile(
    new URL("../app/product-details.ts", import.meta.url),
    "utf8",
  );
  const page = await readFile(
    new URL("../app/PremiumProductPage.tsx", import.meta.url),
    "utf8",
  );
  const orderRoute = await readFile(
    new URL("../app/api/site/orders/route.ts", import.meta.url),
    "utf8",
  );
  const imageRoot = new URL("../public/products/iphone-16/", import.meta.url);
  const images = await readdir(imageRoot);
  const hashes = await Promise.all(
    images.map(async (file) => {
      const bytes = await readFile(new URL(file, imageRoot));
      return createHash("sha256").update(bytes).digest("hex");
    }),
  );

  assert.equal((details.match(/skuCode: "[A-Z]+"/g) ?? []).length, 5);
  assert.match(details, /Ultramarine/);
  assert.match(details, /Teal/);
  assert.match(details, /Pink/);
  assert.match(details, /White/);
  assert.match(details, /Black/);
  assert.equal(images.length, 27);
  assert.equal(new Set(hashes).size, 27);
  assert.match(page, /frames\.length >= 24/);
  assert.match(page, /Verified 360° media unavailable/);
  assert.match(page, /\/api\/site\/questions/);
  assert.match(orderRoute, /variantSku/);
  assert.match(orderRoute, /resolveConfigurationBySku/);
});

test("catalog persistence covers normalized ecommerce product records", async () => {
  const schema = await readFile(
    new URL("../db/schema.ts", import.meta.url),
    "utf8",
  );
  const requiredTables = [
    "catalog_products",
    "product_variants",
    "product_inventory",
    "product_media",
    "product_specifications",
    "product_offers",
    "product_accessories",
    "product_warranties",
    "product_delivery",
    "product_reviews",
    "product_questions",
    "product_faqs",
  ];

  for (const table of requiredTables) {
    assert.match(schema, new RegExp(`sqliteTable\\(\\s*"${table}"`));
  }
});

test("catalog API upgrades media paths and provides indexed server pagination", async () => {
  const page = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );
  const route = await readFile(
    new URL("../app/api/site/catalog/route.ts", import.meta.url),
    "utf8",
  );
  const migration = await readFile(
    new URL("../drizzle/0002_fix_catalog_media_paths.sql", import.meta.url),
    "utf8",
  );

  assert.match(page, /pageSize: "48"/);
  assert.match(page, /loadMoreProducts/);
  assert.match(route, /imageUrl: row\.image_url\.replace/);
  assert.match(route, /s-maxage=120/);
  assert.match(route, /LIMIT \? OFFSET \?/);
  assert.match(migration, /UPDATE `catalog_products`/);
  assert.match(migration, /UPDATE `product_variants`/);
  assert.match(migration, /UPDATE `product_media`/);
});

test("Open Prices migration contains unique factual India grocery listings", async () => {
  const migration = await readFile(
    new URL("../drizzle/0005_open_prices_india_catalog.sql", import.meta.url),
    "utf8",
  );
  const inserts = migration.match(/^INSERT OR IGNORE INTO catalog_products/gm) ?? [];
  const skus = [...migration.matchAll(/'OFF-(\d+)'/g)].map((match) => match[1]);
  const images = [...migration.matchAll(/'(https:\/\/images\.openfoodfacts\.org\/[^']+)'/g)].map(
    (match) => match[1],
  );

  assert.ok(inserts.length >= 200, `expected at least 200 validated listings, found ${inserts.length}`);
  assert.equal(new Set(skus).size, inserts.length);
  assert.equal(new Set(images).size, inserts.length);
  assert.match(migration, /'Grocery'/);
  assert.match(migration, /'OPEN_DATA_VERIFIED'/);
  assert.doesNotMatch(migration, /'OPEN_DATA_VERIFIED', [1-9]\d*, [1-9]\d*/);
});
