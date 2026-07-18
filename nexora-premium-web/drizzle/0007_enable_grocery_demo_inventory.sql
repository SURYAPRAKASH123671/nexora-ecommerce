UPDATE catalog_products
SET stock_quantity = 12 + (id % 24),
    shipping_text = 'Portfolio demo inventory — estimated delivery shown at checkout',
    updated_at = CURRENT_TIMESTAMP
WHERE category_name = 'Grocery';
