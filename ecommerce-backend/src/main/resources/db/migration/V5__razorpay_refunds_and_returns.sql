ALTER TABLE razorpay_payment_attempts
    ADD COLUMN provider_refund_id VARCHAR(80) NULL,
    ADD COLUMN refunded_amount_paise BIGINT NULL,
    ADD CONSTRAINT uk_razorpay_refund_id UNIQUE (provider_refund_id);
