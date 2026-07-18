UPDATE `catalog_products`
SET `image_url` = replace(`image_url`, '.webp', '.jpg'),
    `updated_at` = CURRENT_TIMESTAMP
WHERE `image_url` LIKE '/products/%.webp';
--> statement-breakpoint
UPDATE `product_variants`
SET `image_url` = replace(`image_url`, '.webp', '.jpg'),
    `updated_at` = CURRENT_TIMESTAMP
WHERE `image_url` LIKE '/products/%.webp';
--> statement-breakpoint
UPDATE `product_media`
SET `url` = replace(`url`, '.webp', '.jpg')
WHERE `url` LIKE '/products/%.webp';
