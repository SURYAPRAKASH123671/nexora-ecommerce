CREATE TABLE app_users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(20),
    profile_picture_url VARCHAR(500),
    email VARCHAR(180) NOT NULL,
    password_hash VARCHAR(120) NOT NULL,
    role VARCHAR(30) NOT NULL,
    email_verified BOOLEAN NOT NULL,
    email_verification_token VARCHAR(96),
    email_verification_expires_at DATETIME(6),
    password_reset_token VARCHAR(96),
    password_reset_expires_at DATETIME(6),
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    last_login_at DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_app_users_email UNIQUE (email)
);

CREATE TABLE categories (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_categories_name UNIQUE (name)
);

CREATE TABLE products (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(160) NOT NULL,
    description VARCHAR(1000),
    price DECIMAL(12,2) NOT NULL,
    stock_quantity INTEGER NOT NULL,
    image_url VARCHAR(500),
    active BOOLEAN NOT NULL,
    created_at DATETIME(6) NOT NULL,
    category_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id),
    INDEX idx_products_active_created (active, created_at),
    INDEX idx_products_category (category_id)
);

CREATE TABLE saved_addresses (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    label VARCHAR(80) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    line1 VARCHAR(220) NOT NULL,
    line2 VARCHAR(220),
    city VARCHAR(90) NOT NULL,
    state VARCHAR(90) NOT NULL,
    pincode VARCHAR(12) NOT NULL,
    default_address BOOLEAN NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES app_users (id),
    INDEX idx_addresses_user (user_id)
);

CREATE TABLE customer_orders (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_number VARCHAR(40) NOT NULL,
    user_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL,
    payment_method VARCHAR(80) NOT NULL,
    payment_status VARCHAR(80) NOT NULL,
    delivery_full_name VARCHAR(120) NOT NULL,
    delivery_email VARCHAR(180) NOT NULL,
    delivery_phone VARCHAR(20) NOT NULL,
    delivery_line1 VARCHAR(220) NOT NULL,
    delivery_line2 VARCHAR(220),
    delivery_city VARCHAR(90) NOT NULL,
    delivery_state VARCHAR(90) NOT NULL,
    delivery_pincode VARCHAR(12) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    gst DECIMAL(12,2) NOT NULL,
    shipping DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    placed_at DATETIME(6) NOT NULL,
    cancelled_at DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_customer_orders_number UNIQUE (order_number),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES app_users (id),
    INDEX idx_orders_user_placed (user_id, placed_at),
    INDEX idx_orders_status (status)
);

CREATE TABLE order_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    product_id BIGINT,
    product_name VARCHAR(180) NOT NULL,
    brand VARCHAR(120),
    variant VARCHAR(120),
    image_url VARCHAR(500),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    line_total DECIMAL(12,2) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES customer_orders (id),
    INDEX idx_order_items_order (order_id),
    INDEX idx_order_items_product (product_id)
);
