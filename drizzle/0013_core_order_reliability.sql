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
CREATE TRIGGER `reserve_inventory_guard`
BEFORE INSERT ON `order_inventory_reservations`
WHEN NEW.`status` = 'RESERVED'
BEGIN
  SELECT CASE WHEN COALESCE((
    SELECT `available_quantity` - `reserved_quantity`
    FROM `product_inventory`
    WHERE `variant_sku` = NEW.`variant_sku`
  ), -1) < NEW.`quantity`
  THEN RAISE(ABORT, 'INSUFFICIENT_STOCK') END;
END;
--> statement-breakpoint
CREATE TRIGGER `reserve_inventory_apply`
AFTER INSERT ON `order_inventory_reservations`
WHEN NEW.`status` = 'RESERVED'
BEGIN
  UPDATE `product_inventory`
  SET `reserved_quantity` = `reserved_quantity` + NEW.`quantity`, `updated_at` = CURRENT_TIMESTAMP
  WHERE `variant_sku` = NEW.`variant_sku`;
END;
--> statement-breakpoint
CREATE TRIGGER `consume_reserved_inventory`
AFTER UPDATE OF `status` ON `order_inventory_reservations`
WHEN OLD.`status` = 'RESERVED' AND NEW.`status` = 'CONSUMED'
BEGIN
  UPDATE `product_inventory`
  SET `available_quantity` = `available_quantity` - NEW.`quantity`,
      `reserved_quantity` = `reserved_quantity` - NEW.`quantity`,
      `updated_at` = CURRENT_TIMESTAMP
  WHERE `variant_sku` = NEW.`variant_sku`;
  UPDATE `catalog_products`
  SET `stock_quantity` = MAX(0, `stock_quantity` - NEW.`quantity`), `updated_at` = CURRENT_TIMESTAMP
  WHERE `id` = NEW.`product_id`;
  UPDATE `product_variants`
  SET `stock_quantity` = MAX(0, `stock_quantity` - NEW.`quantity`), `updated_at` = CURRENT_TIMESTAMP
  WHERE `sku` = NEW.`variant_sku`;
END;
--> statement-breakpoint
CREATE TRIGGER `release_reserved_inventory`
AFTER UPDATE OF `status` ON `order_inventory_reservations`
WHEN OLD.`status` = 'RESERVED' AND NEW.`status` = 'RELEASED'
BEGIN
  UPDATE `product_inventory`
  SET `reserved_quantity` = MAX(0, `reserved_quantity` - NEW.`quantity`), `updated_at` = CURRENT_TIMESTAMP
  WHERE `variant_sku` = NEW.`variant_sku`;
END;
--> statement-breakpoint
CREATE TRIGGER `restore_consumed_inventory`
AFTER UPDATE OF `status` ON `order_inventory_reservations`
WHEN OLD.`status` = 'CONSUMED' AND NEW.`status` = 'RELEASED'
BEGIN
  UPDATE `product_inventory`
  SET `available_quantity` = `available_quantity` + NEW.`quantity`, `updated_at` = CURRENT_TIMESTAMP
  WHERE `variant_sku` = NEW.`variant_sku`;
  UPDATE `catalog_products`
  SET `stock_quantity` = `stock_quantity` + NEW.`quantity`, `updated_at` = CURRENT_TIMESTAMP
  WHERE `id` = NEW.`product_id`;
  UPDATE `product_variants`
  SET `stock_quantity` = `stock_quantity` + NEW.`quantity`, `updated_at` = CURRENT_TIMESTAMP
  WHERE `sku` = NEW.`variant_sku`;
END;
--> statement-breakpoint
UPDATE `orders` SET `order_status` = 'PROCESSING' WHERE `order_status` = 'PACKED';
