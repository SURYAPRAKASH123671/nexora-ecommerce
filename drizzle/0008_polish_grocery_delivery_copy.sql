UPDATE catalog_products
SET shipping_text = 'Free standard delivery · estimated arrival shown after PIN-code check',
    updated_at = CURRENT_TIMESTAMP
WHERE category_name = 'Grocery';
