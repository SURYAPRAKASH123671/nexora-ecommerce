CREATE TABLE `gateway_payments` (
 `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
 `order_number` text NOT NULL,
 `gateway` text NOT NULL,
 `provider_order_id` text NOT NULL,
 `transaction_id` text,
 `amount_paise` integer NOT NULL,
 `currency` text DEFAULT 'INR' NOT NULL,
 `status` text DEFAULT 'PENDING' NOT NULL,
 `payment_time` text,
 `customer_id` text NOT NULL,
 `failure_reason` text,
 `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
 `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE UNIQUE INDEX `gateway_payments_order_gateway_unique` ON `gateway_payments` (`order_number`,`gateway`);
CREATE UNIQUE INDEX `gateway_payments_provider_order_unique` ON `gateway_payments` (`gateway`,`provider_order_id`);
CREATE UNIQUE INDEX `gateway_payments_transaction_unique` ON `gateway_payments` (`gateway`,`transaction_id`);
