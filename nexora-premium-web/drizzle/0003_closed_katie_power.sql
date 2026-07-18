CREATE TABLE `razorpay_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`provider_order_id` text NOT NULL,
	`provider_payment_id` text,
	`provider_refund_id` text,
	`amount_paise` integer NOT NULL,
	`refunded_amount_paise` integer DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'INR' NOT NULL,
	`status` text NOT NULL,
	`failure_code` text,
	`failure_description` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `razorpay_payments_order_unique` ON `razorpay_payments` (`order_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `razorpay_payments_provider_order_unique` ON `razorpay_payments` (`provider_order_id`);--> statement-breakpoint
CREATE INDEX `razorpay_payments_provider_payment_idx` ON `razorpay_payments` (`provider_payment_id`);--> statement-breakpoint
CREATE INDEX `razorpay_payments_status_idx` ON `razorpay_payments` (`status`);