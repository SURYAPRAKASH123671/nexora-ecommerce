CREATE TABLE `manual_upi_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`customer_email` text NOT NULL,
	`merchant_upi_id` text NOT NULL,
	`amount_paise` integer NOT NULL,
	`payer_reference` text,
	`proof_storage_key` text NOT NULL,
	`proof_original_name` text NOT NULL,
	`proof_content_type` text NOT NULL,
	`proof_size` integer NOT NULL,
	`proof_sha256` text NOT NULL,
	`review_status` text NOT NULL,
	`submitted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`reviewed_at` text,
	`reviewed_by` text,
	`reviewer_note` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `manual_upi_order_unique` ON `manual_upi_payments` (`order_number`);--> statement-breakpoint
CREATE INDEX `manual_upi_review_submitted_idx` ON `manual_upi_payments` (`review_status`,`submitted_at`);--> statement-breakpoint
CREATE TABLE `order_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`event_type` text NOT NULL,
	`from_value` text NOT NULL,
	`to_value` text NOT NULL,
	`actor_email` text NOT NULL,
	`note` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `order_history_order_created_idx` ON `order_history` (`order_number`,`created_at`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`customer_email` text NOT NULL,
	`customer_name` text NOT NULL,
	`delivery_json` text NOT NULL,
	`items_json` text NOT NULL,
	`payment_method` text NOT NULL,
	`payment_status` text NOT NULL,
	`order_status` text NOT NULL,
	`subtotal_paise` integer NOT NULL,
	`shipping_paise` integer NOT NULL,
	`total_paise` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
CREATE INDEX `orders_customer_created_idx` ON `orders` (`customer_email`,`created_at`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`order_status`);