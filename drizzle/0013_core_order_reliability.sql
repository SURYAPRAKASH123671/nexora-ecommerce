ALTER TABLE `orders` ADD `idempotency_key` text;
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_customer_idempotency_unique` ON `orders` (`customer_email`,`idempotency_key`);
--> statement-breakpoint
CREATE TABLE `order_inventory_reservations` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `order_number` text NOT NULL,
  `product_id` integer NOT NULL,
  `variant_sku` text NOT NULL,
  `quantity` integer NOT NULL CHECK (`quantity` > 0),
  `status` text NOT NULL CHECK (`status` IN ('RESERVED','CONSUMED','RELEASED')),
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `order_inventory_order_sku_unique` ON `order_inventory_reservations` (`order_number`,`variant_sku`);
--> statement-breakpoint
CREATE INDEX `order_inventory_status_idx` ON `order_inventory_reservations` (`status`);
--> statement-breakpoint
INSERT OR IGNORE INTO `product_inventory` (`variant_sku`,`available_quantity`,`reserved_quantity`,`reorder_level`,`updated_at`)
SELECT 'NXR-' || `id`, `stock_quantity`, 0, 2, CURRENT_TIMESTAMP FROM `catalog_products`;
--> statement-breakpoint
UPDATE `orders` SET `order_status` = 'PROCESSING' WHERE `order_status` = 'PACKED';
