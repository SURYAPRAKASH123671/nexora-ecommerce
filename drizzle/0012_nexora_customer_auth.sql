CREATE TABLE `customer_accounts` (
  `email` text PRIMARY KEY NOT NULL,
  `display_name` text NOT NULL,
  `password_hash` text NOT NULL,
  `password_salt` text NOT NULL,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `customer_sessions` (
  `token_hash` text PRIMARY KEY NOT NULL,
  `customer_email` text NOT NULL,
  `expires_at` text NOT NULL,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `customer_sessions_email_idx` ON `customer_sessions` (`customer_email`);
--> statement-breakpoint
CREATE INDEX `customer_sessions_expiry_idx` ON `customer_sessions` (`expires_at`);
