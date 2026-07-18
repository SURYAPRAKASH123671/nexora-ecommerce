import {
  commerceEnv,
  errorResponse,
  HttpError,
  requireAdmin,
} from "@/lib/site-commerce";

const fields = [
  "sku",
  "name",
  "brand",
  "model",
  "description",
  "category",
  "subcategory",
  "price",
  "previousPrice",
  "stock",
  "imageUrl",
  "sourceUrl",
  "rating",
  "reviewCount",
  "colour",
  "size",
  "newArrival",
  "bestSeller",
  "warranty",
  "shipping",
  "returnPolicy",
] as const;

type ImportRow = Record<(typeof fields)[number], string>;

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const { DB } = commerceEnv();
    const rows = await DB.prepare(
      "SELECT sku, name, brand, model, official_description, category_name, subcategory_name, price_paise, previous_price_paise, stock_quantity, image_url, source_url, rating_tenths, review_count, colour, size, new_arrival, best_seller, warranty_text, shipping_text, return_policy_text FROM catalog_products ORDER BY id",
    ).all<Record<string, string | number | null>>();
    const csv = [
      fields.join(","),
      ...rows.results.map((row) =>
        [
          row.sku,
          row.name,
          row.brand,
          row.model,
          row.official_description,
          row.category_name,
          row.subcategory_name,
          Number(row.price_paise) / 100,
          row.previous_price_paise
            ? Number(row.previous_price_paise) / 100
            : "",
          row.stock_quantity,
          row.image_url,
          row.source_url,
          Number(row.rating_tenths) / 10,
          row.review_count,
          row.colour,
          row.size,
          row.new_arrival,
          row.best_seller,
          row.warranty_text,
          row.shipping_text,
          row.return_policy_text,
        ]
          .map(csvCell)
          .join(","),
      ),
    ].join("\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="nexora-catalog.csv"',
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = requireAdmin(request);
    const text = await request.text();
    if (text.length > 5_000_000) throw new HttpError(413, "Import file is too large.");
    const rows = parseCsv(text);
    if (!rows.length) throw new HttpError(400, "The CSV contains no products.");
    if (rows.length > 2_000)
      throw new HttpError(400, "Import a maximum of 2,000 products per file.");
    const seen = new Set<string>();
    const validated = rows.map((row, index) => validateRow(row, index + 2, seen));
    const { DB } = commerceEnv();
    const maximum = await DB.prepare(
      "SELECT COALESCE(MAX(id), 0) AS maximum FROM catalog_products",
    ).first<{ maximum: number }>();
    const now = new Date().toISOString();
    const statements = validated.map((row, index) =>
      DB.prepare(
        "INSERT INTO catalog_products (id, name, slug, sku, brand, model, official_description, category_name, subcategory_name, price_paise, previous_price_paise, stock_quantity, image_url, source_url, verification_status, rating_tenths, review_count, colour, size, discount_percent, new_arrival, best_seller, warranty_text, shipping_text, return_policy_text, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'IMPORTED_VERIFIED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(sku) DO UPDATE SET name=excluded.name, slug=excluded.slug, brand=excluded.brand, model=excluded.model, official_description=excluded.official_description, category_name=excluded.category_name, subcategory_name=excluded.subcategory_name, price_paise=excluded.price_paise, previous_price_paise=excluded.previous_price_paise, stock_quantity=excluded.stock_quantity, image_url=excluded.image_url, source_url=excluded.source_url, rating_tenths=excluded.rating_tenths, review_count=excluded.review_count, colour=excluded.colour, size=excluded.size, discount_percent=excluded.discount_percent, new_arrival=excluded.new_arrival, best_seller=excluded.best_seller, warranty_text=excluded.warranty_text, shipping_text=excluded.shipping_text, return_policy_text=excluded.return_policy_text, updated_at=excluded.updated_at",
      ).bind(
        Number(maximum?.maximum ?? 0) + index + 1,
        row.name,
        slug(`${row.name}-${row.sku}`),
        row.sku,
        row.brand,
        row.model,
        row.description,
        row.category,
        row.subcategory,
        Math.round(Number(row.price) * 100),
        row.previousPrice ? Math.round(Number(row.previousPrice) * 100) : null,
        Number(row.stock),
        row.imageUrl,
        row.sourceUrl || null,
        Math.round(Number(row.rating || 0) * 10),
        Number(row.reviewCount || 0),
        row.colour || null,
        row.size || null,
        discount(row.price, row.previousPrice),
        truthy(row.newArrival) ? 1 : 0,
        truthy(row.bestSeller) ? 1 : 0,
        row.warranty,
        row.shipping,
        row.returnPolicy,
        now,
        now,
      ),
    );
    for (let offset = 0; offset < statements.length; offset += 50)
      await DB.batch(statements.slice(offset, offset + 50));
    return Response.json({ imported: validated.length, actor: admin.email });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    requireAdmin(request);
    const sku = new URL(request.url).searchParams.get("sku")?.trim();
    if (!sku) throw new HttpError(400, "SKU is required.");
    const { DB } = commerceEnv();
    const result = await DB.prepare("DELETE FROM catalog_products WHERE sku = ?")
      .bind(sku)
      .run();
    if (!result.meta.changes) throw new HttpError(404, "Product SKU not found.");
    return Response.json({ deleted: sku });
  } catch (error) {
    return errorResponse(error);
  }
}

function parseCsv(text: string): ImportRow[] {
  const records: string[][] = [];
  let record: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index <= text.length; index += 1) {
    const character = text[index] ?? "\n";
    if (quoted && character === '"' && text[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (!quoted && character === ",") {
      record.push(cell.trim());
      cell = "";
    } else if (!quoted && (character === "\n" || character === "\r")) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      record.push(cell.trim());
      cell = "";
      if (record.some(Boolean)) records.push(record);
      record = [];
    } else cell += character;
  }
  const header = records.shift()?.map((value) => value.trim()) ?? [];
  for (const required of ["sku", "name", "brand", "description", "category", "price", "stock", "imageUrl"])
    if (!header.includes(required))
      throw new HttpError(400, `Missing required CSV column: ${required}.`);
  return records.map((values) =>
    Object.fromEntries(fields.map((field) => [field, values[header.indexOf(field)] ?? ""])) as ImportRow,
  );
}

function validateRow(row: ImportRow, line: number, seen: Set<string>) {
  row.sku = row.sku.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9._-]{2,63}$/.test(row.sku))
    throw new HttpError(400, `Invalid SKU on line ${line}.`);
  if (seen.has(row.sku)) throw new HttpError(400, `Duplicate SKU ${row.sku}.`);
  seen.add(row.sku);
  for (const field of ["name", "brand", "description", "category", "imageUrl"] as const)
    if (!row[field].trim()) throw new HttpError(400, `Missing ${field} on line ${line}.`);
  if (!Number.isFinite(Number(row.price)) || Number(row.price) <= 0)
    throw new HttpError(400, `Invalid price on line ${line}.`);
  if (!Number.isInteger(Number(row.stock)) || Number(row.stock) < 0)
    throw new HttpError(400, `Invalid stock on line ${line}.`);
  if (!/^https:\/\//.test(row.imageUrl) && !row.imageUrl.startsWith("/products/"))
    throw new HttpError(400, `Invalid image URL on line ${line}.`);
  row.model ||= row.name;
  row.subcategory ||= "General";
  row.warranty ||= "Manufacturer warranty where applicable";
  row.shipping ||= "Delivery across India";
  row.returnPolicy ||= "7 day return policy subject to eligibility";
  return row;
}

function slug(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function discount(price: string, previous: string) {
  const current = Number(price);
  const original = Number(previous);
  return original > current ? Math.round(((original - current) / original) * 100) : 0;
}
function truthy(value: string) {
  return ["1", "true", "yes", "y"].includes(value.trim().toLowerCase());
}
function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
