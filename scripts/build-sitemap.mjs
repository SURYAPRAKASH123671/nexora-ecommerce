import { readFile, writeFile } from "node:fs/promises";

const base = "https://nexora-commerce-surya.kssuryaprakash2.chatgpt.site";
const source = await readFile(new URL("../app/catalog.ts", import.meta.url), "utf8");
const grocery = JSON.parse(await readFile(new URL("../premium-grocery-source.json", import.meta.url), "utf8"));
const names = [...source.matchAll(/^\s+\["([^"]+)"/gm)].map((match) => match[1]);
const categoryBlock = source.match(/export const categories = \[([\s\S]*?)\];/)?.[1] ?? "";
const categories = [...categoryBlock.matchAll(/"([^"]+)"/g)].map((match) => match[1]).filter((name) => name !== "All");
const slug = (value) => value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const urls = [
  "",
  "shop",
  "help-centre",
  "delivery-returns",
  "contact-us",
  "our-standards",
  "privacy-policy",
  "terms-conditions",
  ...categories.map((name) => `categories/${slug(name)}`),
  ...names.map((name) => `products/${slug(name)}`),
  ...grocery.records.map((product) => `products/${product.productSlug}`),
];
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((path) => `  <url><loc>${base}/${path}</loc></url>`).join("\n")}\n</urlset>\n`;
await writeFile(new URL("../public/sitemap.xml", import.meta.url), xml, "utf8");
console.log(`Generated sitemap with ${urls.length} public URLs.`);
