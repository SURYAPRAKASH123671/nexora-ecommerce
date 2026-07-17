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
