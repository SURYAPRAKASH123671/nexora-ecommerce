CREATE TABLE `order_notifications` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `order_number` text NOT NULL,
  `event_type` text NOT NULL,
  `recipient_email` text NOT NULL,
  `status` text DEFAULT 'PENDING' NOT NULL CHECK (`status` IN ('PENDING','SENDING','SENT','FAILED')),
  `attempts` integer DEFAULT 0 NOT NULL,
  `provider_message_id` text,
  `last_error` text,
  `next_attempt_at` text,
  `sent_at` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `order_notifications_event_unique` ON `order_notifications` (`order_number`,`event_type`);
--> statement-breakpoint
CREATE INDEX `order_notifications_retry_idx` ON `order_notifications` (`status`,`next_attempt_at`);
