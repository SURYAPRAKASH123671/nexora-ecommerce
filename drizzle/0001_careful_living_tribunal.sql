CREATE TABLE `catalog_products` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`brand` text NOT NULL,
	`model` text NOT NULL,
	`launch_year` integer,
	`official_description` text NOT NULL,
	`category_name` text NOT NULL,
	`price_paise` integer NOT NULL,
	`previous_price_paise` integer,
	`stock_quantity` integer NOT NULL,
	`image_url` text NOT NULL,
	`source_url` text,
	`verification_status` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `catalog_products_slug_unique` ON `catalog_products` (`slug`);--> statement-breakpoint
CREATE INDEX `catalog_products_category_idx` ON `catalog_products` (`category_name`);--> statement-breakpoint
CREATE INDEX `catalog_products_brand_idx` ON `catalog_products` (`brand`);--> statement-breakpoint
CREATE TABLE `product_accessories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`name` text NOT NULL,
	`compatible_model` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `product_accessories_product_idx` ON `product_accessories` (`product_id`);--> statement-breakpoint
CREATE TABLE `product_delivery` (
	`product_id` integer PRIMARY KEY NOT NULL,
	`minimum_days` integer NOT NULL,
	`maximum_days` integer NOT NULL,
	`serviceable_country` text NOT NULL,
	`free_shipping_threshold_paise` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_faqs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`position` integer NOT NULL,
	`source_url` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_faqs_unique` ON `product_faqs` (`product_id`,`question`);--> statement-breakpoint
CREATE INDEX `product_faqs_product_position_idx` ON `product_faqs` (`product_id`,`position`);--> statement-breakpoint
CREATE TABLE `product_inventory` (
	`variant_sku` text PRIMARY KEY NOT NULL,
	`available_quantity` integer NOT NULL,
	`reserved_quantity` integer DEFAULT 0 NOT NULL,
	`reorder_level` integer DEFAULT 2 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `product_inventory_available_idx` ON `product_inventory` (`available_quantity`);--> statement-breakpoint
CREATE TABLE `product_media` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` integer NOT NULL,
	`variant_sku` text,
	`position` integer NOT NULL,
	`media_type` text NOT NULL,
	`url` text NOT NULL,
	`alt_text` text NOT NULL,
	`label` text NOT NULL,
	`source_url` text
);
--> statement-breakpoint
CREATE INDEX `product_media_product_position_idx` ON `product_media` (`product_id`,`position`);--> statement-breakpoint
CREATE INDEX `product_media_variant_idx` ON `product_media` (`variant_sku`);--> statement-breakpoint
CREATE TABLE `product_offers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`offer_type` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`valid_from` text,
	`valid_until` text
);
--> statement-breakpoint
CREATE INDEX `product_offers_product_active_idx` ON `product_offers` (`product_id`,`active`);--> statement-breakpoint
CREATE TABLE `product_questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`customer_email` text NOT NULL,
	`question` text NOT NULL,
	`answer` text,
	`answered_by` text,
	`status` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`answered_at` text
);
--> statement-breakpoint
CREATE INDEX `product_questions_product_status_idx` ON `product_questions` (`product_id`,`status`);--> statement-breakpoint
CREATE TABLE `product_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`order_number` text NOT NULL,
	`customer_email` text NOT NULL,
	`rating` integer NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`moderation_status` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_reviews_order_product_unique` ON `product_reviews` (`order_number`,`product_id`);--> statement-breakpoint
CREATE INDEX `product_reviews_product_status_idx` ON `product_reviews` (`product_id`,`moderation_status`);--> statement-breakpoint
CREATE TABLE `product_specifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`group_name` text NOT NULL,
	`spec_key` text NOT NULL,
	`spec_value` text NOT NULL,
	`position` integer NOT NULL,
	`source_url` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_specifications_unique` ON `product_specifications` (`product_id`,`group_name`,`spec_key`);--> statement-breakpoint
CREATE INDEX `product_specifications_product_idx` ON `product_specifications` (`product_id`);--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` integer NOT NULL,
	`sku` text NOT NULL,
	`variant_name` text NOT NULL,
	`colour` text,
	`storage` text,
	`price_paise` integer NOT NULL,
	`previous_price_paise` integer,
	`stock_quantity` integer NOT NULL,
	`image_url` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_variants_sku_unique` ON `product_variants` (`sku`);--> statement-breakpoint
CREATE INDEX `product_variants_product_idx` ON `product_variants` (`product_id`);--> statement-breakpoint
CREATE TABLE `product_warranties` (
	`product_id` integer PRIMARY KEY NOT NULL,
	`manufacturer_warranty` text NOT NULL,
	`service_information` text NOT NULL,
	`return_policy` text NOT NULL,
	`country_of_origin` text NOT NULL,
	`gtin_information` text NOT NULL
);
