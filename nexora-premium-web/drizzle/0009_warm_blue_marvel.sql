CREATE TABLE `mobile_brands` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`official_url` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mobile_brands_name_unique` ON `mobile_brands` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `mobile_brands_slug_unique` ON `mobile_brands` (`slug`);--> statement-breakpoint
CREATE TABLE `mobile_import_errors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`job_id` text NOT NULL,
	`row_number` integer NOT NULL,
	`field_name` text,
	`error_code` text NOT NULL,
	`message` text NOT NULL,
	`raw_record_json` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `mobile_import_errors_job_idx` ON `mobile_import_errors` (`job_id`);--> statement-breakpoint
CREATE TABLE `mobile_import_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_email` text NOT NULL,
	`file_name` text NOT NULL,
	`format` text NOT NULL,
	`status` text NOT NULL,
	`total_rows` integer DEFAULT 0 NOT NULL,
	`inserted_rows` integer DEFAULT 0 NOT NULL,
	`updated_rows` integer DEFAULT 0 NOT NULL,
	`rejected_rows` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` text
);
--> statement-breakpoint
CREATE INDEX `mobile_import_jobs_created_idx` ON `mobile_import_jobs` (`created_at`);--> statement-breakpoint
CREATE TABLE `mobile_models` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`brand_id` integer NOT NULL,
	`series_id` integer,
	`external_id` text NOT NULL,
	`official_name` text NOT NULL,
	`slug` text NOT NULL,
	`launch_date` text,
	`india_availability` text NOT NULL,
	`availability_source_url` text NOT NULL,
	`specification_source_url` text NOT NULL,
	`media_source_url` text,
	`verification_status` text DEFAULT 'VERIFIED_REGISTRY' NOT NULL,
	`publish_status` text DEFAULT 'DRAFT' NOT NULL,
	`verified_at` text NOT NULL,
	`catalog_product_id` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mobile_models_external_unique` ON `mobile_models` (`external_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `mobile_models_slug_unique` ON `mobile_models` (`slug`);--> statement-breakpoint
CREATE INDEX `mobile_models_brand_series_idx` ON `mobile_models` (`brand_id`,`series_id`);--> statement-breakpoint
CREATE INDEX `mobile_models_launch_date_idx` ON `mobile_models` (`launch_date`);--> statement-breakpoint
CREATE INDEX `mobile_models_publish_idx` ON `mobile_models` (`publish_status`);--> statement-breakpoint
CREATE TABLE `mobile_series` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`brand_id` integer NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`official_url` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mobile_series_brand_slug_unique` ON `mobile_series` (`brand_id`,`slug`);--> statement-breakpoint
CREATE INDEX `mobile_series_brand_idx` ON `mobile_series` (`brand_id`);