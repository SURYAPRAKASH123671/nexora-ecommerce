import { commerceEnv, errorResponse, HttpError } from "@/lib/site-commerce";
import { ensureCatalogSeeded, type CatalogRow } from "@/lib/catalog-store";

type FacetRow = { value: string; total: number };

export async function GET(request: Request) {
  try {
    const { DB } = commerceEnv();
    await ensureCatalogSeeded(DB);
    const params = new URL(request.url).searchParams;
    const page = positiveInt(params.get("page"), 1, 100000);
    const pageSize = positiveInt(params.get("pageSize"), 24, 48);
    const where: string[] = [];
    const values: Array<string | number> = [];
    const add = (clause: string, ...bindings: Array<string | number>) => {
      where.push(clause);
      values.push(...bindings);
    };
    const search = params.get("q")?.trim().slice(0, 100);
    if (search) {
      const term = `%${search.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
      add(
        "(name LIKE ? ESCAPE '\\' OR brand LIKE ? ESCAPE '\\' OR official_description LIKE ? ESCAPE '\\' OR category_name LIKE ? ESCAPE '\\')",
        term,
        term,
        term,
        term,
      );
    }
    for (const [key, column] of [
      ["category", "category_name"],
      ["brand", "brand"],
      ["colour", "colour"],
      ["size", "size"],
    ] as const) {
      const selected = params.getAll(key).filter(Boolean).slice(0, 20);
      if (selected.length)
        add(`${column} IN (${selected.map(() => "?").join(",")})`, ...selected);
    }
    const minPrice = nonNegativeNumber(params.get("minPrice"));
    const maxPrice = nonNegativeNumber(params.get("maxPrice"));
    const minRating = nonNegativeNumber(params.get("minRating"));
    const minDiscount = nonNegativeNumber(params.get("minDiscount"));
    if (minPrice !== null) add("price_paise >= ?", Math.round(minPrice * 100));
    if (maxPrice !== null) add("price_paise <= ?", Math.round(maxPrice * 100));
    if (minRating !== null) add("rating_tenths >= ?", Math.round(minRating * 10));
    if (minDiscount !== null) add("discount_percent >= ?", Math.round(minDiscount));
    if (params.get("inStock") === "true") add("stock_quantity > 0");
    if (params.get("newArrival") === "true") add("new_arrival = 1");
    if (params.get("bestSeller") === "true") add("best_seller = 1");
    const whereSql = where.length ? ` WHERE ${where.join(" AND ")}` : "";
    const orderBy =
      {
        "price-low": "price_paise ASC, id ASC",
        "price-high": "price_paise DESC, id ASC",
        rating: "rating_tenths DESC, review_count DESC, id ASC",
        newest: "new_arrival DESC, created_at DESC, id DESC",
        discount: "discount_percent DESC, id ASC",
      }[params.get("sort") ?? ""] ??
      "best_seller DESC, rating_tenths DESC, id ASC";
    const count = await DB.prepare(
      `SELECT COUNT(*) AS total FROM catalog_products${whereSql}`,
    )
      .bind(...values)
      .first<{ total: number }>();
    const rows = await DB.prepare(
      `SELECT id, name, brand, official_description, price_paise, previous_price_paise, stock_quantity, image_url, category_name, subcategory_name, verification_status, rating_tenths, review_count, colour, size, discount_percent, new_arrival, best_seller, warranty_text, shipping_text, return_policy_text FROM catalog_products${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    )
      .bind(...values, pageSize, (page - 1) * pageSize)
      .all<CatalogRow>();
    const [categories, brands] = await Promise.all([
      DB.prepare(
        "SELECT category_name AS value, COUNT(*) AS total FROM catalog_products GROUP BY category_name ORDER BY total DESC, value LIMIT 100",
      ).all<FacetRow>(),
      DB.prepare(
        "SELECT brand AS value, COUNT(*) AS total FROM catalog_products GROUP BY brand ORDER BY total DESC, value LIMIT 100",
      ).all<FacetRow>(),
    ]);
    const total = Number(count?.total ?? 0);
    return Response.json(
      {
        items: rows.results.map(toProduct),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
          hasMore: page * pageSize < total,
        },
        facets: { categories: categories.results, brands: brands.results },
      },
      { headers: { "Cache-Control": "public, max-age=30, s-maxage=120" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

function toProduct(row: CatalogRow) {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    description: row.official_description,
    price: row.price_paise / 100,
    previousPrice: row.previous_price_paise
      ? row.previous_price_paise / 100
      : undefined,
    stockQuantity: row.stock_quantity,
    imageUrl: row.image_url.replace(/\.webp$/i, ".jpg"),
    categoryName: row.category_name,
    subcategoryName: row.subcategory_name,
    verificationStatus: row.verification_status,
    rating: row.rating_tenths / 10,
    reviews: row.review_count,
    colour: row.colour ?? undefined,
    size: row.size ?? undefined,
    discount: row.discount_percent,
    newArrival: Boolean(row.new_arrival),
    bestSeller: Boolean(row.best_seller),
    warranty: row.warranty_text,
    shipping: row.shipping_text,
    returnPolicy: row.return_policy_text,
    badge: row.best_seller
      ? "Best seller"
      : row.new_arrival
        ? "New arrival"
        : row.verification_status === "MANUFACTURER_VERIFIED"
          ? "Verified details"
          : undefined,
  };
}

function positiveInt(value: string | null, fallback: number, maximum: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0
    ? Math.min(parsed, maximum)
    : fallback;
}

function nonNegativeNumber(value: string | null) {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0)
    throw new HttpError(400, "Invalid numeric filter.");
  return parsed;
}
