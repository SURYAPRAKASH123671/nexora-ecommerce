import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const orders = sqliteTable(
  "orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderNumber: text("order_number").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerName: text("customer_name").notNull(),
    deliveryJson: text("delivery_json").notNull(),
    itemsJson: text("items_json").notNull(),
    paymentMethod: text("payment_method").notNull(),
    paymentStatus: text("payment_status").notNull(),
    orderStatus: text("order_status").notNull(),
    subtotalPaise: integer("subtotal_paise").notNull(),
    shippingPaise: integer("shipping_paise").notNull(),
    totalPaise: integer("total_paise").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("orders_number_unique").on(table.orderNumber),
    index("orders_customer_created_idx").on(
      table.customerEmail,
      table.createdAt,
    ),
    index("orders_status_idx").on(table.orderStatus),
  ],
);

export const manualUpiPayments = sqliteTable(
  "manual_upi_payments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderNumber: text("order_number").notNull(),
    customerEmail: text("customer_email").notNull(),
    merchantUpiId: text("merchant_upi_id").notNull(),
    amountPaise: integer("amount_paise").notNull(),
    payerReference: text("payer_reference"),
    proofStorageKey: text("proof_storage_key").notNull(),
    proofOriginalName: text("proof_original_name").notNull(),
    proofContentType: text("proof_content_type").notNull(),
    proofSize: integer("proof_size").notNull(),
    proofSha256: text("proof_sha256").notNull(),
    reviewStatus: text("review_status").notNull(),
    submittedAt: text("submitted_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    reviewedAt: text("reviewed_at"),
    reviewedBy: text("reviewed_by"),
    reviewerNote: text("reviewer_note"),
  },
  (table) => [
    uniqueIndex("manual_upi_order_unique").on(table.orderNumber),
    index("manual_upi_review_submitted_idx").on(
      table.reviewStatus,
      table.submittedAt,
    ),
  ],
);

export const orderHistory = sqliteTable(
  "order_history",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderNumber: text("order_number").notNull(),
    eventType: text("event_type").notNull(),
    fromValue: text("from_value").notNull(),
    toValue: text("to_value").notNull(),
    actorEmail: text("actor_email").notNull(),
    note: text("note"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("order_history_order_created_idx").on(
      table.orderNumber,
      table.createdAt,
    ),
  ],
);

export const razorpayPayments = sqliteTable(
  "razorpay_payments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderNumber: text("order_number").notNull(),
    providerOrderId: text("provider_order_id").notNull(),
    providerPaymentId: text("provider_payment_id"),
    providerRefundId: text("provider_refund_id"),
    amountPaise: integer("amount_paise").notNull(),
    refundedAmountPaise: integer("refunded_amount_paise").notNull().default(0),
    currency: text("currency").notNull().default("INR"),
    status: text("status").notNull(),
    failureCode: text("failure_code"),
    failureDescription: text("failure_description"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("razorpay_payments_order_unique").on(table.orderNumber),
    uniqueIndex("razorpay_payments_provider_order_unique").on(
      table.providerOrderId,
    ),
    index("razorpay_payments_provider_payment_idx").on(
      table.providerPaymentId,
    ),
    index("razorpay_payments_status_idx").on(table.status),
  ],
);

export const catalogProducts = sqliteTable(
  "catalog_products",
  {
    id: integer("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    sku: text("sku"),
    brand: text("brand").notNull(),
    model: text("model").notNull(),
    launchYear: integer("launch_year"),
    officialDescription: text("official_description").notNull(),
    categoryName: text("category_name").notNull(),
    subcategoryName: text("subcategory_name").notNull().default("General"),
    pricePaise: integer("price_paise").notNull(),
    previousPricePaise: integer("previous_price_paise"),
    stockQuantity: integer("stock_quantity").notNull(),
    imageUrl: text("image_url").notNull(),
    sourceUrl: text("source_url"),
    verificationStatus: text("verification_status").notNull(),
    ratingTenths: integer("rating_tenths").notNull().default(0),
    reviewCount: integer("review_count").notNull().default(0),
    colour: text("colour"),
    size: text("size"),
    discountPercent: integer("discount_percent").notNull().default(0),
    newArrival: integer("new_arrival", { mode: "boolean" }).notNull().default(false),
    bestSeller: integer("best_seller", { mode: "boolean" }).notNull().default(false),
    warrantyText: text("warranty_text").notNull().default("Manufacturer warranty where applicable"),
    shippingText: text("shipping_text").notNull().default("Delivery across India"),
    returnPolicyText: text("return_policy_text").notNull().default("7 day return policy subject to eligibility"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("catalog_products_slug_unique").on(table.slug),
    uniqueIndex("catalog_products_sku_unique").on(table.sku),
    index("catalog_products_category_idx").on(table.categoryName),
    index("catalog_products_brand_idx").on(table.brand),
    index("catalog_products_subcategory_idx").on(table.subcategoryName),
    index("catalog_products_price_idx").on(table.pricePaise),
    index("catalog_products_rating_idx").on(table.ratingTenths),
    index("catalog_products_availability_idx").on(table.stockQuantity),
    index("catalog_products_merchandising_idx").on(
      table.newArrival,
      table.bestSeller,
    ),
  ],
);

export const mobileBrands = sqliteTable(
  "mobile_brands",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    officialUrl: text("official_url").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("mobile_brands_name_unique").on(table.name),
    uniqueIndex("mobile_brands_slug_unique").on(table.slug),
  ],
);

export const mobileSeries = sqliteTable(
  "mobile_series",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    brandId: integer("brand_id").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    officialUrl: text("official_url"),
  },
  (table) => [
    uniqueIndex("mobile_series_brand_slug_unique").on(table.brandId, table.slug),
    index("mobile_series_brand_idx").on(table.brandId),
  ],
);

export const mobileModels = sqliteTable(
  "mobile_models",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    brandId: integer("brand_id").notNull(),
    seriesId: integer("series_id"),
    externalId: text("external_id").notNull(),
    officialName: text("official_name").notNull(),
    slug: text("slug").notNull(),
    launchDate: text("launch_date"),
    indiaAvailability: text("india_availability").notNull(),
    availabilitySourceUrl: text("availability_source_url").notNull(),
    specificationSourceUrl: text("specification_source_url").notNull(),
    mediaSourceUrl: text("media_source_url"),
    verificationStatus: text("verification_status").notNull().default("VERIFIED_REGISTRY"),
    publishStatus: text("publish_status").notNull().default("DRAFT"),
    verifiedAt: text("verified_at").notNull(),
    catalogProductId: integer("catalog_product_id"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("mobile_models_external_unique").on(table.externalId),
    uniqueIndex("mobile_models_slug_unique").on(table.slug),
    index("mobile_models_brand_series_idx").on(table.brandId, table.seriesId),
    index("mobile_models_launch_date_idx").on(table.launchDate),
    index("mobile_models_publish_idx").on(table.publishStatus),
  ],
);

export const mobileModelVariants = sqliteTable(
  "mobile_model_variants",
  {
    id: text("id").primaryKey(),
    modelId: integer("model_id").notNull(),
    sku: text("sku"),
    ram: text("ram"),
    storage: text("storage"),
    colour: text("colour"),
    officialVariantName: text("official_variant_name").notNull(),
    sourceUrl: text("source_url").notNull(),
  },
  (table) => [
    uniqueIndex("mobile_model_variants_identity_unique").on(table.id),
    uniqueIndex("mobile_model_variants_sku_unique").on(table.sku),
    index("mobile_model_variants_model_idx").on(table.modelId),
  ],
);

export const mobileModelSpecifications = sqliteTable(
  "mobile_model_specifications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    modelId: integer("model_id").notNull(),
    groupName: text("group_name").notNull(),
    specKey: text("spec_key").notNull(),
    specValue: text("spec_value").notNull(),
    sourceUrl: text("source_url").notNull(),
  },
  (table) => [
    uniqueIndex("mobile_model_specifications_unique").on(table.modelId, table.groupName, table.specKey),
    index("mobile_model_specifications_model_idx").on(table.modelId),
  ],
);

export const mobileModelMedia = sqliteTable(
  "mobile_model_media",
  {
    id: text("id").primaryKey(),
    modelId: integer("model_id").notNull(),
    variantId: text("variant_id"),
    mediaType: text("media_type").notNull(),
    url: text("url").notNull(),
    altText: text("alt_text").notNull(),
    position: integer("position").notNull(),
    sourceUrl: text("source_url").notNull(),
  },
  (table) => [
    uniqueIndex("mobile_model_media_identity_unique").on(table.id),
    index("mobile_model_media_model_position_idx").on(table.modelId, table.position),
  ],
);

export const mobileImportJobs = sqliteTable(
  "mobile_import_jobs",
  {
    id: text("id").primaryKey(),
    actorEmail: text("actor_email").notNull(),
    fileName: text("file_name").notNull(),
    format: text("format").notNull(),
    status: text("status").notNull(),
    totalRows: integer("total_rows").notNull().default(0),
    insertedRows: integer("inserted_rows").notNull().default(0),
    updatedRows: integer("updated_rows").notNull().default(0),
    rejectedRows: integer("rejected_rows").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    completedAt: text("completed_at"),
  },
  (table) => [index("mobile_import_jobs_created_idx").on(table.createdAt)],
);

export const mobileImportErrors = sqliteTable(
  "mobile_import_errors",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    jobId: text("job_id").notNull(),
    rowNumber: integer("row_number").notNull(),
    fieldName: text("field_name"),
    errorCode: text("error_code").notNull(),
    message: text("message").notNull(),
    rawRecordJson: text("raw_record_json").notNull(),
  },
  (table) => [index("mobile_import_errors_job_idx").on(table.jobId)],
);

export const productVariants = sqliteTable(
  "product_variants",
  {
    id: text("id").primaryKey(),
    productId: integer("product_id").notNull(),
    sku: text("sku").notNull(),
    variantName: text("variant_name").notNull(),
    colour: text("colour"),
    storage: text("storage"),
    pricePaise: integer("price_paise").notNull(),
    previousPricePaise: integer("previous_price_paise"),
    stockQuantity: integer("stock_quantity").notNull(),
    imageUrl: text("image_url").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("product_variants_sku_unique").on(table.sku),
    index("product_variants_product_idx").on(table.productId),
  ],
);

export const productInventory = sqliteTable(
  "product_inventory",
  {
    variantSku: text("variant_sku").primaryKey(),
    availableQuantity: integer("available_quantity").notNull(),
    reservedQuantity: integer("reserved_quantity").notNull().default(0),
    reorderLevel: integer("reorder_level").notNull().default(2),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("product_inventory_available_idx").on(table.availableQuantity),
  ],
);

export const productMedia = sqliteTable(
  "product_media",
  {
    id: text("id").primaryKey(),
    productId: integer("product_id").notNull(),
    variantSku: text("variant_sku"),
    position: integer("position").notNull(),
    mediaType: text("media_type").notNull(),
    url: text("url").notNull(),
    altText: text("alt_text").notNull(),
    label: text("label").notNull(),
    sourceUrl: text("source_url"),
  },
  (table) => [
    index("product_media_product_position_idx").on(
      table.productId,
      table.position,
    ),
    index("product_media_variant_idx").on(table.variantSku),
  ],
);

export const productSpecifications = sqliteTable(
  "product_specifications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id").notNull(),
    groupName: text("group_name").notNull(),
    specKey: text("spec_key").notNull(),
    specValue: text("spec_value").notNull(),
    position: integer("position").notNull(),
    sourceUrl: text("source_url"),
  },
  (table) => [
    uniqueIndex("product_specifications_unique").on(
      table.productId,
      table.groupName,
      table.specKey,
    ),
    index("product_specifications_product_idx").on(table.productId),
  ],
);

export const productOffers = sqliteTable(
  "product_offers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    offerType: text("offer_type").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    validFrom: text("valid_from"),
    validUntil: text("valid_until"),
  },
  (table) => [
    index("product_offers_product_active_idx").on(
      table.productId,
      table.active,
    ),
  ],
);

export const productAccessories = sqliteTable(
  "product_accessories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id").notNull(),
    name: text("name").notNull(),
    compatibleModel: text("compatible_model").notNull(),
  },
  (table) => [index("product_accessories_product_idx").on(table.productId)],
);

export const productWarranties = sqliteTable("product_warranties", {
  productId: integer("product_id").primaryKey(),
  manufacturerWarranty: text("manufacturer_warranty").notNull(),
  serviceInformation: text("service_information").notNull(),
  returnPolicy: text("return_policy").notNull(),
  countryOfOrigin: text("country_of_origin").notNull(),
  gtinInformation: text("gtin_information").notNull(),
});

export const productDelivery = sqliteTable("product_delivery", {
  productId: integer("product_id").primaryKey(),
  minimumDays: integer("minimum_days").notNull(),
  maximumDays: integer("maximum_days").notNull(),
  serviceableCountry: text("serviceable_country").notNull(),
  freeShippingThresholdPaise: integer(
    "free_shipping_threshold_paise",
  ).notNull(),
});

export const productReviews = sqliteTable(
  "product_reviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id").notNull(),
    orderNumber: text("order_number").notNull(),
    customerEmail: text("customer_email").notNull(),
    rating: integer("rating").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    moderationStatus: text("moderation_status").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("product_reviews_order_product_unique").on(
      table.orderNumber,
      table.productId,
    ),
    index("product_reviews_product_status_idx").on(
      table.productId,
      table.moderationStatus,
    ),
  ],
);

export const productQuestions = sqliteTable(
  "product_questions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id").notNull(),
    customerEmail: text("customer_email").notNull(),
    question: text("question").notNull(),
    answer: text("answer"),
    answeredBy: text("answered_by"),
    status: text("status").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    answeredAt: text("answered_at"),
  },
  (table) => [
    index("product_questions_product_status_idx").on(
      table.productId,
      table.status,
    ),
  ],
);

export const productFaqs = sqliteTable(
  "product_faqs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id").notNull(),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    position: integer("position").notNull(),
    sourceUrl: text("source_url"),
  },
  (table) => [
    uniqueIndex("product_faqs_unique").on(table.productId, table.question),
    index("product_faqs_product_position_idx").on(
      table.productId,
      table.position,
    ),
  ],
);
