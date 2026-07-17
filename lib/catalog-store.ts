import { fallbackProducts } from "@/app/catalog";
import { iphone16Profile, resolveConfiguration } from "@/app/product-details";

type D1Statement = ReturnType<D1Database["prepare"]>;

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function batchInChunks(DB: D1Database, statements: D1Statement[]) {
  for (let index = 0; index < statements.length; index += 60) {
    await DB.batch(statements.slice(index, index + 60));
  }
}

export async function ensureCatalogSeeded(DB: D1Database): Promise<void> {
  const count = await DB.prepare(
    "SELECT COUNT(*) AS total FROM catalog_products",
  ).first<{ total: number }>();
  if (Number(count?.total ?? 0) >= fallbackProducts.length) return;

  const now = new Date().toISOString();
  const productStatements = fallbackProducts.map((product) => {
    const profile =
      product.id === iphone16Profile.productId ? iphone16Profile : null;
    const brand = profile?.brand ?? product.name.split(" ")[0];
    return DB.prepare(
      "INSERT OR IGNORE INTO catalog_products (id, name, slug, brand, model, launch_year, official_description, category_name, price_paise, previous_price_paise, stock_quantity, image_url, source_url, verification_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(
      product.id,
      product.name,
      slug(product.name),
      brand,
      profile?.model ?? product.name,
      profile?.launchYear ?? null,
      profile?.officialDescription ?? product.description,
      product.categoryName,
      Math.round(product.price * 100),
      product.previousPrice ? Math.round(product.previousPrice * 100) : null,
      product.stockQuantity,
      product.imageUrl,
      profile?.sourceUrl ?? null,
      profile ? "MANUFACTURER_VERIFIED" : "BASIC_LISTING",
      now,
      now,
    );
  });
  await batchInChunks(DB, productStatements);

  const iphone = fallbackProducts.find(
    (product) => product.id === iphone16Profile.productId,
  );
  if (!iphone) return;

  const detailStatements: D1Statement[] = [];
  for (const colour of iphone16Profile.colours) {
    for (const storage of iphone16Profile.storage) {
      const configuration = resolveConfiguration(iphone, colour.id, storage.id);
      detailStatements.push(
        DB.prepare(
          "INSERT OR IGNORE INTO product_variants (id, product_id, sku, variant_name, colour, storage, price_paise, previous_price_paise, stock_quantity, image_url, active, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ).bind(
          configuration.sku,
          iphone.id,
          configuration.sku,
          configuration.variantName,
          configuration.colour,
          configuration.storage,
          Math.round(configuration.price * 100),
          configuration.previousPrice
            ? Math.round(configuration.previousPrice * 100)
            : null,
          configuration.stockQuantity,
          configuration.imageUrl,
          configuration.stockQuantity > 0 ? 1 : 0,
          now,
        ),
        DB.prepare(
          "INSERT OR IGNORE INTO product_inventory (variant_sku, available_quantity, reserved_quantity, reorder_level, updated_at) VALUES (?, ?, 0, 2, ?)",
        ).bind(configuration.sku, configuration.stockQuantity, now),
      );
      colour.media.forEach((media, position) => {
        detailStatements.push(
          DB.prepare(
            "INSERT OR IGNORE INTO product_media (id, product_id, variant_sku, position, media_type, url, alt_text, label, source_url) VALUES (?, ?, ?, ?, 'IMAGE', ?, ?, ?, ?)",
          ).bind(
            `${configuration.sku}-${position + 1}`,
            iphone.id,
            configuration.sku,
            position + 1,
            media.src,
            media.alt,
            media.label,
            iphone16Profile.sourceUrl,
          ),
        );
      });
    }
  }

  let specificationPosition = 0;
  for (const group of iphone16Profile.specifications) {
    for (const item of group.items) {
      specificationPosition += 1;
      detailStatements.push(
        DB.prepare(
          "INSERT OR IGNORE INTO product_specifications (product_id, group_name, spec_key, spec_value, position, source_url) VALUES (?, ?, ?, ?, ?, ?)",
        ).bind(
          iphone.id,
          group.name,
          item.label,
          item.value,
          specificationPosition,
          iphone16Profile.sourceUrl,
        ),
      );
    }
  }

  iphone16Profile.accessories.forEach((accessory) => {
    detailStatements.push(
      DB.prepare(
        "INSERT INTO product_accessories (product_id, name, compatible_model) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM product_accessories WHERE product_id = ? AND name = ?)",
      ).bind(iphone.id, accessory, iphone16Profile.model, iphone.id, accessory),
    );
  });

  iphone16Profile.faqs.forEach((faq, position) => {
    detailStatements.push(
      DB.prepare(
        "INSERT OR IGNORE INTO product_faqs (product_id, question, answer, position, source_url) VALUES (?, ?, ?, ?, ?)",
      ).bind(
        iphone.id,
        faq.question,
        faq.answer,
        position + 1,
        iphone16Profile.sourceUrl,
      ),
    );
  });

  detailStatements.push(
    DB.prepare(
      "INSERT OR REPLACE INTO product_warranties (product_id, manufacturer_warranty, service_information, return_policy, country_of_origin, gtin_information) VALUES (?, ?, ?, ?, ?, ?)",
    ).bind(
      iphone.id,
      iphone16Profile.warranty,
      iphone16Profile.serviceInformation,
      iphone16Profile.returnPolicy,
      iphone16Profile.countryOfOrigin,
      iphone16Profile.gtin,
    ),
    DB.prepare(
      "INSERT OR REPLACE INTO product_delivery (product_id, minimum_days, maximum_days, serviceable_country, free_shipping_threshold_paise) VALUES (?, 2, 3, 'India', 500000)",
    ).bind(iphone.id),
  );

  await batchInChunks(DB, detailStatements);
}

export type CatalogRow = {
  id: number;
  name: string;
  official_description: string;
  price_paise: number;
  previous_price_paise: number | null;
  stock_quantity: number;
  image_url: string;
  category_name: string;
  verification_status: string;
};
