import type { Product } from "./catalog";

export type ProductMedia = {
  src: string;
  alt: string;
  label: string;
};

export type ProductColourVariant = {
  id: string;
  name: string;
  swatch: string;
  skuCode: string;
  media: ProductMedia[];
  spinFrames?: string[];
};

export type ProductStorageOption = {
  id: string;
  label: string;
  price: number;
  previousPrice?: number;
  stockByColour: Record<string, number>;
};

export type SpecificationGroup = {
  name: string;
  items: Array<{ label: string; value: string }>;
};

export type ProductProfile = {
  productId: number;
  brand: string;
  model: string;
  launchYear: number;
  officialDescription: string;
  highlights: string[];
  colours: ProductColourVariant[];
  storage: ProductStorageOption[];
  specifications: SpecificationGroup[];
  boxContents: string[];
  warranty: string;
  countryOfOrigin: string;
  gtin: string;
  accessories: string[];
  returnPolicy: string;
  serviceInformation: string;
  sourceLabel: string;
  sourceUrl: string;
  verifiedOn: string;
  faqs: Array<{ question: string; answer: string }>;
};

export type ProductConfiguration = {
  sku: string;
  variantName: string;
  colour: string;
  storage: string;
  price: number;
  previousPrice?: number;
  stockQuantity: number;
  imageUrl: string;
};

const globalMedia: ProductMedia[] = [
  {
    src: "/products/iphone-16/hero.jpg",
    label: "Product family",
    alt: "Apple iPhone 16 and iPhone 16 Plus shown side by side",
  },
  {
    src: "/products/iphone-16/lineup.jpg",
    label: "Lineup",
    alt: "Apple iPhone 16 lineup in Ultramarine",
  },
  {
    src: "/products/iphone-16/finishes.jpg",
    label: "Finishes",
    alt: "Apple iPhone 16 finish lineup",
  },
  {
    src: "/products/iphone-16/apple-intelligence.jpg",
    label: "Apple Intelligence",
    alt: "Apple iPhone 16 showing Apple Intelligence features",
  },
  {
    src: "/products/iphone-16/camera-control-1.jpg",
    label: "Camera Control",
    alt: "A person taking a photo with iPhone 16 Camera Control",
  },
  {
    src: "/products/iphone-16/camera-control-2.jpg",
    label: "Portrait capture",
    alt: "A person adjusting portrait settings with iPhone 16",
  },
  {
    src: "/products/iphone-16/camera-control-3.jpg",
    label: "Video capture",
    alt: "A person recording video with iPhone 16",
  },
];

function iphoneMedia(colour: string, label: string): ProductMedia[] {
  return [
    {
      src: `/products/iphone-16/${colour}-front.png`,
      label: "Front and back",
      alt: `Apple iPhone 16 in ${label}, front and back product view`,
    },
    {
      src: `/products/iphone-16/${colour}-angle.jpg`,
      label: "Angled view",
      alt: `Apple iPhone 16 in ${label}, angled product view`,
    },
    {
      src: `/products/iphone-16/${colour}-side.jpg`,
      label: "Side profile",
      alt: `Apple iPhone 16 in ${label}, side profile`,
    },
    {
      src: `/products/iphone-16/${colour}-box.jpg`,
      label: "In the box",
      alt: `Apple iPhone 16 in ${label} with box contents`,
    },
    ...globalMedia,
  ];
}

export const iphone16Profile: ProductProfile = {
  productId: 102,
  brand: "Apple",
  model: "iPhone 16",
  launchYear: 2024,
  officialDescription:
    "The 6.1-inch iPhone 16 combines the A18 chip, Camera Control, an Action button and a 48MP Fusion camera system in an aluminium design with Ceramic Shield.",
  highlights: [
    "15.54 cm (6.1-inch) Super Retina XDR OLED display",
    "A18 chip with 6-core CPU, 5-core GPU and 16-core Neural Engine",
    "48MP Fusion Main camera with 2x optical-quality Telephoto",
    "Camera Control, Action button and Apple Intelligence support",
    "IP68 water and dust resistance; MagSafe and Qi2 charging up to 25W",
  ],
  colours: [
    {
      id: "ultramarine",
      name: "Ultramarine",
      swatch: "#6f7fd4",
      skuCode: "UM",
      media: iphoneMedia("ultramarine", "Ultramarine"),
    },
    {
      id: "teal",
      name: "Teal",
      swatch: "#8eb6ad",
      skuCode: "TL",
      media: iphoneMedia("teal", "Teal"),
    },
    {
      id: "pink",
      name: "Pink",
      swatch: "#e9a7bd",
      skuCode: "PK",
      media: iphoneMedia("pink", "Pink"),
    },
    {
      id: "white",
      name: "White",
      swatch: "#f2f1ed",
      skuCode: "WH",
      media: iphoneMedia("white", "White"),
    },
    {
      id: "black",
      name: "Black",
      swatch: "#202124",
      skuCode: "BK",
      media: iphoneMedia("black", "Black"),
    },
  ],
  storage: [
    {
      id: "128gb",
      label: "128GB",
      price: 69900,
      previousPrice: 79900,
      stockByColour: {
        ultramarine: 14,
        teal: 9,
        pink: 7,
        white: 11,
        black: 16,
      },
    },
    {
      id: "256gb",
      label: "256GB",
      price: 89900,
      stockByColour: {
        ultramarine: 8,
        teal: 5,
        pink: 4,
        white: 7,
        black: 10,
      },
    },
    {
      id: "512gb",
      label: "512GB",
      price: 109900,
      stockByColour: {
        ultramarine: 0,
        teal: 0,
        pink: 0,
        white: 0,
        black: 0,
      },
    },
  ],
  specifications: [
    {
      name: "Display and performance",
      items: [
        {
          label: "Display",
          value: "15.54 cm / 6.1-inch Super Retina XDR OLED",
        },
        { label: "Resolution", value: "2556 × 1179 pixels at 460 ppi" },
        {
          label: "Refresh rate",
          value: "Standard refresh; ProMotion is not supported",
        },
        { label: "Processor", value: "Apple A18, 6-core CPU" },
        { label: "GPU", value: "5-core Apple GPU" },
        { label: "RAM", value: "Not disclosed by Apple" },
        { label: "Storage", value: "128GB, 256GB or 512GB" },
      ],
    },
    {
      name: "Cameras",
      items: [
        {
          label: "Rear camera",
          value:
            "48MP Fusion Main, 12MP 2x Telephoto option and 12MP Ultra Wide",
        },
        {
          label: "Front camera",
          value: "12MP TrueDepth, ƒ/1.9 with autofocus",
        },
        { label: "Video", value: "4K Dolby Vision up to 60 fps" },
      ],
    },
    {
      name: "Battery and charging",
      items: [
        { label: "Battery", value: "Up to 22 hours video playback" },
        {
          label: "Wired charging",
          value:
            "USB-C; up to 50% in around 30 minutes with a compatible 20W+ adapter",
        },
        {
          label: "Wireless charging",
          value: "MagSafe up to 25W; Qi2 up to 25W",
        },
        { label: "USB type", value: "USB-C, USB 2 data speeds up to 480 Mb/s" },
      ],
    },
    {
      name: "Connectivity",
      items: [
        {
          label: "5G",
          value:
            "Sub-6 GHz 5G with 4×4 MIMO; India model supports n1/n3/n5/n8/n28/n40/n41/n77/n78 among other listed bands",
        },
        { label: "Wi-Fi", value: "Wi-Fi 7 (802.11be) with 2×2 MIMO" },
        { label: "Bluetooth", value: "Bluetooth 5.3" },
        { label: "NFC", value: "NFC with reader mode and Express Cards" },
      ],
    },
    {
      name: "Build and software",
      items: [
        {
          label: "Water resistance",
          value: "IP68, up to 6 metres for 30 minutes under IEC 60529",
        },
        { label: "Dimensions", value: "147.6 × 71.6 × 7.80 mm" },
        { label: "Weight", value: "170 g" },
        {
          label: "Operating system",
          value: "Introduced with iOS 18; supports current iOS releases",
        },
        { label: "Launch date", value: "20 September 2024" },
        {
          label: "Model family",
          value: "A3287 / A3290 (regional model availability varies)",
        },
      ],
    },
  ],
  boxContents: ["iPhone 16", "USB-C Charge Cable (1 m)", "Documentation"],
  warranty:
    "Apple One-Year Limited Warranty; statutory consumer rights may also apply.",
  countryOfOrigin:
    "Manufacturing origin varies by production batch. The country printed on the supplied retail box is authoritative.",
  gtin: "Configuration-specific GTIN/EAN is not published on Apple’s technical-specification page; verify the retail-box label before fulfilment.",
  accessories: [
    "iPhone 16 Clear Case",
    "iPhone 16 Silicone Case with MagSafe",
    "MagSafe Charger",
    "Qi2-compatible chargers",
    "USB-C power adapters",
  ],
  returnPolicy:
    "Return requests are accepted within 7 days of delivery. Opened electronics are eligible only for verified damage, defect or incorrect fulfilment and are inspected before approval.",
  serviceInformation:
    "Warranty diagnostics and repair are handled through Apple or an Apple Authorised Service Provider. Keep the invoice and serial number.",
  sourceLabel: "Apple India technical specifications and Apple India Store",
  sourceUrl: "https://www.apple.com/in/iphone-16/specs/",
  verifiedOn: "17 July 2026",
  faqs: [
    {
      question: "Does iPhone 16 support MagSafe?",
      answer:
        "Yes. Apple lists MagSafe wireless charging up to 25W with a compatible adapter and charger.",
    },
    {
      question: "Is a power adapter included?",
      answer:
        "No. Apple lists the iPhone, a 1 m USB-C charge cable and documentation in the box.",
    },
    {
      question: "Does it have a physical SIM slot in India?",
      answer:
        "Apple lists dual SIM support using nano-SIM and eSIM for supported regional models.",
    },
  ],
};

export const productProfiles: Partial<Record<number, ProductProfile>> = {
  [iphone16Profile.productId]: iphone16Profile,
};

export function getProductProfile(productId: number): ProductProfile | null {
  return productProfiles[productId] ?? null;
}

export function resolveConfiguration(
  product: Product,
  colourId: string,
  storageId: string,
): ProductConfiguration {
  const profile = getProductProfile(product.id);
  if (!profile) {
    return {
      sku: `NXR-${product.id}`,
      variantName: product.name,
      colour: "Standard",
      storage: "Standard",
      price: product.price,
      previousPrice: product.previousPrice,
      stockQuantity: product.stockQuantity,
      imageUrl: product.imageUrl,
    };
  }
  const colour =
    profile.colours.find((candidate) => candidate.id === colourId) ??
    profile.colours[0];
  const storage =
    profile.storage.find((candidate) => candidate.id === storageId) ??
    profile.storage[0];
  return {
    sku: `NXR-APL-IP16-${storage.id.toUpperCase()}-${colour.skuCode}`,
    variantName: `${profile.model} · ${storage.label} · ${colour.name}`,
    colour: colour.name,
    storage: storage.label,
    price: storage.price,
    previousPrice: storage.previousPrice,
    stockQuantity: storage.stockByColour[colour.id] ?? 0,
    imageUrl: colour.media[0].src,
  };
}

export function resolveConfigurationBySku(
  product: Product,
  sku?: string,
): ProductConfiguration {
  const profile = getProductProfile(product.id);
  if (!profile || !sku)
    return resolveConfiguration(product, "standard", "standard");
  for (const colour of profile.colours) {
    for (const storage of profile.storage) {
      const candidate = resolveConfiguration(product, colour.id, storage.id);
      if (candidate.sku === sku) return candidate;
    }
  }
  throw new Error(`Unknown configuration SKU ${sku}.`);
}
