import { commerceEnv, errorResponse } from "@/lib/site-commerce";
import { ensureCatalogSeeded, type CatalogRow } from "@/lib/catalog-store";

export async function GET() {
  try {
    const { DB } = commerceEnv();
    await ensureCatalogSeeded(DB);
    const result = await DB.prepare(
      "SELECT id, name, official_description, price_paise, previous_price_paise, stock_quantity, image_url, category_name, verification_status FROM catalog_products ORDER BY id",
    ).all<CatalogRow>();
    return Response.json(
      result.results.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.official_description,
        price: row.price_paise / 100,
        previousPrice: row.previous_price_paise
          ? row.previous_price_paise / 100
          : undefined,
        stockQuantity: row.stock_quantity,
        imageUrl: row.image_url,
        categoryName: row.category_name,
        rating: 0,
        reviews: 0,
        badge:
          row.verification_status === "MANUFACTURER_VERIFIED"
            ? "Verified details"
            : undefined,
      })),
      { headers: { "Cache-Control": "public, max-age=120, s-maxage=600" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
