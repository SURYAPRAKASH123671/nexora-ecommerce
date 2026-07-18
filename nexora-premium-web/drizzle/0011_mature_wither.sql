CREATE TABLE `support_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`message_id` text,
	`customer_email` text NOT NULL,
	`object_key` text NOT NULL,
	`original_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`sha256` text NOT NULL,
	`scan_status` text DEFAULT 'PENDING' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `support_attachments_object_unique` ON `support_attachments` (`object_key`);--> statement-breakpoint
CREATE INDEX `support_attachments_conversation_idx` ON `support_attachments` (`conversation_id`);--> statement-breakpoint
CREATE TABLE `support_conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_email` text NOT NULL,
	`customer_name` text NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`intent` text DEFAULT 'GENERAL' NOT NULL,
	`assigned_agent_email` text,
	`summary` text,
	`last_message_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `support_conversations_customer_idx` ON `support_conversations` (`customer_email`,`last_message_at`);--> statement-breakpoint
CREATE INDEX `support_conversations_queue_idx` ON `support_conversations` (`status`,`last_message_at`);--> statement-breakpoint
CREATE INDEX `support_conversations_agent_idx` ON `support_conversations` (`assigned_agent_email`,`status`);--> statement-breakpoint
CREATE TABLE `support_internal_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`agent_email` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `support_internal_notes_conversation_idx` ON `support_internal_notes` (`conversation_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `support_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`sender_role` text NOT NULL,
	`sender_email` text NOT NULL,
	`body` text NOT NULL,
	`message_type` text DEFAULT 'TEXT' NOT NULL,
	`delivery_status` text DEFAULT 'DELIVERED' NOT NULL,
	`read_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `support_messages_conversation_time_idx` ON `support_messages` (`conversation_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `support_messages_unread_idx` ON `support_messages` (`conversation_id`,`sender_role`,`read_at`);--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`customer_email` text NOT NULL,
	`order_number` text,
	`ticket_type` text NOT NULL,
	`priority` text DEFAULT 'NORMAL' NOT NULL,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`subject` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `support_tickets_customer_idx` ON `support_tickets` (`customer_email`,`created_at`);--> statement-breakpoint
CREATE INDEX `support_tickets_queue_idx` ON `support_tickets` (`status`,`priority`,`created_at`);