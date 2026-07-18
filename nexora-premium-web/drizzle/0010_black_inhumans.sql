CREATE TABLE `mobile_model_media` (
	`id` text PRIMARY KEY NOT NULL,
	`model_id` integer NOT NULL,
	`variant_id` text,
	`media_type` text NOT NULL,
	`url` text NOT NULL,
	`alt_text` text NOT NULL,
	`position` integer NOT NULL,
	`source_url` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mobile_model_media_identity_unique` ON `mobile_model_media` (`id`);--> statement-breakpoint
CREATE INDEX `mobile_model_media_model_position_idx` ON `mobile_model_media` (`model_id`,`position`);--> statement-breakpoint
CREATE TABLE `mobile_model_specifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`model_id` integer NOT NULL,
	`group_name` text NOT NULL,
	`spec_key` text NOT NULL,
	`spec_value` text NOT NULL,
	`source_url` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mobile_model_specifications_unique` ON `mobile_model_specifications` (`model_id`,`group_name`,`spec_key`);--> statement-breakpoint
CREATE INDEX `mobile_model_specifications_model_idx` ON `mobile_model_specifications` (`model_id`);--> statement-breakpoint
CREATE TABLE `mobile_model_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`model_id` integer NOT NULL,
	`sku` text,
	`ram` text,
	`storage` text,
	`colour` text,
	`official_variant_name` text NOT NULL,
	`source_url` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mobile_model_variants_identity_unique` ON `mobile_model_variants` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `mobile_model_variants_sku_unique` ON `mobile_model_variants` (`sku`);--> statement-breakpoint
CREATE INDEX `mobile_model_variants_model_idx` ON `mobile_model_variants` (`model_id`);