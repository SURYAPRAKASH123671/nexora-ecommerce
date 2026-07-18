INSERT INTO mobile_brands (name, slug, official_url) VALUES
('Apple','apple','https://www.apple.com/in/'),
('Google','google','https://store.google.com/in/'),
('Samsung','samsung','https://www.samsung.com/in/')
ON CONFLICT(name) DO UPDATE SET official_url=excluded.official_url, updated_at=CURRENT_TIMESTAMP;
--> statement-breakpoint
INSERT INTO mobile_series (brand_id,name,slug,official_url)
SELECT id,'iPhone 17','iphone-17','https://www.apple.com/in/iphone/' FROM mobile_brands WHERE name='Apple'
UNION ALL SELECT id,'iPhone Air','iphone-air','https://www.apple.com/in/iphone/' FROM mobile_brands WHERE name='Apple'
UNION ALL SELECT id,'iPhone 16','iphone-16','https://www.apple.com/in/iphone/' FROM mobile_brands WHERE name='Apple'
UNION ALL SELECT id,'Pixel 10','pixel-10','https://store.google.com/in/category/phones?hl=en-IN' FROM mobile_brands WHERE name='Google'
UNION ALL SELECT id,'Pixel 9','pixel-9','https://store.google.com/in/category/phones?hl=en-IN' FROM mobile_brands WHERE name='Google'
UNION ALL SELECT id,'Galaxy S','galaxy-s','https://www.samsung.com/in/smartphones/' FROM mobile_brands WHERE name='Samsung'
UNION ALL SELECT id,'Galaxy Z','galaxy-z','https://www.samsung.com/in/smartphones/' FROM mobile_brands WHERE name='Samsung'
ON CONFLICT(brand_id,slug) DO UPDATE SET official_url=excluded.official_url;
--> statement-breakpoint
INSERT INTO mobile_models (brand_id,series_id,external_id,official_name,slug,india_availability,availability_source_url,specification_source_url,media_source_url,verification_status,publish_status,verified_at)
SELECT b.id,s.id,v.external_id,v.official_name,v.slug,v.availability,v.source,v.spec_source,v.source,'VERIFIED_REGISTRY','DRAFT','2026-07-18T00:00:00+05:30'
FROM (
 SELECT 'Apple' brand,'iphone-17' series_slug,'apple-in-iphone-17-pro' external_id,'iPhone 17 Pro' official_name,'apple-iphone-17-pro-registry' slug,'Listed in Apple''s current India iPhone lineup' availability,'https://www.apple.com/in/iphone/' source,'https://www.apple.com/in/iphone/buy/' spec_source
 UNION ALL SELECT 'Apple','iphone-air','apple-in-iphone-air','iPhone Air','apple-iphone-air-registry','Listed in Apple''s current India iPhone lineup','https://www.apple.com/in/iphone/','https://www.apple.com/in/iphone/buy/'
 UNION ALL SELECT 'Apple','iphone-17','apple-in-iphone-17','iPhone 17','apple-iphone-17-registry','Listed in Apple''s current India iPhone lineup','https://www.apple.com/in/iphone/','https://www.apple.com/in/iphone-17/'
 UNION ALL SELECT 'Apple','iphone-17','apple-in-iphone-17e','iPhone 17e','apple-iphone-17e-registry','Listed in Apple''s current India iPhone lineup','https://www.apple.com/in/iphone/','https://www.apple.com/in/iphone/buy/'
 UNION ALL SELECT 'Apple','iphone-16','apple-in-iphone-16','iPhone 16','apple-iphone-16-registry','Listed in Apple''s current India iPhone lineup','https://www.apple.com/in/iphone/','https://www.apple.com/in/iphone/buy/'
 UNION ALL SELECT 'Google','pixel-10','google-in-pixel-10a','Pixel 10a','google-pixel-10a-registry','Listed in the current Google Store India phone collection','https://store.google.com/in/category/phones?hl=en-IN','https://store.google.com/in/category/phones?hl=en-IN'
 UNION ALL SELECT 'Google','pixel-10','google-in-pixel-10-pro','Pixel 10 Pro','google-pixel-10-pro-registry','Listed in the current Google Store India phone collection','https://store.google.com/in/category/phones?hl=en-IN','https://store.google.com/in/category/phones?hl=en-IN'
 UNION ALL SELECT 'Google','pixel-10','google-in-pixel-10-pro-xl','Pixel 10 Pro XL','google-pixel-10-pro-xl-registry','Listed in the current Google Store India phone collection','https://store.google.com/in/category/phones?hl=en-IN','https://store.google.com/in/category/phones?hl=en-IN'
 UNION ALL SELECT 'Google','pixel-10','google-in-pixel-10-pro-fold','Pixel 10 Pro Fold','google-pixel-10-pro-fold-registry','Listed in the current Google Store India phone collection','https://store.google.com/in/category/phones?hl=en-IN','https://store.google.com/in/category/phones?hl=en-IN'
 UNION ALL SELECT 'Google','pixel-10','google-in-pixel-10','Pixel 10','google-pixel-10-registry','Listed in the current Google Store India phone collection','https://store.google.com/in/category/phones?hl=en-IN','https://store.google.com/in/category/phones?hl=en-IN'
 UNION ALL SELECT 'Google','pixel-9','google-in-pixel-9a','Pixel 9a','google-pixel-9a-registry','Listed in the current Google Store India phone collection','https://store.google.com/in/category/phones?hl=en-IN','https://store.google.com/in/category/phones?hl=en-IN'
 UNION ALL SELECT 'Google','pixel-9','google-in-pixel-9-pro','Pixel 9 Pro','google-pixel-9-pro-registry','Listed in the current Google Store India phone collection','https://store.google.com/in/category/phones?hl=en-IN','https://store.google.com/in/category/phones?hl=en-IN'
 UNION ALL SELECT 'Google','pixel-9','google-in-pixel-9-pro-xl','Pixel 9 Pro XL','google-pixel-9-pro-xl-registry','Listed in the current Google Store India phone collection','https://store.google.com/in/category/phones?hl=en-IN','https://store.google.com/in/category/phones?hl=en-IN'
 UNION ALL SELECT 'Google','pixel-9','google-in-pixel-9','Pixel 9','google-pixel-9-registry','Listed in the current Google Store India phone collection','https://store.google.com/in/category/phones?hl=en-IN','https://store.google.com/in/category/phones?hl=en-IN'
 UNION ALL SELECT 'Samsung','galaxy-s','samsung-in-galaxy-s26-ultra','Galaxy S26 Ultra','samsung-galaxy-s26-ultra-registry','Listed in Samsung India''s current smartphone collection','https://www.samsung.com/in/smartphones/','https://www.samsung.com/in/smartphones/'
 UNION ALL SELECT 'Samsung','galaxy-s','samsung-in-galaxy-s26','Galaxy S26','samsung-galaxy-s26-registry','Listed in Samsung India''s current smartphone collection','https://www.samsung.com/in/smartphones/','https://www.samsung.com/in/smartphones/'
 UNION ALL SELECT 'Samsung','galaxy-s','samsung-in-galaxy-s26-plus','Galaxy S26+','samsung-galaxy-s26-plus-registry','Listed in Samsung India''s current smartphone collection','https://www.samsung.com/in/smartphones/','https://www.samsung.com/in/smartphones/'
 UNION ALL SELECT 'Samsung','galaxy-z','samsung-in-galaxy-z-flip7','Galaxy Z Flip7','samsung-galaxy-z-flip7-registry','Listed in Samsung India''s current smartphone collection','https://www.samsung.com/in/smartphones/','https://www.samsung.com/in/smartphones/'
 UNION ALL SELECT 'Samsung','galaxy-z','samsung-in-galaxy-z-fold7','Galaxy Z Fold7','samsung-galaxy-z-fold7-registry','Listed in Samsung India''s current smartphone collection','https://www.samsung.com/in/smartphones/','https://www.samsung.com/in/smartphones/'
 UNION ALL SELECT 'Samsung','galaxy-s','samsung-in-galaxy-s25-fe','Galaxy S25 FE','samsung-galaxy-s25-fe-registry','Listed in Samsung India''s current smartphone collection','https://www.samsung.com/in/smartphones/','https://www.samsung.com/in/smartphones/'
) v JOIN mobile_brands b ON b.name=v.brand JOIN mobile_series s ON s.brand_id=b.id AND s.slug=v.series_slug WHERE 1=1
ON CONFLICT(external_id) DO UPDATE SET official_name=excluded.official_name, india_availability=excluded.india_availability, availability_source_url=excluded.availability_source_url, specification_source_url=excluded.specification_source_url, media_source_url=excluded.media_source_url, verification_status='VERIFIED_REGISTRY', verified_at=excluded.verified_at, updated_at=CURRENT_TIMESTAMP;
