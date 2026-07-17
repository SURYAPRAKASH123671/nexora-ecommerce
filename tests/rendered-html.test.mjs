import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
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
  assert.match(html, /A preview of 80 products available across the India showcase/);
  assert.match(html, /Home Appliances/);
  assert.match(html, /Personal Care/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview/i);
});

test("catalog contains 80 India-market products across ten categories", async () => {
  const catalog = await readFile(new URL("../app/catalog.ts", import.meta.url), "utf8");
  const categoryGroups = catalog.match(/\.\.\.makeProducts\(/g) ?? [];
  const productSeeds = catalog.match(/^\s+\["/gm) ?? [];

  assert.equal(categoryGroups.length, 10);
  assert.equal(productSeeds.length, 80);
  assert.match(catalog, /Samsung Galaxy S26 Ultra/);
  assert.match(catalog, /Sony WH-1000XM5/);
  assert.match(catalog, /Prestige PIC 20 Induction Cooktop/);
  assert.match(catalog, /Mokobara Transit Backpack/);
  assert.match(catalog, /Made for India|Indian brand/);
  assert.match(catalog, /\/products\/\$\{productSlug\(name\)\}\.webp/);
});

test("ships one unique local product image for every catalogue item", async () => {
  const imageRoot = new URL("../public/products/", import.meta.url);
  const files = (await readdir(imageRoot)).filter((file) => file.endsWith(".webp"));
  const hashes = await Promise.all(files.map(async (file) => {
    const bytes = await readFile(new URL(file, imageRoot));
    return createHash("sha256").update(bytes).digest("hex");
  }));

  assert.equal(files.length, 80);
  assert.equal(new Set(hashes).size, 80);
});
