export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  previousPrice?: number;
  stockQuantity: number;
  imageUrl: string;
  categoryName: string;
  rating: number;
  reviews: number;
  badge?: string;
};

type ProductSeed = [name: string, description: string, price: number, previousPrice?: number, badge?: string];

function productSlug(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function makeProducts(categoryName: string, startId: number, seeds: ProductSeed[]): Product[] {
  return seeds.map(([name, description, price, previousPrice, badge], index) => ({
    id: startId + index,
    name,
    description,
    price,
    previousPrice,
    stockQuantity: 8 + ((startId + index) * 7) % 39,
    imageUrl: `/products/${productSlug(name)}.jpg`,
    categoryName,
    rating: Number((4.3 + ((startId + index) % 6) / 10).toFixed(1)),
    reviews: 124 + ((startId + index) * 83) % 2400,
    badge,
  }));
}

export const categories = [
  "All",
  "Phones",
  "Audio",
  "Computing",
  "Wearables",
  "Cameras",
  "Home Appliances",
  "Kitchen",
  "Personal Care",
  "Gaming",
  "Lifestyle",
];

export const fallbackProducts: Product[] = [
  ...makeProducts("Phones", 101, [
    ["Samsung Galaxy S26 Ultra", "Premium flagship with an expansive display, S Pen and versatile camera system.", 129999, 139999, "New flagship"],
    ["Apple iPhone 16", "A18-powered iPhone with Camera Control, durable design and dependable all-day performance.", 69900, 79900, "Popular"],
    ["Google Pixel 9", "Bright Actua display, polished Android experience and Pixel's signature computational camera.", 74999, 79999, "Camera pick"],
    ["OnePlus 13", "Flagship Snapdragon performance, Hasselblad cameras and fast wired charging.", 69999, 74999, "Bestseller"],
    ["Xiaomi 15", "Compact flagship performance with Leica optics and a vivid high-refresh display.", 64999, 69999],
    ["vivo X200", "ZEISS-backed portrait photography, premium performance and a long-lasting battery.", 65999, 69999, "Camera pick"],
    ["Nothing Phone (3a) Pro", "Distinctive Glyph design, clean software and a versatile triple-camera setup.", 29999, 32999, "Great value"],
    ["Motorola Edge 60 Pro", "Curved pOLED display, capable cameras and a refined lightweight Android experience.", 29999, 34999],
  ]),
  ...makeProducts("Audio", 201, [
    ["Sony WH-1000XM5", "Premium wireless headphones with adaptive noise cancellation and clear call quality.", 29990, 34990, "Bestseller"],
    ["Bose QuietComfort Ultra Headphones", "Immersive listening, strong noise cancellation and plush long-session comfort.", 35900, 38900, "Premium pick"],
    ["Apple AirPods Pro (2nd generation)", "Active Noise Cancellation, Adaptive Audio and seamless Apple device pairing.", 24900, 26900, "Popular"],
    ["Samsung Galaxy Buds3 Pro", "High-quality wireless audio with intelligent noise control and Galaxy integration.", 19999, 22999],
    ["OnePlus Buds Pro 3", "Dual-driver earbuds with adaptive noise cancellation and spatial listening modes.", 11999, 13999, "Great value"],
    ["Noise Air Buds Pro 6", "Comfortable everyday earbuds with noise cancellation and app-based sound controls.", 3499, 4999],
    ["JBL Flip 6", "Portable waterproof speaker with punchy JBL Pro Sound for indoor and outdoor listening.", 9999, 12999, "Outdoor pick"],
    ["Marshall Emberton III", "Portable signature Marshall sound with a rugged, travel-ready cabinet.", 17999, 19999],
  ]),
  ...makeProducts("Computing", 301, [
    ["Apple MacBook Air 13-inch (M4)", "Thin, silent everyday laptop with Apple silicon performance and long battery life.", 99900, 114900, "New"],
    ["Dell XPS 13", "Premium compact Windows laptop with a precise display and travel-friendly aluminium design.", 139990, 154990, "Premium pick"],
    ["HP Spectre x360 14", "Flexible 2-in-1 PC with touch input, premium construction and creator-friendly display.", 149999, 164999],
    ["Lenovo Yoga Slim 7i", "Thin-and-light productivity laptop with an OLED option and modern Intel performance.", 96990, 109990, "Work pick"],
    ["ASUS ROG Zephyrus G14", "Compact gaming and creator laptop pairing strong graphics with a premium display.", 174990, 189990, "Creator pick"],
    ["Acer Swift Go 14", "Portable OLED productivity laptop designed for students and hybrid professionals.", 69990, 79990, "Great value"],
    ["Samsung Galaxy Book4 Pro", "Slim AMOLED laptop with a connected Galaxy ecosystem experience.", 124990, 139990],
    ["Lenovo LOQ 15", "Accessible gaming laptop with upgradeable performance and a full-size cooling system.", 78990, 89990, "Gaming value"],
  ]),
  ...makeProducts("Wearables", 401, [
    ["Apple Watch Series 10", "Slim smartwatch with fitness tracking, safety tools and deep iPhone integration.", 46900, 49900, "Popular"],
    ["Samsung Galaxy Watch7", "Wear OS smartwatch with wellness insights and a broad app ecosystem.", 29999, 32999, "Android pick"],
    ["Samsung Galaxy Watch Ultra", "Rugged premium smartwatch built for outdoor training and endurance activities.", 59999, 69999, "Adventure pick"],
    ["OnePlus Watch 3", "Premium Wear OS watch with dual-engine efficiency and comprehensive health tracking.", 27999, 29999],
    ["Garmin Venu 3", "Fitness-focused GPS smartwatch with detailed training, recovery and wellness insights.", 50990, 55990, "Fitness pick"],
    ["Fitbit Charge 6", "Compact fitness tracker with heart-rate insights, GPS and Google app integration.", 14999, 15999],
    ["Noise ColorFit Pro 6 Max", "India-designed smartwatch with an AMOLED display and everyday wellness features.", 7499, 9999, "Made for India"],
    ["boAt Lunar Discovery", "Affordable Bluetooth-calling smartwatch with activity tracking and custom watch faces.", 2499, 3999, "Value pick"],
  ]),
  ...makeProducts("Cameras", 501, [
    ["Sony Alpha 7 IV", "Full-frame hybrid mirrorless camera for high-detail photography and capable 4K video.", 219990, 239990, "Creator favourite"],
    ["Canon EOS R6 Mark II", "Fast full-frame mirrorless camera for events, wildlife and hybrid video production.", 229995, 249995, "Pro pick"],
    ["Nikon Z6 III", "High-speed full-frame hybrid camera with a bright viewfinder and robust video tools.", 247990, 269990, "New"],
    ["Fujifilm X-T5", "Compact APS-C camera combining tactile controls with Fujifilm colour science.", 169999, 184999, "Street pick"],
    ["Sony ZV-E10 II", "Interchangeable-lens vlogging camera with creator controls and high-quality 4K capture.", 94990, 104990, "Vlogger pick"],
    ["Canon EOS R50", "Approachable mirrorless camera for family photography, travel and content creation.", 71995, 79995, "Beginner pick"],
    ["GoPro HERO13 Black", "Rugged action camera with stabilised high-resolution capture and flexible mounting.", 44990, 49990, "Adventure pick"],
    ["Fujifilm Instax Mini 12", "Simple instant camera that creates credit-card-sized prints in seconds.", 7499, 8999, "Gift pick"],
  ]),
  ...makeProducts("Home Appliances", 601, [
    ["Samsung Bespoke Refrigerator", "Premium connected refrigerator with flexible storage and efficient energy features.", 89990, 104990, "Smart home"],
    ["LG InstaView Door-in-Door Refrigerator", "Feature-rich refrigerator with a viewing panel and organised family storage.", 124990, 139990, "Premium pick"],
    ["Dyson V12 Detect Slim", "Lightweight cordless vacuum with laser dust illumination and multiple cleaning tools.", 52900, 58900, "Bestseller"],
    ["Philips Airfryer HD9252", "Compact rapid-air fryer for lower-oil everyday cooking and easy presets.", 8995, 11995, "Kitchen favourite"],
    ["IFB Neptune VX Dishwasher", "Freestanding dishwasher sized for Indian kitchens and everyday cookware loads.", 44990, 51990, "Family pick"],
    ["Bosch 8 kg Front Load Washing Machine", "Efficient front-load washer with quiet operation and multiple fabric programmes.", 42990, 49990],
    ["Eureka Forbes Aquaguard Aura RO+UV", "Multi-stage water purifier designed for varied Indian water conditions.", 18999, 22999, "India essential"],
    ["Voltas 1.5 Ton 5 Star Inverter AC", "Energy-efficient split air conditioner designed for reliable Indian summer cooling.", 42999, 49999, "Summer pick"],
  ]),
  ...makeProducts("Kitchen", 701, [
    ["Prestige PIC 20 Induction Cooktop", "Portable induction cooktop with Indian menu presets and automatic power control.", 3295, 4595, "Bestseller"],
    ["Hawkins Contura 5 L Pressure Cooker", "Hard-anodised pressure cooker shaped for convenient stirring and everyday curries.", 3490, 3990, "Indian classic"],
    ["Wonderchef Nutri-blend 400 W", "Compact blender for chutneys, masalas, smoothies and quick kitchen preparation.", 2999, 4500, "Popular"],
    ["Butterfly Smart 750 W Mixer Grinder", "Three-jar mixer grinder for wet grinding, dry spices and everyday blending.", 3499, 4999, "Great value"],
    ["Borosil Prima 30 L OTG", "Countertop oven for baking, grilling and toasting with adjustable temperature controls.", 8990, 10990, "Baker pick"],
    ["Milton Thermosteel Flip Lid Flask", "Vacuum-insulated stainless-steel flask for hot or cold drinks through the day.", 1099, 1499, "Everyday pick"],
    ["Pigeon by Stovekraft Handy Chopper", "Manual food chopper for quick onion, vegetable and herb preparation.", 499, 795, "Value pick"],
    ["Prestige Svachh 3-Burner Gas Stove", "Toughened-glass cooktop with liftable burners designed for easier cleaning.", 7995, 9995, "Made for India"],
  ]),
  ...makeProducts("Personal Care", 801, [
    ["Dyson Airwrap i.d. Multi-styler", "Connected multi-styler for curling, shaping, smoothing and drying with controlled heat.", 49900, 54900, "Premium pick"],
    ["Philips Series 7000 Multigroom", "All-in-one grooming kit for beard, hair and body trimming.", 4995, 6495, "Bestseller"],
    ["Braun Series 5 Electric Shaver", "Wet-and-dry foil shaver with flexible blades for comfortable everyday grooming.", 8499, 9999],
    ["Beardo Beard Growth Essentials Kit", "Indian grooming set combining beard oil, wash and everyday care essentials.", 1299, 1799, "Indian brand"],
    ["Mamaearth Vitamin C Daily Glow Face Serum", "Lightweight face serum from an Indian personal-care brand for a daily routine.", 599, 699, "Indian brand"],
    ["Minimalist 10% Niacinamide Face Serum", "Fragrance-free Indian skincare formula designed for a simple daily regimen.", 599, 699, "Popular"],
    ["Bombay Shaving Company Trimmer", "Cordless beard trimmer designed for everyday styling and convenient USB charging.", 1799, 2499, "Indian brand"],
    ["Havells HD3201 Hair Dryer", "Compact hair dryer with multiple heat settings and a concentrator attachment.", 1495, 1995, "Value pick"],
  ]),
  ...makeProducts("Gaming", 901, [
    ["Sony PlayStation 5 Slim", "Current-generation console for immersive 4K gaming and fast SSD loading.", 54990, 59990, "Most wanted"],
    ["Microsoft Xbox Series X", "High-performance console with fast loading and broad backward compatibility.", 52990, 55990, "Power pick"],
    ["Nintendo Switch OLED", "Flexible handheld and TV console with a vibrant OLED screen and family-friendly library.", 34999, 39999, "Family pick"],
    ["ASUS ROG Ally X", "Windows handheld gaming PC with improved battery capacity and portable performance.", 89990, 99990, "Handheld pick"],
    ["Logitech G Pro X Superlight 2", "Lightweight wireless esports mouse with a high-precision gaming sensor.", 13995, 15995, "Esports pick"],
    ["Razer BlackWidow V4 X", "Full-size mechanical gaming keyboard with programmable controls and RGB lighting.", 12999, 14999],
    ["HyperX Cloud III Wireless", "Comfort-focused wireless gaming headset with clear voice capture and long sessions in mind.", 13990, 15990, "Team pick"],
    ["LG UltraGear 27-inch QHD Gaming Monitor", "High-refresh QHD monitor for responsive PC and console gaming.", 29999, 34999, "Display pick"],
  ]),
  ...makeProducts("Lifestyle", 1001, [
    ["Nike Air Zoom Pegasus 41", "Responsive everyday road-running shoes with breathable support and cushioned transitions.", 11895, 12995, "Runner pick"],
    ["adidas Ultraboost 5", "Premium running shoes designed for responsive comfort across daily kilometres.", 17999, 19999, "Premium pick"],
    ["PUMA Palermo", "Terrace-inspired casual sneakers with a clean low-profile silhouette.", 6999, 7999, "Trending"],
    ["Skechers GO WALK 7", "Lightweight walking shoes built around soft step-in comfort for everyday use.", 7999, 8999, "Comfort pick"],
    ["Wildcraft Wiki 45 L Rucksack", "India-designed travel rucksack with organised storage and adjustable support.", 3499, 4999, "Indian brand"],
    ["Safari Thorium Neo Cabin Trolley", "Hard-sided cabin luggage from an Indian travel brand with smooth spinner wheels.", 3999, 6999, "Travel pick"],
    ["Titan Neo Splash Analog Watch", "Contemporary Indian dress watch with a clean dial and versatile styling.", 6495, 7495, "Indian brand"],
    ["Mokobara Transit Backpack", "Modern Indian work-and-travel backpack with structured organisation for daily carry.", 4999, 5999, "Indian design"],
  ]),
];
