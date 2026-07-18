CREATE TABLE manual_upi_payments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    merchant_upi_id VARCHAR(120) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payer_reference VARCHAR(40),
    proof_storage_key VARCHAR(500) NOT NULL,
    proof_original_name VARCHAR(255) NOT NULL,
    proof_content_type VARCHAR(80) NOT NULL,
    proof_size BIGINT NOT NULL,
    proof_sha256 VARCHAR(64) NOT NULL,
    review_status VARCHAR(40) NOT NULL,
    submitted_at DATETIME(6) NOT NULL,
    reviewed_at DATETIME(6),
    reviewed_by VARCHAR(180),
    reviewer_note VARCHAR(500),
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uk_manual_upi_payments_order UNIQUE (order_id),
    CONSTRAINT fk_manual_upi_payments_order FOREIGN KEY (order_id) REFERENCES customer_orders (id),
    INDEX idx_manual_upi_review_submitted (review_status, submitted_at)
);

CREATE TABLE order_history (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    from_value VARCHAR(80) NOT NULL,
    to_value VARCHAR(80) NOT NULL,
    actor VARCHAR(180) NOT NULL,
    note VARCHAR(500),
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_order_history_order FOREIGN KEY (order_id) REFERENCES customer_orders (id),
    INDEX idx_order_history_order_created (order_id, created_at)
);
