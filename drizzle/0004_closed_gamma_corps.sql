ALTER TABLE `catalog_products` ADD `sku` text;--> statement-breakpoint
ALTER TABLE `catalog_products` ADD `subcategory_name` text DEFAULT 'General' NOT NULL;--> statement-breakpoint
ALTER TABLE `catalog_products` ADD `rating_tenths` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `catalog_products` ADD `review_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `catalog_products` ADD `colour` text;--> statement-breakpoint
ALTER TABLE `catalog_products` ADD `size` text;--> statement-breakpoint
ALTER TABLE `catalog_products` ADD `discount_percent` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `catalog_products` ADD `new_arrival` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `catalog_products` ADD `best_seller` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `catalog_products` ADD `warranty_text` text DEFAULT 'Manufacturer warranty where applicable' NOT NULL;--> statement-breakpoint
ALTER TABLE `catalog_products` ADD `shipping_text` text DEFAULT 'Delivery across India' NOT NULL;--> statement-breakpoint
ALTER TABLE `catalog_products` ADD `return_policy_text` text DEFAULT '7 day return policy subject to eligibility' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `catalog_products_sku_unique` ON `catalog_products` (`sku`);--> statement-breakpoint
CREATE INDEX `catalog_products_subcategory_idx` ON `catalog_products` (`subcategory_name`);--> statement-breakpoint
CREATE INDEX `catalog_products_price_idx` ON `catalog_products` (`price_paise`);--> statement-breakpoint
CREATE INDEX `catalog_products_rating_idx` ON `catalog_products` (`rating_tenths`);--> statement-breakpoint
CREATE INDEX `catalog_products_availability_idx` ON `catalog_products` (`stock_quantity`);--> statement-breakpoint
CREATE INDEX `catalog_products_merchandising_idx` ON `catalog_products` (`new_arrival`,`best_seller`);