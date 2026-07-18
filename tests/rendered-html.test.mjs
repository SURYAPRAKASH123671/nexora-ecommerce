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

test("premium grocery catalogue uses unique factual records and 1200px local media", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../premium-grocery-source.json", import.meta.url), "utf8"),
  );
  const migration = await readFile(
    new URL("../drizzle/0006_premium_grocery_catalog.sql", import.meta.url),
    "utf8",
  );
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const normalizer = await readFile(new URL("../scripts/normalize-grocery-images.py", import.meta.url), "utf8");

  assert.equal(manifest.records.length, 64);
  assert.equal(new Set(manifest.records.map((item) => item.sourceId)).size, 64);
  assert.equal(new Set(manifest.records.map((item) => item.imagePath)).size, 64);
  assert.equal(new Set(manifest.records.map((item) => item.brand)).size, 33);
  assert.match(migration, /DELETE FROM catalog_products WHERE category_name = 'Grocery'/);
  assert.equal((migration.match(/^INSERT INTO catalog_products/gm) ?? []).length, 64);
  assert.doesNotMatch(migration, /'RETAILER_CATALOG_VERIFIED', [^,]+, [^,]+, '[^']+', [^,]+, [^,]+, [^,]+, [^,]+, [1-9]\d*,/);
  assert.match(page, /grocery-card/);
  assert.match(page, /Check availability/);
  assert.match(normalizer, /convert\("RGBA"\)/);
  assert.match(normalizer, /Image\.alpha_composite\(white, rgba\)/);

  for (const item of manifest.records) {
    const image = await readFile(
      new URL(`../public${item.imagePath}`, import.meta.url),
    );
    const dimensions = jpegDimensions(image);
    assert.deepEqual(dimensions, { width: 1200, height: 1200 }, item.imagePath);
  }
});

test("grocery homepage provides enterprise merchandising collections", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  for (const section of [
    "Trending today",
    "Today's deals",
    "New arrivals",
    "Best sellers",
    "Daily essentials",
    "Popular brands",
    "Recommended for you",
    "Continue shopping",
    "Frequently bought together",
    "Customers also bought",
    "Top rated products",
  ]) assert.match(page, new RegExp(section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(page, /grocery-marketplace-grid/);
});

test("portfolio grocery inventory enables shopping without presenting supplier stock as live", async () => {
  const migration = await readFile(
    new URL("../drizzle/0007_enable_grocery_demo_inventory.sql", import.meta.url),
    "utf8",
  );
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(migration, /stock_quantity = 12 \+ \(id % 24\)/);
  assert.match(migration, /Portfolio demo inventory/);
  assert.match(migration, /WHERE category_name = 'Grocery'/);
  assert.match(page, /Fast checkout enabled/);
  assert.match(page, /Quick add/);
});

test("grocery delivery copy is premium while retaining final-order confirmation", async () => {
  const migration = await readFile(
    new URL("../drizzle/0008_polish_grocery_delivery_copy.sql", import.meta.url),
    "utf8",
  );
  const product = await readFile(
    new URL("../app/PremiumProductPage.tsx", import.meta.url),
    "utf8",
  );
  assert.match(migration, /Free standard delivery/);
  assert.match(product, /Availability remains subject to final order confirmation/);
});

function jpegDimensions(buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  throw new Error("JPEG dimensions not found");
}

test("public crawler routes and sitemap expose dedicated product and policy pages", async () => {
  const home = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const productRoute = await readFile(new URL("../app/products/[slug]/page.tsx", import.meta.url), "utf8");
  const publicRoute = await readFile(new URL("../app/[route]/page.tsx", import.meta.url), "utf8");
  const robots = await readFile(new URL("../public/robots.txt", import.meta.url), "utf8");
  const sitemap = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");

  assert.match(home, /\/products\/\$\{productSlug\(product\.name\)\}/);
  assert.match(productRoute, /generateMetadata/);
  assert.match(publicRoute, /initialView="information"/);
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Disallow: \/admin/);
  assert.match(sitemap, /\/products\/apple-iphone-16/);
  assert.match(sitemap, /\/products\/amul-pasteurised-butter-104860/);
  assert.match(sitemap, /\/categories\/grocery/);
  assert.equal((sitemap.match(/<url>/g) ?? []).length, 163);
});

test("every product route supports marketplace metadata and grocery deep links", async () => {
  const route = await readFile(
    new URL("../app/products/[slug]/page.tsx", import.meta.url),
    "utf8",
  );
  const page = await readFile(new URL("../app/PremiumProductPage.tsx", import.meta.url), "utf8");
  assert.match(route, /premium-grocery-source\.json/);
  assert.match(route, /groceryProduct/);
  assert.match(route, /initialProduct=\{product\}/);
  for (const feature of [
    "product-breadcrumb",
    "Fullscreen",
    "onPointerMove",
    "Check delivery PIN",
    "Frequently asked",
    "Questions and answers",
    "Customer reviews",
    "Share",
    "Compare",
    "Buy now",
  ]) assert.match(page, new RegExp(feature));
});

test("worker applies production security and private-route crawler headers", async () => {
  const worker = await readFile(new URL("../worker/index.ts", import.meta.url), "utf8");
  assert.match(worker, /X-Content-Type-Options/);
  assert.match(worker, /Strict-Transport-Security/);
  assert.match(worker, /X-Robots-Tag/);
  assert.match(worker, /noindex, nofollow/);
});

test("global polish system covers accessibility, motion and resilient route states", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const polish = await readFile(new URL("../app/polish.css", import.meta.url), "utf8");
  const notFound = await readFile(new URL("../app/not-found.tsx", import.meta.url), "utf8");
  const error = await readFile(new URL("../app/error.tsx", import.meta.url), "utf8");
  const loading = await readFile(new URL("../app/loading.tsx", import.meta.url), "utf8");

  assert.match(layout, /polish\.css/);
  assert.match(polish, /prefers-reduced-motion/);
  assert.match(polish, /focus-visible/);
  assert.match(polish, /touch-action: manipulation/);
  assert.match(polish, /polish-heart/);
  assert.match(polish, /polish-dialog/);
  assert.match(notFound, /Error 404/);
  assert.match(error, /Try again/);
  assert.match(loading, /aria-busy="true"/);
});

test("mobile marketplace is filterable, scalable and governed by verified-source rules", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/api/site/catalog/route.ts", import.meta.url), "utf8");
  const governance = JSON.parse(await readFile(new URL("../mobile-catalog-governance.json", import.meta.url), "utf8"));

  assert.match(page, /MobileMarketplaceToolbar/);
  assert.match(page, /All brands/);
  assert.match(page, /All prices/);
  assert.match(page, /EMI.*from/);
  assert.match(page, /Exchange.*eligibility/);
  assert.match(route, /review_count DESC/);
  assert.match(route, /discount_percent DESC/);
  assert.ok(governance.requiredFields.length >= 15);
  assert.ok(governance.verifiedCollectionSources.every((source) => source.url.startsWith("https://")));
  assert.match(governance.publicationRule, /only after/i);
});

test("smartphone bulk imports preserve source provenance and never fabricate commerce data", async () => {
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/api/site/admin/mobile-import/route.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  for (const table of ["mobile_brands", "mobile_series", "mobile_models", "mobile_model_variants", "mobile_model_specifications", "mobile_model_media", "mobile_import_jobs", "mobile_import_errors"]) assert.match(schema, new RegExp(table));
  assert.match(route, /10_000/);
  assert.match(route, /CSV, XLSX, XLS, and JSON/);
  assert.match(route, /availabilitySourceUrl/);
  assert.match(route, /specificationSourceUrl/);
  assert.match(route, /public HTTPS URL/);
  assert.match(route, /publishStatus.*DRAFT|publish_status.*'DRAFT'/s);
  assert.doesNotMatch(route, /pricePaise|stockQuantity|ratingTenths|reviewCount/);
  assert.match(page, /Validate & import/);
  assert.match(page, /never generated/);
});

test("premium header supports accessible search, navigation and responsive interaction states", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/header-polish.css", import.meta.url), "utf8");
  for (const behavior of ["handleSearchKeyDown", "ArrowDown", "ArrowUp", "Escape", "recentSearches", "trendingSearches", "startVoiceSearch", "aria-activedescendant", "aria-current"]) assert.match(page, new RegExp(behavior));
  for (const icon of ["Store", "UserRound", "Columns3", "ShoppingBag", "Sun", "Moon"]) assert.match(page, new RegExp(`<${icon}`));
  assert.match(styles, /topbar-scrolled/);
  assert.match(styles, /backdrop-filter/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /@media \(max-width: 470px\)/);
  assert.match(styles, /category-strip.*position: sticky/s);
  assert.match(page, /mobile-bottom-nav/);
  assert.match(page, /brand-mark-animated/);
  assert.match(styles, /nexora-logo-arrive/);
  assert.match(styles, /header-actions\[data-active/);
  assert.match(page, /pull-refresh-indicator/);
  assert.match(page, /navigator\.vibrate/);
});

test("premium product gallery supports fluid keyboard and swipe navigation", async () => {
  const productPage = await readFile(new URL("../app/PremiumProductPage.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/premium-product.css", import.meta.url), "utf8");
  for (const behavior of ["showPreviousMedia", "showNextMedia", "finishGallerySwipe", "ArrowLeft", "ArrowRight", "gallery-counter"]) assert.match(productPage, new RegExp(behavior));
  assert.match(styles, /touch-action: pan-y/);
  assert.match(styles, /will-change: transform, opacity/);
});

test("featured hero uses Nexora-owned editorial product controls and motion", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/reference-hero.css", import.meta.url), "utf8");
  for (const control of ["hero-product-nav", "hero-colour-controls", "hero-gallery-controls", "Previous featured electronics product", "Next featured electronics product"]) assert.match(page, new RegExp(control));
  assert.match(page, /animatedHeroCategories/);
  for (const category of ["Phones", "Audio", "Computing", "Wearables", "Cameras", "Gaming"]) assert.match(page, new RegExp(`"${category}"`));
  assert.match(styles, /nexora-product-enter/);
  assert.match(styles, /will-change: transform,opacity/);
  assert.match(styles, /prefers-reduced-motion/);
});

test("Nexora design system and product finder remain original, explainable and factual", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/material-system.css", import.meta.url), "utf8");
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(styles, /--md-primary/);
  assert.match(styles, /--md-surface-container/);
  assert.match(styles, /nexora-guide/);
  assert.match(page, /Nexora Guide/);
  assert.match(page, /Rankings use recorded price and rating data, not generated claims/);
  assert.match(page, /does not invent specifications or availability/);
  assert.match(page, /visual discovery/);
  assert.match(layout, /nexora-web-virid\.vercel\.app/);
  assert.doesNotMatch(`${page}\n${layout}`, /ChatGPT|OpenAI|Gemini|Claude|Copilot|AI-powered|Powered by AI/i);
});

test("support system persists protected conversations, files, tickets and agent handover", async () => {
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  const conversations = await readFile(new URL("../app/api/site/support/conversations/route.ts", import.meta.url), "utf8");
  const messages = await readFile(new URL("../app/api/site/support/messages/route.ts", import.meta.url), "utf8");
  const files = await readFile(new URL("../app/api/site/support/files/route.ts", import.meta.url), "utf8");
  const admin = await readFile(new URL("../app/api/site/admin/support/route.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  for (const table of ["support_conversations", "support_messages", "support_attachments", "support_tickets", "support_internal_notes"]) assert.match(schema, new RegExp(table));
  assert.match(conversations, /requireSiteUser/);
  assert.match(messages, /20/);
  assert.match(messages, /createSupportReply/);
  assert.match(messages, /care@nexora\.support/);
  assert.match(messages, /OTP, UPI PIN, CVV/);
  assert.match(files, /%PDF-/);
  assert.match(files, /PENDING_EXTERNAL_SCAN/);
  assert.match(admin, /requireAdmin/);
  assert.match(admin, /Internal note|support_internal_notes/);
  assert.match(page, /refreshes every few seconds/);
  assert.match(page, /WebSocket presence.*not represented as active/);
  assert.match(page, /English/);
  assert.match(page, /தமிழ்/);
  assert.match(page, /हिन्दी/);
});

test("Nexora uses first-party password authentication without provider redirects", async () => {
  const commerce = await readFile(new URL("../lib/site-commerce.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const signIn = await readFile(new URL("../app/auth/sign-in/route.ts", import.meta.url), "utf8");
  const login = await readFile(new URL("../app/api/site/auth/login/route.ts", import.meta.url), "utf8");
  const register = await readFile(new URL("../app/api/site/auth/register/route.ts", import.meta.url), "utf8");
  const migration = await readFile(new URL("../drizzle/0012_nexora_customer_auth.sql", import.meta.url), "utf8");
  assert.match(commerce, /PBKDF2/);
  assert.match(commerce, /210_000/);
  assert.match(commerce, /HttpOnly; Secure; SameSite=Strict/);
  assert.match(migration, /customer_accounts/);
  assert.match(migration, /customer_sessions/);
  assert.match(page, /api\/site\/auth\/\$\{/);
  assert.match(login, /passwordMatches/);
  assert.match(register, /passwordHash/);
  assert.doesNotMatch(signIn, /signin-with-/);
});
