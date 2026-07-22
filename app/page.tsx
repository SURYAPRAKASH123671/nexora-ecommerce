"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Columns3,
  ScanSearch,
  LoaderCircle,
  Headphones,
  House,
  Paperclip,
  Mic,
  Moon,
  Search,
  Sparkles,
  ShoppingBag,
  Store,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import {
  categories,
  fallbackProducts,
  productSlug,
  type Product,
} from "./catalog";
import PremiumProductPage from "./PremiumProductPage";
import {
  getProductProfile,
  type ProductConfiguration,
} from "./product-details";
import SupportPage, { ProfessionalFooter, type InfoPage } from "./SupportPages";

type View =
  | "home"
  | "catalog"
  | "product"
  | "cart"
  | "checkout"
  | "compare"
  | "account"
  | "admin"
  | "information";
type SortMode =
  | "recommended"
  | "newest"
  | "popularity"
  | "best-seller"
  | "rating"
  | "price-low"
  | "price-high"
  | "discount";
type CatalogResponse = {
  items: Product[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
};

type CartLine = {
  key: string;
  product: Product;
  quantity: number;
  configuration?: ProductConfiguration;
};
type AuthUser = {
  name: string;
  email: string;
  isAdmin: boolean;
};
type AuthSession = { user: AuthUser };
type PaymentFlowState =
  | "IDLE"
  | "CREATING_ORDER"
  | "PAYMENT_PENDING"
  | "VERIFYING_PAYMENT"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_CANCELLED"
  | "PAYMENT_FAILED"
  | "UPLOADING_PROOF";
type SupportMessage = {
  id: string;
  sender_role: "CUSTOMER" | "AGENT" | "SYSTEM";
  sender_email: string;
  body: string;
  delivery_status: string;
  read_at: string | null;
  created_at: string;
};
type OrderCreated = {
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  instructions?: UpiInstructions | null;
  razorpay?: RazorpayCheckout | null;
};
type RazorpayCheckout = {
  keyId: string;
  providerOrderId: string;
  amountPaise: number;
  currency: "INR";
  merchantName: string;
  description: string;
};
type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, callback: (response: unknown) => void) => void;
    };
  }
}
type UpiInstructions = {
  orderNumber: string;
  amount: number;
  merchantName: string;
  merchantUpiId: string;
  paymentUri: string;
  paymentStatus: string;
  orderStatus: string;
};
type ManualPayment = {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  payerReference?: string;
  reviewStatus: string;
  proofUrl: string;
  submittedAt: string;
  reviewerNote?: string;
  orderStatus: string;
};
type ProductQuestion = {
  id: number;
  productId: number;
  productName: string;
  customerEmail: string;
  question: string;
  answer?: string;
  status: string;
  createdAt: string;
};

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const sortModes: SortMode[] = [
  "recommended",
  "newest",
  "popularity",
  "best-seller",
  "rating",
  "price-low",
  "price-high",
  "discount",
];
const sortLabels: Record<SortMode, string> = {
  recommended: "Recommended",
  newest: "Newest",
  popularity: "Popularity",
  "best-seller": "Best seller",
  "price-low": "Price: Low to high",
  "price-high": "Price: High to low",
  rating: "Customer rating",
  discount: "Biggest discount",
};

const animatedHeroCategories = new Set([
  "Phones",
  "Audio",
  "Computing",
  "Wearables",
  "Cameras",
  "Gaming",
]);

export type StorefrontInitialProps = {
  initialView?: View;
  initialProductSlug?: string;
  initialProduct?: Product;
  initialCategory?: string;
  initialInfoPage?: InfoPage;
};

export default function Home({
  initialView = "home",
  initialProductSlug,
  initialProduct: routedProduct,
  initialCategory = "All",
  initialInfoPage = "help-centre",
}: StorefrontInitialProps = {}) {
  const initialProduct =
    routedProduct ??
    fallbackProducts.find(
      (product) => productSlug(product.name) === initialProductSlug,
    ) ??
    fallbackProducts[0];
  const [view, setView] = useState<View>(initialView);
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [loading, setLoading] = useState(true);
  const [usingDemoCatalog, setUsingDemoCatalog] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [selected, setSelected] = useState<Product>(initialProduct);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [notice, setNotice] = useState("");
  const [dialog, setDialog] = useState<{ title: string; body: string } | null>(
    null,
  );
  const [sortMode, setSortMode] = useState<SortMode>("recommended");
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [infoPage, setInfoPage] = useState<InfoPage>(initialInfoPage);
  const [heroIndex, setHeroIndex] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<number[]>([]);
  const [comparisonIds, setComparisonIds] = useState<number[]>([]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogTotal, setCatalogTotal] = useState(fallbackProducts.length);
  const [catalogHasMore, setCatalogHasMore] = useState(false);
  const [mobileBrand, setMobileBrand] = useState("All brands");
  const [mobileBudget, setMobileBudget] = useState("All prices");
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const pullStartY = useRef<number | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchActiveIndex, setSearchActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [voiceListening, setVoiceListening] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideQuestion, setGuideQuestion] = useState("");
  const [guideAnswer, setGuideAnswer] = useState(
    "Tell me what you need and I’ll rank matching catalogue products using transparent price, rating and shopping signals.",
  );
  const [visualPreview, setVisualPreview] = useState("");
  const visualSearchInput = useRef<HTMLInputElement>(null);
  const [supportMode, setSupportMode] = useState<"guide" | "support">("support");
  const [supportLanguage, setSupportLanguage] = useState<"en" | "ta" | "hi">(
    "en",
  );
  const [supportConversationId, setSupportConversationId] = useState("");
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [supportDraft, setSupportDraft] = useState("");
  const [supportBusy, setSupportBusy] = useState(false);
  const supportFileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const pages: InfoPage[] = [
      "help-centre",
      "delivery-returns",
      "contact-us",
      "our-standards",
      "privacy-policy",
      "terms-conditions",
    ];
    const syncFromUrl = () => {
      const url = new URL(window.location.href);
      const path = url.pathname.replace(/^\/+|\/+$/g, "");
      const requested = url.searchParams.get("page") ?? path;
      if (requested && pages.includes(requested as InfoPage)) {
        setInfoPage(requested as InfoPage);
        setView("information");
        return;
      }
      if (path.startsWith("products/")) {
        const slug = path.slice("products/".length);
        const product = fallbackProducts.find(
          (item) => productSlug(item.name) === slug,
        );
        if (product) {
          setSelected(product);
          setView("product");
          return;
        }
      }
      if (path.startsWith("categories/")) {
        const slug = path.slice("categories/".length);
        const matched = categories.find((item) => productSlug(item) === slug);
        if (matched) {
          setCategory(matched);
          setView("catalog");
          return;
        }
      }
      const routeViews: Record<string, View> = {
        shop: "catalog",
        cart: "cart",
        checkout: "checkout",
        compare: "compare",
        account: "account",
        admin: "admin",
      };
      if (routeViews[path]) setView(routeViews[path]);
      else if (!path) setView("home");
      else if (url.search.includes("page=")) {
        setView("home");
      }
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  useEffect(() => {
    const titles: Record<InfoPage, string> = {
      "help-centre": "Help Centre",
      "delivery-returns": "Delivery & Returns",
      "contact-us": "Contact Us",
      "our-standards": "Our Standards",
      "privacy-policy": "Privacy Policy",
      "terms-conditions": "Terms & Conditions",
    };
    document.title =
      view === "information"
        ? `${titles[infoPage]} | Nexora Commerce`
        : view === "product"
          ? `${selected.name} | Nexora`
          : "Nexora — Thoughtfully chosen";
    const description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (description)
      description.content =
        view === "information"
          ? `Professional ${titles[infoPage]} information from Nexora Commerce India.`
          : view === "product"
            ? selected.description
            : "A premium commerce experience for technology and lifestyle essentials.";
  }, [view, infoPage, selected]);

  useEffect(() => {
    try {
      const savedCart = JSON.parse(localStorage.getItem("nexora-cart") ?? "[]");
      const savedWishlist = JSON.parse(
        localStorage.getItem("nexora-wishlist") ?? "[]",
      );
      const savedRecent = JSON.parse(
        localStorage.getItem("nexora-recent") ?? "[]",
      );
      const savedComparison = JSON.parse(
        localStorage.getItem("nexora-comparison") ?? "[]",
      );
      if (Array.isArray(savedCart)) setCart(savedCart);
      if (Array.isArray(savedWishlist)) setWishlist(savedWishlist);
      if (Array.isArray(savedRecent)) setRecentlyViewed(savedRecent);
      if (Array.isArray(savedComparison))
        setComparisonIds(savedComparison.slice(0, 4));
      const savedSearches = JSON.parse(
        localStorage.getItem("nexora-recent-searches") ?? "[]",
      );
      if (Array.isArray(savedSearches))
        setRecentSearches(
          savedSearches
            .filter((item): item is string => typeof item === "string")
            .slice(0, 5),
        );
      setDarkMode(localStorage.getItem("nexora-theme") === "dark");
    } catch {
      localStorage.removeItem("nexora-cart");
      localStorage.removeItem("nexora-wishlist");
      localStorage.removeItem("nexora-recent");
      localStorage.removeItem("nexora-comparison");
    } finally {
      setPreferencesReady(true);
    }
  }, []);

  useEffect(() => {
    if (!preferencesReady) return;
    localStorage.setItem("nexora-cart", JSON.stringify(cart));
    localStorage.setItem("nexora-wishlist", JSON.stringify(wishlist));
    localStorage.setItem("nexora-recent", JSON.stringify(recentlyViewed));
    localStorage.setItem("nexora-comparison", JSON.stringify(comparisonIds));
    localStorage.setItem("nexora-theme", darkMode ? "dark" : "light");
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
  }, [
    cart,
    wishlist,
    recentlyViewed,
    comparisonIds,
    darkMode,
    preferencesReady,
  ]);

  useEffect(() => {
    const timer = window.setInterval(
      () => setHeroIndex((current) => (current + 1) % 4),
      5200,
    );
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 700);
      setHeaderScrolled(window.scrollY > 8);
      const progress = Math.min(window.scrollY, 220);
      document.documentElement.style.setProperty("--hero-copy-y", `${progress * 0.035}px`);
      document.documentElement.style.setProperty("--hero-visual-y", `${progress * -0.055}px`);
      document.documentElement.style.setProperty("--hero-visual-scale", String(1 - progress * 0.00008));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(
    () => () => {
      if (visualPreview) URL.revokeObjectURL(visualPreview);
    },
    [visualPreview],
  );

  useEffect(() => {
    if (!guideOpen || supportMode !== "support" || !supportConversationId)
      return;
    let active = true;
    const load = () =>
      fetch(
        `/api/site/support/messages?conversationId=${encodeURIComponent(supportConversationId)}`,
        { cache: "no-store" },
      )
        .then((response) =>
          response.ok
            ? response.json()
            : Promise.reject(new Error("Support history unavailable")),
        )
        .then((rows: SupportMessage[]) => {
          if (active) setSupportMessages(rows);
        })
        .catch(() => undefined);
    load();
    const timer = window.setInterval(load, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [guideOpen, supportMode, supportConversationId]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ page: "1", pageSize: "48" });
      if (query.trim()) params.set("q", query.trim());
      if (category !== "All") params.set("category", category);
      if (sortMode !== "recommended") params.set("sort", sortMode);
      if (category === "Phones" && mobileBrand !== "All brands")
        params.set("brand", mobileBrand);
      setLoading(true);
      fetch(`/api/site/catalog?${params}`, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error("Catalog unavailable");
          return response.json();
        })
        .then((data: CatalogResponse) => {
          if (!Array.isArray(data.items)) return;
          setProducts(data.items);
          if (data.items[0] && !initialProductSlug) setSelected(data.items[0]);
          setCatalogPage(1);
          setCatalogTotal(data.pagination.total);
          setCatalogHasMore(data.pagination.hasMore);
          setUsingDemoCatalog(false);
        })
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }, 220);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, category, sortMode, initialProductSlug, mobileBrand]);

  async function loadMoreProducts() {
    if (loading || !catalogHasMore) return;
    setLoading(true);
    try {
      const nextPage = catalogPage + 1;
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: "48",
      });
      if (query.trim()) params.set("q", query.trim());
      if (category !== "All") params.set("category", category);
      if (sortMode !== "recommended") params.set("sort", sortMode);
      if (category === "Phones" && mobileBrand !== "All brands")
        params.set("brand", mobileBrand);
      const response = await fetch(`/api/site/catalog?${params}`);
      if (!response.ok) throw new Error("Catalog unavailable");
      const data = (await response.json()) as CatalogResponse;
      setProducts((current) => [
        ...current,
        ...data.items.filter(
          (item) => !current.some((existing) => existing.id === item.id),
        ),
      ]);
      setCatalogPage(nextPage);
      setCatalogTotal(data.pagination.total);
      setCatalogHasMore(data.pagination.hasMore);
    } catch {
      showNotice("More products could not be loaded");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/site/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(await readApiError(response));
        return response.json();
      })
      .then((body: { user: AuthUser }) => {
        if (active) setAuth({ user: body.user });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matches = products.filter((product) => {
      const categoryMatch =
        category === "All" || product.categoryName === category;
      const searchMatch =
        !term ||
        `${product.name} ${product.description} ${product.categoryName}`
          .toLowerCase()
          .includes(term);
      return categoryMatch && searchMatch;
    });
    if (sortMode === "price-low")
      return [...matches].sort((a, b) => a.price - b.price);
    if (sortMode === "price-high")
      return [...matches].sort((a, b) => b.price - a.price);
    if (sortMode === "rating")
      return [...matches].sort(
        (a, b) => b.rating - a.rating || b.reviews - a.reviews,
      );
    if (sortMode === "discount")
      return [...matches].sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
    if (sortMode === "newest")
      return [...matches].sort(
        (a, b) =>
          Number(Boolean(b.newArrival)) - Number(Boolean(a.newArrival)) ||
          b.id - a.id,
      );
    if (sortMode === "best-seller" || sortMode === "popularity")
      return [...matches].sort(
        (a, b) =>
          Number(Boolean(b.bestSeller)) - Number(Boolean(a.bestSeller)) ||
          b.reviews - a.reviews,
      );
    return matches;
  }, [products, query, category, sortMode]);

  const mobileFiltered = useMemo(() => {
    if (category !== "Phones" || mobileBudget === "All prices") return filtered;
    const [minimum, maximum] = mobileBudget.split("-").map(Number);
    return filtered.filter(
      (product) =>
        product.price >= minimum && (!maximum || product.price <= maximum),
    );
  }, [filtered, category, mobileBudget]);

  const cartCount = cart.reduce((total, line) => total + line.quantity, 0);
  const subtotal = cart.reduce(
    (total, line) =>
      total + (line.configuration?.price ?? line.product.price) * line.quantity,
    0,
  );
  const shipping = subtotal > 5000 || subtotal === 0 ? 0 : 99;
  const total = subtotal + shipping;
  const heroProducts = useMemo(
    () => {
      const electronics = products.filter((product) =>
        animatedHeroCategories.has(product.categoryName),
      );
      return (electronics.length
        ? electronics
        : fallbackProducts.filter((product) =>
            animatedHeroCategories.has(product.categoryName),
          )
      ).slice(0, 4);
    },
    [products],
  );
  const currentHero =
    heroProducts[heroIndex % heroProducts.length] ?? fallbackProducts[0];
  const recentProducts = recentlyViewed
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product))
    .slice(0, 4);
  const searchSuggestions = query.trim()
    ? products
        .filter((product) =>
          `${product.name} ${product.categoryName}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
        )
        .slice(0, 5)
    : [];
  const trendingSearches = useMemo(
    () =>
      products
        .filter((product) => product.bestSeller)
        .sort((a, b) => b.reviews - a.reviews)
        .slice(0, 5)
        .map((product) => product.name),
    [products],
  );
  const recommendedProducts = useMemo(() => {
    const signals = new Map<string, number>();
    const addSignal = (product: Product | undefined, weight: number) => {
      if (!product) return;
      signals.set(
        product.categoryName,
        (signals.get(product.categoryName) ?? 0) + weight,
      );
    };
    recentlyViewed.forEach((id) =>
      addSignal(
        products.find((item) => item.id === id),
        4,
      ),
    );
    wishlist.forEach((id) =>
      addSignal(
        products.find((item) => item.id === id),
        3,
      ),
    );
    cart.forEach((line) => addSignal(line.product, 5 * line.quantity));
    const excluded = new Set([
      ...recentlyViewed.slice(0, 2),
      ...cart.map((line) => line.product.id),
    ]);
    return [...products]
      .filter((product) => !excluded.has(product.id))
      .sort(
        (a, b) =>
          (signals.get(b.categoryName) ?? 0) -
            (signals.get(a.categoryName) ?? 0) ||
          b.rating - a.rating ||
          b.reviews - a.reviews,
      )
      .slice(0, 4);
  }, [products, recentlyViewed, wishlist, cart]);

  function navigate(next: View) {
    setView(next);
    const route: Partial<Record<View, string>> = {
      home: "/",
      catalog: "/shop",
      cart: "/cart",
      checkout: "/checkout",
      compare: "/compare",
      account: "/account",
      admin: "/admin",
    };
    if (route[next]) window.history.pushState({}, "", route[next]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function navigateInfo(page: InfoPage) {
    setInfoPage(page);
    setView("information");
    window.history.pushState({}, "", `/${page}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openProduct(product: Product) {
    setSelected(product);
    setRecentlyViewed((current) =>
      [product.id, ...current.filter((id) => id !== product.id)].slice(0, 12),
    );
    setView("product");
    window.history.pushState({}, "", `/products/${productSlug(product.name)}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  function openInfo(title: string, body: string) {
    setDialog({ title, body });
  }

  function addToCart(product: Product, configuration?: ProductConfiguration) {
    const key = configuration?.sku ?? `product-${product.id}`;
    if ((configuration?.stockQuantity ?? product.stockQuantity) < 1) {
      showNotice("This configuration is currently unavailable");
      return;
    }
    setCart((current) => {
      const line = current.find((item) => item.key === key);
      if (line)
        return current.map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + 1 } : item,
        );
      return [...current, { key, product, configuration, quantity: 1 }];
    });
    showNotice(
      `${configuration?.variantName ?? product.name} added to your bag`,
    );
  }

  function changeQuantity(lineKey: string, delta: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.key === lineKey
            ? {
                ...line,
                quantity: Math.min(
                  line.configuration?.stockQuantity ??
                    line.product.stockQuantity,
                  line.quantity + delta,
                ),
              }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  function toggleWishlist(productId: number) {
    setWishlist((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  }

  function toggleComparison(productId: number) {
    setComparisonIds((current) => {
      if (current.includes(productId)) {
        showNotice("Product removed from comparison");
        return current.filter((id) => id !== productId);
      }
      if (current.length >= 4) {
        showNotice("You can compare up to four products");
        return current;
      }
      showNotice("Product added to comparison");
      return [...current, productId];
    });
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    rememberSearch(query);
    setSearchOpen(false);
    navigate("catalog");
  }

  function rememberSearch(value: string) {
    const term = value.trim();
    if (!term) return;
    setRecentSearches((current) => {
      const next = [
        term,
        ...current.filter((item) => item.toLowerCase() !== term.toLowerCase()),
      ].slice(0, 5);
      localStorage.setItem("nexora-recent-searches", JSON.stringify(next));
      return next;
    });
  }

  function chooseSearch(value: string, product?: Product) {
    setQuery(value);
    rememberSearch(value);
    setSearchOpen(false);
    setSearchActiveIndex(-1);
    if (product) openProduct(product);
    else navigate("catalog");
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!searchOpen) setSearchOpen(true);
    if (event.key === "Escape") {
      setSearchOpen(false);
      setSearchActiveIndex(-1);
      return;
    }
    if (!searchSuggestions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSearchActiveIndex(
        (current) => (current + 1) % searchSuggestions.length,
      );
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSearchActiveIndex((current) =>
        current <= 0 ? searchSuggestions.length - 1 : current - 1,
      );
    }
    if (event.key === "Enter" && searchActiveIndex >= 0) {
      event.preventDefault();
      const product = searchSuggestions[searchActiveIndex];
      chooseSearch(product.name, product);
    }
  }

  function startVoiceSearch() {
    const SpeechRecognition =
      (
        window as unknown as {
          SpeechRecognition?: new () => {
            lang: string;
            interimResults: boolean;
            start: () => void;
            onresult: (event: {
              results: ArrayLike<{ 0: { transcript: string } }>;
            }) => void;
            onend: () => void;
            onerror: () => void;
          };
          webkitSpeechRecognition?: new () => {
            lang: string;
            interimResults: boolean;
            start: () => void;
            onresult: (event: {
              results: ArrayLike<{ 0: { transcript: string } }>;
            }) => void;
            onend: () => void;
            onerror: () => void;
          };
        }
      ).SpeechRecognition ??
      (
        window as unknown as {
          webkitSpeechRecognition?: new () => {
            lang: string;
            interimResults: boolean;
            start: () => void;
            onresult: (event: {
              results: ArrayLike<{ 0: { transcript: string } }>;
            }) => void;
            onend: () => void;
            onerror: () => void;
          };
        }
      ).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showNotice("Voice search is not supported by this browser");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) {
        setQuery(transcript);
        setSearchOpen(true);
      }
    };
    recognition.onend = () => setVoiceListening(false);
    recognition.onerror = () => {
      setVoiceListening(false);
      showNotice("Voice search could not start");
    };
    setVoiceListening(true);
    recognition.start();
  }

  function askGuide(event: React.FormEvent) {
    event.preventDefault();
    const intent = guideQuestion.trim().toLowerCase();
    if (!intent) return;
    const aliases: Record<string, string[]> = {
      Phones: ["phone", "mobile", "smartphone"],
      Audio: ["audio", "headphone", "earbud", "speaker"],
      Computing: ["laptop", "computer", "computing"],
      Grocery: ["grocery", "food", "snack", "drink"],
      Wearables: ["watch", "wearable"],
      Cameras: ["camera", "photography"],
      Gaming: ["gaming", "game"],
      Kitchen: ["kitchen", "cooking"],
      "Home Appliances": ["appliance", "home"],
      "Personal Care": ["personal care", "grooming"],
    };
    const requestedCategory = Object.entries(aliases).find(([, words]) =>
      words.some((word) => intent.includes(word)),
    )?.[0];
    const budgetMatch = intent.match(
      /(?:under|below|less than)\s*(?:₹|rs\.?\s*)?([\d,]+)/i,
    );
    const budget = budgetMatch
      ? Number(budgetMatch[1].replaceAll(",", ""))
      : null;
    const candidates = products
      .filter(
        (product) =>
          !requestedCategory || product.categoryName === requestedCategory,
      )
      .filter((product) => !budget || product.price <= budget)
      .sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
      .slice(0, 3);
    if (!candidates.length) {
      setGuideAnswer(
        "I couldn’t find a catalogue match for those exact constraints. Try a broader category or a higher budget; I won’t invent unavailable products.",
      );
      return;
    }
    const constraint = [
      requestedCategory,
      budget ? `under ${money.format(budget)}` : "",
    ]
      .filter(Boolean)
      .join(" ");
    setGuideAnswer(
      `${constraint ? `For ${constraint}, ` : "Based on current catalogue signals, "}${candidates.map((item) => `${item.name} (${money.format(item.price)}, ${item.rating.toFixed(1)}★)`).join("; ")}. Rankings use recorded price and rating data, not generated claims.`,
    );
  }

  function selectVisualSearch(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showNotice("Choose an image file for visual discovery");
      return;
    }
    setVisualPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setGuideAnswer(
      "Image selected for visual discovery. Choose a category below to narrow the catalogue. Results are based on the category you select.",
    );
    setGuideOpen(true);
  }

  async function startSupportConversation() {
    if (!auth) {
      navigate("account");
      showNotice("Sign in to start protected support");
      return;
    }
    setSupportBusy(true);
    try {
      const existing = await fetch("/api/site/support/conversations", {
        cache: "no-store",
      });
      if (existing.ok) {
        const rows = (await existing.json()) as Array<{
          id: string;
          status: string;
        }>;
        const current = rows.find((row) => row.status !== "CLOSED");
        if (current) {
          setSupportConversationId(current.id);
          setSupportMode("support");
          return;
        }
      }
      const response = await fetch("/api/site/support/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: supportLanguage,
          intent: "GENERAL",
          subject: "Storefront support request",
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const created = (await response.json()) as { id: string };
      setSupportConversationId(created.id);
      setSupportMode("support");
    } catch (caught) {
      showNotice(
        caught instanceof Error ? caught.message : "Support could not start",
      );
    } finally {
      setSupportBusy(false);
    }
  }

  async function sendSupportMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!supportDraft.trim() || !supportConversationId) return;
    setSupportBusy(true);
    try {
      const response = await fetch("/api/site/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: supportConversationId,
          message: supportDraft,
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const result = (await response.json()) as {
        supportReply?: string;
        createdAt?: string;
      };
      const optimistic: SupportMessage = {
        id: crypto.randomUUID(),
        sender_role: "CUSTOMER",
        sender_email: auth?.user.email ?? "",
        body: supportDraft.trim(),
        delivery_status: "DELIVERED",
        read_at: null,
        created_at: new Date().toISOString(),
      };
      const supportReply: SupportMessage | null = result.supportReply
        ? {
            id: crypto.randomUUID(),
            sender_role: "SYSTEM",
            sender_email: "care@nexora.support",
            body: result.supportReply,
            delivery_status: "DELIVERED",
            read_at: null,
            created_at: result.createdAt ?? new Date().toISOString(),
          }
        : null;
      setSupportMessages((current) => [
        ...current,
        optimistic,
        ...(supportReply ? [supportReply] : []),
      ]);
      setSupportDraft("");
    } catch (caught) {
      showNotice(
        caught instanceof Error ? caught.message : "Message could not be sent",
      );
    } finally {
      setSupportBusy(false);
    }
  }

  async function uploadSupportFile(file: File | undefined) {
    if (!file || !supportConversationId) return;
    setSupportBusy(true);
    try {
      const form = new FormData();
      form.append("conversationId", supportConversationId);
      form.append("file", file);
      const response = await fetch("/api/site/support/files", {
        method: "POST",
        body: form,
      });
      if (!response.ok) throw new Error(await readApiError(response));
      showNotice(`${file.name} uploaded for protected review`);
    } catch (caught) {
      showNotice(
        caught instanceof Error
          ? caught.message
          : "Attachment could not be uploaded",
      );
    } finally {
      setSupportBusy(false);
      if (supportFileInput.current) supportFileInput.current.value = "";
    }
  }

  function cycleSort() {
    const next =
      sortModes[(sortModes.indexOf(sortMode) + 1) % sortModes.length];
    setSortMode(next);
    showNotice(`Products sorted by ${sortLabels[next].toLowerCase()}`);
  }

  return (
    <div
      className={`site-shell${darkMode ? " dark" : ""}`}
      onPointerDownCapture={(event) => {
        if (
          event.pointerType === "touch" &&
          (event.target as HTMLElement).closest("button") &&
          navigator.vibrate
        )
          navigator.vibrate(6);
      }}
      onTouchStart={(event) => {
        if (window.scrollY === 0) pullStartY.current = event.touches[0]?.clientY ?? null;
      }}
      onTouchMove={(event) => {
        if (pullStartY.current === null || window.scrollY > 0) return;
        setPullDistance(Math.min(86, Math.max(0, (event.touches[0].clientY - pullStartY.current) * 0.42)));
      }}
      onTouchEnd={() => {
        const shouldRefresh = pullDistance >= 72;
        pullStartY.current = null;
        setPullDistance(0);
        if (shouldRefresh) window.location.reload();
      }}
    >
      <div
        className={`pull-refresh-indicator${pullDistance >= 72 ? " ready" : ""}`}
        style={{ transform: `translate3d(-50%, ${pullDistance - 54}px, 0)` }}
        aria-hidden="true"
      >
        {pullDistance >= 72 ? "Release to refresh" : "Pull to refresh"}
      </div>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className={`topbar${headerScrolled ? " topbar-scrolled" : ""}`}>
        <button
          className="brand"
          onClick={() => navigate("home")}
          aria-label="Nexora home"
        >
          <span className="brand-mark brand-mark-animated" aria-hidden="true">
            <span>N</span>
            <i />
          </span>
          <span className="brand-word">Nexora</span>
        </button>
        <button
          className="mobile-theme-toggle"
          onClick={() => setDarkMode((current) => !current)}
          aria-label={darkMode ? "Use light theme" : "Use dark theme"}
          aria-pressed={darkMode}
        >
          {darkMode ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
        </button>
        <form
          className={`search${searchOpen ? " search-open" : ""}`}
          onSubmit={submitSearch}
          role="search"
          onFocus={() => setSearchOpen(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setSearchOpen(false);
              setSearchActiveIndex(-1);
            }
          }}
        >
          <Search className="search-leading" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSearchActiveIndex(-1);
              setSearchOpen(true);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search products, categories and more"
            aria-label="Search products"
            aria-expanded={searchOpen}
            aria-controls="nexora-search-panel"
            aria-activedescendant={
              searchActiveIndex >= 0
                ? `search-option-${searchSuggestions[searchActiveIndex]?.id}`
                : undefined
            }
            autoComplete="off"
          />
          {loading && query.trim() && (
            <LoaderCircle className="search-loader" aria-label="Searching" />
          )}
          {query && !loading && (
            <button
              className="search-icon-button"
              type="button"
              onClick={() => {
                setQuery("");
                setSearchActiveIndex(-1);
              }}
              aria-label="Clear search"
            >
              <X aria-hidden="true" />
            </button>
          )}
          <input
            ref={visualSearchInput}
            className="visual-search-input"
            type="file"
            accept="image/*"
            onChange={(event) => selectVisualSearch(event.target.files?.[0])}
            tabIndex={-1}
            aria-hidden="true"
          />
          <button
            className="search-icon-button visual-search-button"
            type="button"
            onClick={() => visualSearchInput.current?.click()}
            aria-label="Search using a product image"
          >
            <ScanSearch aria-hidden="true" />
          </button>
          <button
            className={`search-icon-button voice-search${voiceListening ? " listening" : ""}`}
            type="button"
            onClick={startVoiceSearch}
            aria-label={
              voiceListening ? "Listening for search" : "Search by voice"
            }
            aria-pressed={voiceListening}
          >
            <Mic aria-hidden="true" />
          </button>
          {searchOpen && (
            <div
              id="nexora-search-panel"
              className="search-suggestions"
              role={searchSuggestions.length ? "listbox" : "dialog"}
              aria-label="Search suggestions"
            >
              {query.trim() ? (
                <small>Suggested products</small>
              ) : (
                <small>Discover</small>
              )}
              {searchSuggestions.map((product) => (
                <button
                  type="button"
                  key={product.id}
                  id={`search-option-${product.id}`}
                  onClick={() => chooseSearch(product.name, product)}
                  role="option"
                  aria-selected={
                    searchSuggestions[searchActiveIndex]?.id === product.id
                  }
                  className={
                    searchSuggestions[searchActiveIndex]?.id === product.id
                      ? "active"
                      : ""
                  }
                >
                  <Image
                    src={product.imageUrl}
                    unoptimized
                    alt=""
                    width={42}
                    height={42}
                  />
                  <span>
                    <b>{product.name}</b>
                    <small>
                      {product.categoryName} · {money.format(product.price)}
                    </small>
                  </span>
                </button>
              ))}
              {!query.trim() && recentSearches.length > 0 && (
                <div className="search-chip-section">
                  <span>
                    <b>Recent searches</b>
                    <button
                      type="button"
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem("nexora-recent-searches");
                      }}
                    >
                      Clear
                    </button>
                  </span>
                  <div>
                    {recentSearches.map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => chooseSearch(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {!query.trim() && (
                <div className="search-chip-section">
                  <span>
                    <b>Trending now</b>
                  </span>
                  <div>
                    {trendingSearches.map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => chooseSearch(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {query.trim() && !searchSuggestions.length && !loading && (
                <div className="search-empty">
                  <Search aria-hidden="true" />
                  <b>No close matches yet</b>
                  <span>Press Enter to search the complete catalogue.</span>
                </div>
              )}
            </div>
          )}
        </form>
        <nav
          className="header-actions"
          aria-label="Primary navigation"
          data-active={
            view === "catalog"
              ? "catalog"
              : view === "account"
                ? "account"
                : view === "compare"
                  ? "compare"
                  : view === "cart"
                    ? "cart"
                    : "none"
          }
        >
          <button
            className={darkMode ? "active" : ""}
            onClick={() => setDarkMode((current) => !current)}
            aria-label={darkMode ? "Use light theme" : "Use dark theme"}
            aria-pressed={darkMode}
          >
            <span aria-hidden="true">{darkMode ? <Sun /> : <Moon />}</span>
            <span>Theme</span>
          </button>
          <button
            className={view === "catalog" ? "active" : ""}
            onClick={() => navigate("catalog")}
            aria-current={view === "catalog" ? "page" : undefined}
          >
            <span aria-hidden="true">
              <Store />
            </span>
            <span>Shop</span>
          </button>
          <button
            className={view === "account" ? "active" : ""}
            onClick={() => navigate("account")}
            aria-current={view === "account" ? "page" : undefined}
          >
            <span aria-hidden="true">
              <UserRound />
            </span>
            <span>Account</span>
          </button>
          <button
            className={`compare-action${view === "compare" ? " active" : ""}`}
            onClick={() => navigate("compare")}
            aria-current={view === "compare" ? "page" : undefined}
          >
            <span aria-hidden="true">
              <Columns3 />
            </span>
            <span>Compare</span>
            {comparisonIds.length > 0 && (
              <b key={comparisonIds.length}>{comparisonIds.length}</b>
            )}
          </button>
          <button
            className={`cart-action${view === "cart" ? " active" : ""}`}
            onClick={() => navigate("cart")}
            aria-current={view === "cart" ? "page" : undefined}
          >
            <span aria-hidden="true">
              <ShoppingBag />
            </span>
            <span>Bag</span>
            {cartCount > 0 && <b key={cartCount}>{cartCount}</b>}
          </button>
        </nav>
      </header>

      <nav className="category-strip" aria-label="Shop categories">
        {categories.slice(1).map((item) => (
          <button
            key={item}
            className={view === "catalog" && category === item ? "active" : ""}
            aria-current={
              view === "catalog" && category === item ? "page" : undefined
            }
            onClick={() => {
              setCategory(item);
              navigate("catalog");
            }}
          >
            {item}
          </button>
        ))}
        <span className="strip-spacer" />
        <button onClick={() => navigate("admin")}>Admin preview</button>
      </nav>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <button
          className={view === "home" ? "active" : ""}
          onClick={() => navigate("home")}
          aria-current={view === "home" ? "page" : undefined}
        >
          <House aria-hidden="true" />
          <span>Home</span>
        </button>
        <button
          className={view === "catalog" ? "active" : ""}
          onClick={() => navigate("catalog")}
          aria-current={view === "catalog" ? "page" : undefined}
        >
          <Store aria-hidden="true" />
          <span>Shop</span>
        </button>
        <button
          className={view === "account" ? "active" : ""}
          onClick={() => navigate("account")}
          aria-current={view === "account" ? "page" : undefined}
        >
          <UserRound aria-hidden="true" />
          <span>Account</span>
        </button>
        <button
          className={view === "compare" ? "active" : ""}
          onClick={() => navigate("compare")}
          aria-current={view === "compare" ? "page" : undefined}
        >
          <Columns3 aria-hidden="true" />
          <span>Compare</span>
          {comparisonIds.length > 0 && <b>{comparisonIds.length}</b>}
        </button>
        <button
          className={view === "cart" ? "active" : ""}
          onClick={() => navigate("cart")}
          aria-current={view === "cart" ? "page" : undefined}
        >
          <ShoppingBag aria-hidden="true" />
          <span>Bag</span>
          {cartCount > 0 && <b key={cartCount}>{cartCount}</b>}
        </button>
      </nav>

      {notice && (
        <div className="toast" role="status">
          ✓ {notice}
        </div>
      )}
      {dialog && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={() => setDialog(null)}
        >
          <section
            className="info-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="brand-mark" aria-hidden="true">
              N
            </span>
            <h2 id="dialog-title">{dialog.title}</h2>
            <p>{dialog.body}</p>
            <button className="primary" onClick={() => setDialog(null)}>
              Got it
            </button>
          </section>
        </div>
      )}

      <main id="main">
        {view === "home" && (
          <>
            <section className="hero wrap">
              <nav className="hero-product-nav" aria-label="Featured product navigation">
                <div>
                  <b>Nexora Edit</b>
                  <button className="active" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Overview</button>
                  <button onClick={() => openProduct(currentHero)}>Tech specs</button>
                  <button onClick={() => toggleComparison(currentHero.id)}>Compare</button>
                </div>
                <div>
                  <span>From {money.format(currentHero.price)}</span>
                  <button className="hero-buy" onClick={() => addToCart(currentHero)}>Buy</button>
                </div>
              </nav>
              <div className="hero-copy">
                <span className="eyebrow">Featured by Nexora</span>
                <h1>
                  Do remarkable things,
                  <br />
                  <span>every day.</span>
                </h1>
                <p key={currentHero.id} className="hero-product-copy">
                  {currentHero.name}. {currentHero.description}
                </p>
                <div className="hero-actions">
                  <button
                    className="primary"
                    onClick={() => openProduct(currentHero)}
                  >
                    Explore product
                  </button>
                  <button
                    className="secondary"
                    onClick={() => addToCart(currentHero)}
                  >
                    Add to bag <span aria-hidden="true">→</span>
                  </button>
                </div>
                <nav className="hero-colour-controls" aria-label="Choose featured product">
                  {heroProducts.map((product, index) => (
                    <button
                      key={product.id}
                      className={`hero-colour swatch-${index}${heroIndex === index ? " active" : ""}`}
                      onClick={() => setHeroIndex(index)}
                      aria-label={`Show ${product.name}`}
                      aria-pressed={heroIndex === index}
                    />
                  ))}
                </nav>
              </div>
              <div
                className="hero-visual"
                aria-label="Featured Nexora products"
              >
                {heroProducts.map((product, index) => (
                  <Image
                    key={product.id}
                    className={`hero-product-render${heroIndex % heroProducts.length === index ? " active" : ""}`}
                    src={product.imageUrl}
                    unoptimized
                    alt={product.name}
                    aria-hidden={heroIndex % heroProducts.length !== index}
                    width={1100}
                    height={1100}
                    priority={index === 0}
                  />
                ))}
                <div className="hero-gallery-controls">
                  <span>{(heroIndex % heroProducts.length) + 1} / {heroProducts.length}</span>
                  <button onClick={() => setHeroIndex((heroIndex + heroProducts.length - 1) % heroProducts.length)} aria-label="Previous featured electronics product">←</button>
                  <button onClick={() => setHeroIndex((heroIndex + 1) % heroProducts.length)} aria-label="Next featured electronics product">→</button>
                </div>
              </div>
            </section>

            <section
              className="trust-row wrap"
              aria-label="Nexora service promises"
            >
              <article>
                <span aria-hidden="true">◎</span>
                <div>
                  <b>Curated quality</b>
                  <small>Products worth bringing home</small>
                </div>
              </article>
              <article>
                <span aria-hidden="true">⌁</span>
                <div>
                  <b>Fast, tracked delivery</b>
                  <small>Clear updates from cart to door</small>
                </div>
              </article>
              <article>
                <span aria-hidden="true">♢</span>
                <div>
                  <b>Protected payments</b>
                  <small>Secure checkout and privacy</small>
                </div>
              </article>
              <article>
                <span aria-hidden="true">↺</span>
                <div>
                  <b>Easy returns</b>
                  <small>Simple support when plans change</small>
                </div>
              </article>
            </section>

            <ProductSection
              title="Trending across India"
              subtitle="Recognisable technology, home and lifestyle favourites"
              products={products.slice(0, 4)}
              onOpen={openProduct}
              onAdd={addToCart}
              wishlist={wishlist}
              onWishlist={toggleWishlist}
              loading={loading}
              onAll={() => navigate("catalog")}
            />

            {recentProducts.length > 0 && (
              <ProductSection
                title="Recently viewed"
                subtitle="Pick up where you left off"
                products={recentProducts}
                onOpen={openProduct}
                onAdd={addToCart}
                wishlist={wishlist}
                onWishlist={toggleWishlist}
                loading={false}
                onAll={() => navigate("catalog")}
              />
            )}

            <ProductSection
              title="Recommended for you"
              subtitle="Ranked from your browsing, saved items and bag activity"
              products={recommendedProducts}
              onOpen={openProduct}
              onAdd={addToCart}
              wishlist={wishlist}
              onWishlist={toggleWishlist}
              loading={loading}
              onAll={() => navigate("catalog")}
            />

            {products.some((product) => product.categoryName === "Grocery") && (
              <GroceryMarketplace
                products={products.filter(
                  (product) => product.categoryName === "Grocery",
                )}
                onOpen={openProduct}
                onAdd={addToCart}
                wishlist={wishlist}
                onWishlist={toggleWishlist}
                comparisonIds={comparisonIds}
                onCompare={toggleComparison}
                onAll={() => {
                  setCategory("Grocery");
                  navigate("catalog");
                }}
              />
            )}

            <section className="collection-grid wrap">
              <article className="collection-card collection-blue">
                <div>
                  <span className="eyebrow">Work beautifully</span>
                  <h2>Tools for your next big idea.</h2>
                  <p>Focused technology for creating, learning and building.</p>
                  <button
                    onClick={() => {
                      setCategory("Computing");
                      navigate("catalog");
                    }}
                  >
                    Explore computing →
                  </button>
                </div>
                <Image
                  src={
                    fallbackProducts.find(
                      (product) => product.categoryName === "Computing",
                    )?.imageUrl ?? fallbackProducts[0].imageUrl
                  }
                  unoptimized
                  alt="Laptop collection"
                  width={700}
                  height={700}
                />
              </article>
              <article className="collection-card collection-sand">
                <div>
                  <span className="eyebrow">Move your way</span>
                  <h2>Comfort in every step.</h2>
                  <p>Everyday essentials made to keep up.</p>
                  <button
                    onClick={() => {
                      setCategory("Lifestyle");
                      navigate("catalog");
                    }}
                  >
                    Shop lifestyle →
                  </button>
                </div>
                <Image
                  src={
                    fallbackProducts.find(
                      (product) => product.categoryName === "Lifestyle",
                    )?.imageUrl ?? fallbackProducts[0].imageUrl
                  }
                  unoptimized
                  alt="Lifestyle collection"
                  width={700}
                  height={700}
                />
              </article>
            </section>

            <ProductSection
              title="Explore more favourites"
              subtitle={`A preview of ${products.length} products available across the India showcase`}
              products={products.slice(24, 28)}
              onOpen={openProduct}
              onAdd={addToCart}
              wishlist={wishlist}
              onWishlist={toggleWishlist}
              loading={loading}
              onAll={() => navigate("catalog")}
            />

            <section className="testimonial wrap">
              <div>
                <span className="eyebrow">Customer story</span>
                <blockquote>
                  “The entire experience felt calm and effortless—from finding
                  the right headphones to knowing exactly when they would
                  arrive.”
                </blockquote>
                <p>
                  <b>Ananya R.</b> · Verified buyer
                </p>
              </div>
              <div className="testimonial-score">
                <strong>4.8</strong>
                <span>★★★★★</span>
                <small>Average across verified purchases</small>
              </div>
            </section>
          </>
        )}

        {view === "catalog" && (
          <section className="catalog wrap">
            <div className="page-heading">
              <div>
                <span className="eyebrow">Nexora collection</span>
                <h1>
                  {query
                    ? `Results for “${query}”`
                    : category === "All"
                      ? "Shop everything"
                      : category}
                </h1>
                <p>
                  Showing {mobileFiltered.length.toLocaleString("en-IN")} of{" "}
                  {catalogTotal.toLocaleString("en-IN")} products
                </p>
              </div>
              <button className="filter-button" onClick={cycleSort}>
                Sort: {sortLabels[sortMode]} ⌄
              </button>
            </div>
            <div className="info-banner">
              <span>i</span>
              <div>
                <b>
                  {usingDemoCatalog
                    ? "India showcase catalogue"
                    : "Live catalogue with India showcase expansion"}
                </b>
                <p>
                  Product models are real. Verified listings expose sourced
                  manufacturer specifications and media; unverified ratings are
                  never displayed. Price and inventory are Nexora catalogue
                  records, not live manufacturer stock.
                </p>
              </div>
            </div>
            {category === "Grocery" && (
              <div className="grocery-collection-banner">
                <div>
                  <span className="eyebrow">Nexora pantry</span>
                  <h2>Everyday essentials, professionally presented</h2>
                  <p>
                    Curated India-market products with retailer-sourced pack
                    details, consistent 1200 × 1200 imagery and transparent
                    complete shopping actions and location-aware delivery.
                  </p>
                </div>
                <ul aria-label="Grocery catalogue standards">
                  <li>64 genuine products</li>
                  <li>33 familiar brands</li>
                  <li>Verified pack sizes</li>
                  <li>Fast checkout enabled</li>
                </ul>
              </div>
            )}
            {category === "Phones" && (
              <MobileMarketplaceToolbar
                products={products}
                brand={mobileBrand}
                budget={mobileBudget}
                sort={sortMode}
                onBrand={setMobileBrand}
                onBudget={setMobileBudget}
                onSort={setSortMode}
              />
            )}
            <div className="filter-chips" aria-label="Filter by category">
              {categories.map((item) => (
                <button
                  key={item}
                  className={category === item ? "active" : ""}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            {mobileFiltered.length ? (
              <div className="product-grid catalog-grid">
                {mobileFiltered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpen={openProduct}
                    onAdd={addToCart}
                    liked={wishlist.includes(product.id)}
                    onWishlist={toggleWishlist}
                    compared={comparisonIds.includes(product.id)}
                    onCompare={toggleComparison}
                  />
                ))}
                {catalogHasMore && (
                  <button
                    className="primary catalog-load-more"
                    onClick={loadMoreProducts}
                    disabled={loading}
                  >
                    {loading ? "Loading more products…" : "Load more products"}
                  </button>
                )}
              </div>
            ) : (
              <EmptyState
                title="No products found"
                body="Try a broader search or choose another category."
                action="Clear filters"
                onAction={() => {
                  setQuery("");
                  setCategory("All");
                }}
              />
            )}
          </section>
        )}

        {view === "product" && (
          <>
            <PremiumProductPage
              key={selected.id}
              product={selected}
              liked={wishlist.includes(selected.id)}
              onBack={() => navigate("catalog")}
              onWishlist={toggleWishlist}
              compared={comparisonIds.includes(selected.id)}
              onCompare={toggleComparison}
              onAdd={addToCart}
              onBuyNow={(product, configuration) => {
                addToCart(product, configuration);
                navigate("cart");
              }}
              onMessage={showNotice}
            />
            <ProductSection
              title="Frequently bought together"
              subtitle="Popular complementary choices from the same department"
              products={products
                .filter(
                  (item) =>
                    item.id !== selected.id &&
                    item.categoryName === selected.categoryName,
                )
                .slice(0, 4)}
              onOpen={openProduct}
              onAdd={addToCart}
              wishlist={wishlist}
              onWishlist={toggleWishlist}
              loading={false}
              onAll={() => navigate("catalog")}
            />
            <ProductSection
              title="Similar products"
              subtitle="Compare nearby choices before deciding"
              products={products
                .filter(
                  (item) =>
                    item.id !== selected.id &&
                    item.categoryName === selected.categoryName,
                )
                .slice(4, 8)}
              onOpen={openProduct}
              onAdd={addToCart}
              wishlist={wishlist}
              onWishlist={toggleWishlist}
              loading={false}
              onAll={() => navigate("catalog")}
            />
            {recentProducts.filter((item) => item.id !== selected.id).length >
              0 && (
              <ProductSection
                title="Recently viewed"
                subtitle="Continue exploring products you opened earlier"
                products={recentProducts.filter(
                  (item) => item.id !== selected.id,
                )}
                onOpen={openProduct}
                onAdd={addToCart}
                wishlist={wishlist}
                onWishlist={toggleWishlist}
                loading={false}
                onAll={() => navigate("catalog")}
              />
            )}
          </>
        )}

        {view === "compare" && (
          <ComparisonView
            products={comparisonIds
              .map((id) => products.find((product) => product.id === id))
              .filter((product): product is Product => Boolean(product))}
            onRemove={toggleComparison}
            onShop={() => navigate("catalog")}
            onOpen={openProduct}
            onAdd={addToCart}
          />
        )}

        {view === "cart" && (
          <section className="bag-page wrap">
            <div className="page-heading">
              <div>
                <span className="eyebrow">Your selection</span>
                <h1>Your bag</h1>
                <p>
                  {cartCount} {cartCount === 1 ? "item" : "items"}
                </p>
              </div>
            </div>
            {cart.length === 0 ? (
              <EmptyState
                title="Your bag is ready for something good"
                body="Explore thoughtfully selected products and add your favourites here."
                action="Start shopping"
                onAction={() => navigate("catalog")}
              />
            ) : (
              <div className="bag-layout">
                <div className="bag-lines">
                  {cart.map((line) => (
                    <article className="bag-line" key={line.key}>
                      <Image
                        src={
                          line.configuration?.imageUrl ?? line.product.imageUrl
                        }
                        unoptimized
                        alt={
                          line.configuration?.variantName ?? line.product.name
                        }
                        width={290}
                        height={290}
                      />
                      <div className="bag-line-info">
                        <span>{line.product.categoryName}</span>
                        <h3>{line.product.name}</h3>
                        <p>
                          {line.configuration
                            ? `${line.configuration.colour} · ${line.configuration.storage} · ${line.configuration.sku}`
                            : "Standard configuration"}
                        </p>
                        <div className="quantity">
                          <button
                            onClick={() => changeQuantity(line.key, -1)}
                            aria-label={`Decrease ${line.product.name} quantity`}
                          >
                            −
                          </button>
                          <b>{line.quantity}</b>
                          <button
                            onClick={() => changeQuantity(line.key, 1)}
                            aria-label={`Increase ${line.product.name} quantity`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="bag-price">
                        <strong>
                          {money.format(
                            (line.configuration?.price ?? line.product.price) *
                              line.quantity,
                          )}
                        </strong>
                        <button
                          onClick={() =>
                            changeQuantity(line.key, -line.quantity)
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                <OrderSummary
                  subtotal={subtotal}
                  shipping={shipping}
                  total={total}
                  onCheckout={() => navigate("checkout")}
                  onMessage={showNotice}
                />
              </div>
            )}
          </section>
        )}

        {view === "checkout" && (
          <CheckoutView
            cart={cart}
            subtotal={subtotal}
            shipping={shipping}
            total={total}
            auth={auth}
            onAccount={() => navigate("account")}
            onCart={() => navigate("cart")}
            onShop={() => navigate("catalog")}
            onComplete={() => setCart([])}
            onMessage={showNotice}
          />
        )}

        {view === "account" && (
          <AccountView
            auth={auth}
            wishlistCount={wishlist.length}
            onShop={() => navigate("catalog")}
            onAction={openInfo}
            onAuthenticated={(user) => {
              setAuth({ user });
              if (!user.isAdmin) navigate("catalog");
            }}
          />
        )}
        {view === "admin" && (
          <AdminView
            auth={auth}
            products={products}
            onBack={() => navigate("home")}
            onAccount={() => navigate("account")}
            onAction={openInfo}
          />
        )}
        {view === "information" && (
          <SupportPage
            page={infoPage}
            onHome={() => navigate("home")}
            onNavigate={navigateInfo}
            onMessage={showNotice}
          />
        )}
      </main>

      <button
        className="nexora-guide-launcher"
        onClick={() => {
          setSupportMode("support");
          setGuideOpen(true);
        }}
        aria-label="Open customer support"
        aria-expanded={guideOpen}
      >
        <Headphones aria-hidden="true" />
        <span>Customer Support</span>
      </button>
      {guideOpen && (
        <aside
          className="nexora-guide"
          role="dialog"
          aria-modal="false"
          aria-labelledby="nexora-guide-title"
        >
          <header>
            <div>
              <span>
                {supportMode === "guide" ? (
                  <Sparkles aria-hidden="true" />
                ) : (
                  <Headphones aria-hidden="true" />
                )}
              </span>
              <div>
                <small>
                  Protected customer support
                </small>
                <h2 id="nexora-guide-title">
                  Nexora Support
                </h2>
              </div>
            </div>
            <button
              onClick={() => setGuideOpen(false)}
              aria-label="Close support"
            >
              <X aria-hidden="true" />
            </button>
          </header>
          {supportMode === "guide" ? (
            <>
              {visualPreview && (
                <div className="guide-visual">
                  <img src={visualPreview} alt="Uploaded product reference" />
                  <button onClick={() => setVisualPreview("")}>
                    Remove image
                  </button>
                </div>
              )}
              <div className="guide-answer" aria-live="polite">
                <Sparkles aria-hidden="true" />
                <p>{guideAnswer}</p>
              </div>
              <div className="guide-categories" aria-label="Product categories">
                {categories.slice(1, 7).map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setCategory(item);
                      setGuideOpen(false);
                      navigate("catalog");
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
              {recommendedProducts[0] && (
                <button
                  className="guide-recommendation"
                  onClick={() => {
                    setGuideOpen(false);
                    openProduct(recommendedProducts[0]);
                  }}
                >
                  <Image
                    src={recommendedProducts[0].imageUrl}
                    unoptimized
                    alt=""
                    width={54}
                    height={54}
                  />
                  <span>
                    <small>From your shopping signals</small>
                    <b>{recommendedProducts[0].name}</b>
                  </span>
                  <ArrowRight aria-hidden="true" />
                </button>
              )}
              <form onSubmit={askGuide}>
                <label htmlFor="guide-question" className="sr-only">
                  Ask for product guidance
                </label>
                <input
                  id="guide-question"
                  value={guideQuestion}
                  onChange={(event) => setGuideQuestion(event.target.value)}
                  placeholder="Try ‘phones under ₹50,000’"
                />
                <button type="submit" aria-label="Ask Nexora Guide">
                  <ArrowRight aria-hidden="true" />
                </button>
              </form>
              <p className="guide-disclosure">
                Uses catalogue facts and your device-local shopping signals. It
                does not invent specifications or availability.
              </p>
            </>
          ) : (
            <>
              <div className="support-presence">
                <i />
                <span>
                  <b>Support queue</b>
                  <small>
                    Messages are securely delivered. Human availability is
                    confirmed only after an agent joins.
                  </small>
                </span>
                <select
                  value={supportLanguage}
                  onChange={(event) =>
                    setSupportLanguage(event.target.value as "en" | "ta" | "hi")
                  }
                  aria-label="Support language"
                >
                  <option value="en">English</option>
                  <option value="ta">தமிழ்</option>
                  <option value="hi">हिन्दी</option>
                </select>
              </div>
              {!supportConversationId ? (
                <div className="support-signin">
                  <Headphones />
                  <h3>
                    {auth
                      ? "Start a protected conversation"
                      : "Sign in for customer support"}
                  </h3>
                  <p>
                    Conversation history, orders and attachments stay linked to
                    your verified account.
                  </p>
                  <button
                    className="primary"
                    disabled={supportBusy}
                    onClick={startSupportConversation}
                  >
                    {auth ? "Start conversation" : "Sign in securely"}
                  </button>
                </div>
              ) : (
                <>
                  <div className="support-message-list" aria-live="polite">
                    {supportMessages.map((message) => (
                      <article
                        key={message.id}
                        className={message.sender_role.toLowerCase()}
                      >
                        <span>{message.body}</span>
                        <small>
                          {new Date(message.created_at).toLocaleTimeString(
                            "en-IN",
                            { hour: "2-digit", minute: "2-digit" },
                          )}{" "}
                          · {message.delivery_status.toLowerCase()}
                        </small>
                      </article>
                    ))}
                  </div>
                  <form
                    className="support-compose"
                    onSubmit={sendSupportMessage}
                  >
                    <input
                      ref={supportFileInput}
                      className="visual-search-input"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      onChange={(event) =>
                        uploadSupportFile(event.target.files?.[0])
                      }
                    />
                    <button
                      type="button"
                      onClick={() => supportFileInput.current?.click()}
                      aria-label="Attach image or PDF"
                    >
                      <Paperclip />
                    </button>
                    <label htmlFor="support-message" className="sr-only">
                      Message support
                    </label>
                    <input
                      id="support-message"
                      value={supportDraft}
                      onChange={(event) => setSupportDraft(event.target.value)}
                      placeholder="Write a message…"
                      maxLength={4000}
                    />
                    <button
                      type="submit"
                      disabled={supportBusy || !supportDraft.trim()}
                      aria-label="Send message"
                    >
                      <ArrowRight />
                    </button>
                  </form>
                  <p className="guide-disclosure">
                    {"Conversation history refreshes every few seconds. WebSocket presence and automated malware approval are not represented as active."}
                  </p>
                </>
              )}
            </>
          )}
        </aside>
      )}

      <ProfessionalFooter
        onView={navigate}
        onInfo={navigateInfo}
        onMessage={showNotice}
      />
      {showBackToTop && (
        <button
          className="back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
        >
          ↑
        </button>
      )}
    </div>
  );
}

async function readApiError(response: Response) {
  try {
    const body = await response.json();
    return String(
      body.message || body.error || `Request failed (${response.status})`,
    );
  } catch {
    return `Request failed (${response.status})`;
  }
}

function CheckoutView({
  cart,
  subtotal,
  shipping,
  total,
  auth,
  onAccount,
  onCart,
  onShop,
  onComplete,
  onMessage,
}: {
  cart: CartLine[];
  subtotal: number;
  shipping: number;
  total: number;
  auth: AuthSession | null;
  onAccount: () => void;
  onCart: () => void;
  onShop: () => void;
  onComplete: () => void;
  onMessage: (message: string) => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState<
    "RAZORPAY" | "UPI" | "COD"
  >("RAZORPAY");
  const [form, setForm] = useState({
    email: auth?.user.email ?? "",
    firstName: auth?.user.name.split(" ")[0] ?? "",
    lastName: auth?.user.name.split(" ").slice(1).join(" ") ?? "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [order, setOrder] = useState<OrderCreated | null>(null);
  const [instructions, setInstructions] = useState<UpiInstructions | null>(
    null,
  );
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [payerReference, setPayerReference] = useState("");
  const [paymentState, setPaymentState] = useState<PaymentFlowState>("IDLE");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const paymentInFlight = useRef(false);
  const checkoutIdempotencyKey = useRef("");
  const busy = [
    "CREATING_ORDER",
    "VERIFYING_PAYMENT",
    "UPLOADING_PROOF",
  ].includes(paymentState);

  const screenshotPreview = useMemo(
    () => (screenshot ? URL.createObjectURL(screenshot) : ""),
    [screenshot],
  );

  useEffect(
    () => () => {
      if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    },
    [screenshotPreview],
  );

  function field(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function loadRazorpayCheckout() {
    if (window.Razorpay) return;
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
      );
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error("Secure checkout could not be loaded.")),
          { once: true },
        );
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Secure checkout could not be loaded."));
      document.head.appendChild(script);
    });
    if (!window.Razorpay)
      throw new Error("Secure checkout is unavailable in this browser.");
  }

  async function verifyRazorpayPayment(
    created: OrderCreated,
    success: RazorpaySuccess,
  ) {
    const response = await fetch("/api/site/razorpay/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber: created.orderNumber, ...success }),
    });
    if (!response.ok) throw new Error(await readApiError(response));
    await response.json();
    setPaymentState("PAYMENT_SUCCESS");
    paymentInFlight.current = false;
    checkoutIdempotencyKey.current = "";
    setSubmitted(true);
    onComplete();
    onMessage(`Payment verified for ${created.orderNumber}`);
  }

  async function cancelRazorpayPayment(orderNumber: string) {
    await fetch("/api/site/razorpay/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber }),
    }).catch(() => undefined);
  }

  async function cancelUpiPayment(orderNumber: string) {
    const response = await fetch("/api/site/orders/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber }),
    });
    if (!response.ok) throw new Error(await readApiError(response));
  }

  async function cancelCurrentPayment() {
    if (paymentState === "CREATING_ORDER" || paymentState === "VERIFYING_PAYMENT")
      return;
    setError("");
    try {
      if (order?.paymentStatus === "PENDING" && instructions)
        await cancelUpiPayment(order.orderNumber);
      else if (order?.razorpay)
        await cancelRazorpayPayment(order.orderNumber);
      setPaymentState("PAYMENT_CANCELLED");
      setOrder(null);
      setInstructions(null);
      setScreenshot(null);
      setPayerReference("");
      paymentInFlight.current = false;
      checkoutIdempotencyKey.current = "";
      onMessage("Payment cancelled. You can try again when you're ready.");
    } catch (caught) {
      setPaymentState("PAYMENT_FAILED");
      setError(caught instanceof Error ? caught.message : "Payment cancellation could not be completed.");
    }
  }

  async function openRazorpay(created: OrderCreated) {
    if (!created.razorpay)
      throw new Error("Secure payment details were not created.");
    await loadRazorpayCheckout();
    const Checkout = window.Razorpay!;
    const instance = new Checkout({
      key: created.razorpay.keyId,
      amount: created.razorpay.amountPaise,
      currency: created.razorpay.currency,
      name: created.razorpay.merchantName,
      description: created.razorpay.description,
      order_id: created.razorpay.providerOrderId,
      prefill: {
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        contact: form.phone,
      },
      notes: { nexora_order_number: created.orderNumber },
      theme: { color: "#165dff" },
      retry: { enabled: true, max_count: 3 },
      modal: {
        confirm_close: true,
        ondismiss: () => {
          void cancelRazorpayPayment(created.orderNumber).finally(() => {
            paymentInFlight.current = false;
            checkoutIdempotencyKey.current = "";
            setPaymentState("PAYMENT_CANCELLED");
            setOrder(null);
            setError("Payment cancelled. You can try again when you're ready.");
          });
        },
      },
      handler: (success: RazorpaySuccess) => {
        setPaymentState("VERIFYING_PAYMENT");
        void verifyRazorpayPayment(created, success)
          .catch((caught) => {
            paymentInFlight.current = false;
            setPaymentState("PAYMENT_FAILED");
            setError(
              caught instanceof Error
                ? caught.message
                : "Payment verification failed.",
            );
          });
      },
    });
    instance.on("payment.failed", () => {
      void cancelRazorpayPayment(created.orderNumber).finally(() => {
        paymentInFlight.current = false;
        checkoutIdempotencyKey.current = "";
        setPaymentState("PAYMENT_FAILED");
        setOrder(null);
        setError("The payment failed. No order was confirmed; please retry.");
      });
    });
    instance.open();
  }

  async function createOrder() {
    if (paymentInFlight.current) return;
    setError("");
    if (!auth)
      return setError(
        "Sign in securely before creating a protected order reference.",
      );
    if (
      !form.email ||
      !form.firstName ||
      !form.phone ||
      !form.line1 ||
      !form.city ||
      !form.state ||
      !/^\d{5,6}$/.test(form.pincode)
    ) {
      return setError(
        "Complete all delivery fields and enter a valid 5 or 6 digit PIN code.",
      );
    }
    paymentInFlight.current = true;
    if (!checkoutIdempotencyKey.current)
      checkoutIdempotencyKey.current = crypto.randomUUID();
    setPaymentState("CREATING_ORDER");
    try {
      const response = await fetch("/api/site/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idempotencyKey: checkoutIdempotencyKey.current,
          paymentMethod,
          deliveryAddress: {
            fullName: `${form.firstName} ${form.lastName}`.trim(),
            email: form.email,
            phone: form.phone,
            line1: form.line1,
            line2: "",
            city: form.city,
            state: form.state,
            pincode: form.pincode,
          },
          items: cart.map((line) => ({
            productId: line.product.id,
            variantSku: line.configuration?.sku,
            quantity: line.quantity,
          })),
          subtotal,
          gst: 0,
          shipping,
          total,
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const created = (await response.json()) as OrderCreated;
      setOrder(created);
      if (paymentMethod === "COD") {
        paymentInFlight.current = false;
        checkoutIdempotencyKey.current = "";
        setPaymentState("PAYMENT_SUCCESS");
        setSubmitted(true);
        onComplete();
        return;
      }
      if (paymentMethod === "RAZORPAY") {
        setPaymentState("PAYMENT_PENDING");
        onMessage(`Secure checkout created for ${created.orderNumber}`);
        await openRazorpay(created);
        return;
      }
      if (!created.instructions)
        throw new Error("UPI instructions were not created.");
      setInstructions(created.instructions);
      paymentInFlight.current = false;
      setPaymentState("PAYMENT_PENDING");
      onMessage(`Secure payment reference ${created.orderNumber} created`);
    } catch (caught) {
      paymentInFlight.current = false;
      setPaymentState("PAYMENT_FAILED");
      setError(
        caught instanceof Error
          ? caught.message
          : "The order service is unavailable.",
      );
    }
  }

  async function uploadProof() {
    setError("");
    if (!auth || !order || !screenshot)
      return setError("Choose a payment screenshot before submitting.");
    if (screenshot.size > 5 * 1024 * 1024)
      return setError("Payment screenshots must be 5 MB or smaller.");
    if (paymentInFlight.current) return;
    paymentInFlight.current = true;
    setPaymentState("UPLOADING_PROOF");
    try {
      const data = new FormData();
      data.append("orderNumber", order.orderNumber);
      data.append("screenshot", screenshot);
      if (payerReference.trim())
        data.append("payerReference", payerReference.trim());
      const response = await fetch("/api/site/payment-proof", {
        method: "POST",
        body: data,
      });
      if (!response.ok) throw new Error(await readApiError(response));
      await response.json();
      paymentInFlight.current = false;
      setPaymentState("PAYMENT_SUCCESS");
      checkoutIdempotencyKey.current = "";
      setSubmitted(true);
      onComplete();
    } catch (caught) {
      paymentInFlight.current = false;
      setPaymentState("PAYMENT_FAILED");
      setError(
        caught instanceof Error
          ? caught.message
          : "The screenshot could not be submitted.",
      );
    }
  }

  if (cart.length === 0 && !submitted)
    return (
      <section className="checkout-page wrap">
        <EmptyState
          title="Nothing to check out yet"
          body="Add an item before continuing to checkout."
          action="Browse products"
          onAction={onShop}
        />
      </section>
    );
  if (submitted)
    return (
      <section className="checkout-page wrap">
        <div className="payment-success">
          <span>✓</span>
          <p className="eyebrow">Order received</p>
          <h1>
            {paymentMethod === "UPI"
              ? "Payment pending verification"
              : paymentMethod === "RAZORPAY"
                ? "Payment verified"
                : "Order placed"}
          </h1>
          <p>
            {paymentMethod === "UPI"
              ? "Your screenshot was saved securely. We have not marked the payment successful—an administrator must verify it before the order is confirmed."
              : paymentMethod === "RAZORPAY"
                ? "Razorpay confirmed the captured payment and Nexora verified its signature before confirming your order."
                : "Your cash-on-delivery order has been created."}
          </p>
          {order && (
            <div className="order-reference">
              <small>Order ID</small>
              <b>{order.orderNumber}</b>
              <small>
                {money.format(Number(instructions?.amount ?? order.total))}
              </small>
            </div>
          )}
          <button className="primary" onClick={onShop}>
            Continue shopping
          </button>
        </div>
      </section>
    );

  return (
    <section className="checkout-page wrap">
      <div className="checkout-progress">
        <span className="active">1</span>
        <b>Delivery</b>
        <i />
        <span className={order ? "active" : ""}>2</span>
        <b>Payment</b>
        <i />
        <span>3</span>
        <b>Verification</b>
      </div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Protected checkout</span>
          <h1>Complete your order</h1>
          <p>
            The server calculates the final amount. Razorpay payments are
            signature-verified before confirmation.
          </p>
        </div>
        <span className="secure-label">♢ Secure verified checkout</span>
      </div>
      <div className="checkout-layout">
        <div className="checkout-form">
          {!auth && (
            <div className="checkout-alert">
              <b>Sign in required</b>
              <p>
                Orders and payment screenshots are protected by your Nexora
                account.
              </p>
              <button className="secondary" onClick={onAccount}>
                Sign in or create account
              </button>
            </div>
          )}
          <section className="form-card">
            <div className="form-title">
              <span>1</span>
              <div>
                <h2>Contact and delivery</h2>
                <p>Used only for this order and delivery updates.</p>
              </div>
            </div>
            <div className="field-grid">
              <label className="full">
                Email address
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => field("email", event.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              <label>
                First name
                <input
                  value={form.firstName}
                  onChange={(event) => field("firstName", event.target.value)}
                  placeholder="First name"
                />
              </label>
              <label>
                Last name
                <input
                  value={form.lastName}
                  onChange={(event) => field("lastName", event.target.value)}
                  placeholder="Last name"
                />
              </label>
              <label className="full">
                Phone number
                <input
                  inputMode="tel"
                  value={form.phone}
                  onChange={(event) => field("phone", event.target.value)}
                  placeholder="98765 43210"
                />
              </label>
              <label className="full">
                Address line
                <input
                  value={form.line1}
                  onChange={(event) => field("line1", event.target.value)}
                  placeholder="House number and street"
                />
              </label>
              <label>
                City
                <input
                  value={form.city}
                  onChange={(event) => field("city", event.target.value)}
                  placeholder="Chennai"
                />
              </label>
              <label>
                State
                <input
                  value={form.state}
                  onChange={(event) => field("state", event.target.value)}
                  placeholder="Tamil Nadu"
                />
              </label>
              <label>
                PIN code
                <input
                  inputMode="numeric"
                  value={form.pincode}
                  onChange={(event) =>
                    field(
                      "pincode",
                      event.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  placeholder="600001"
                />
              </label>
            </div>
          </section>
          <section className="form-card">
            <div className="form-title">
              <span>2</span>
              <div>
                <h2>Payment method</h2>
                <p>
                  Choose verified online payment, direct UPI with manual proof
                  review, or cash on delivery.
                </p>
              </div>
            </div>
            <div className="payment-options">
              <label
                className={
                  paymentMethod === "RAZORPAY" ? "selected-payment" : ""
                }
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "RAZORPAY"}
                  disabled={busy || Boolean(order)}
                  onChange={() => {
                    setPaymentMethod("RAZORPAY");
                    setOrder(null);
                    setInstructions(null);
                  }}
                />
                <span>Secure online payment</span>
                <small>
                  UPI, cards, net banking and supported wallets via Razorpay
                </small>
              </label>
              <label
                className={paymentMethod === "UPI" ? "selected-payment" : ""}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "UPI"}
                  disabled={busy || Boolean(order)}
                  onChange={() => {
                    setPaymentMethod("UPI");
                    setOrder(null);
                    setInstructions(null);
                  }}
                />
                <span>Pay via UPI QR</span>
                <small>
                  Google Pay, PhonePe, Paytm, BHIM and other UPI apps
                </small>
              </label>
              <label
                className={paymentMethod === "COD" ? "selected-payment" : ""}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "COD"}
                  disabled={busy || Boolean(order)}
                  onChange={() => {
                    setPaymentMethod("COD");
                    setOrder(null);
                    setInstructions(null);
                  }}
                />
                <span>Cash on delivery</span>
                <small>Pay when your order arrives</small>
              </label>
            </div>
            {!order && (
              <div className="payment-actions">
                <button className="secondary" disabled={busy} onClick={onCart}>
                  Back to cart
                </button>
                <button
                  className="primary"
                  disabled={busy || !auth}
                  onClick={createOrder}
                >
                  {busy
                    ? paymentMethod === "RAZORPAY"
                      ? "Processing payment…"
                      : "Creating secure reference…"
                    : paymentMethod === "RAZORPAY"
                      ? `Pay securely · ${money.format(total)}`
                      : paymentMethod === "UPI"
                        ? "Create UPI payment reference"
                        : `Place COD order · ${money.format(total)}`}
                </button>
              </div>
            )}
          </section>
          {instructions && (
            <section className="form-card upi-card">
              <div className="form-title">
                <span>3</span>
                <div>
                  <h2>Pay the exact amount</h2>
                  <p>Reference {instructions.orderNumber}</p>
                </div>
              </div>
              <div className="upi-layout">
                <div className="upi-qr">
                  <Image
                    src="/upi-qr-surya.jpeg"
                    unoptimized
                    alt={`UPI QR for ${instructions.merchantName}, ${instructions.merchantUpiId}`}
                    width={600}
                    height={800}
                  />
                  <p>
                    This QR identifies the destination only. Enter the exact
                    amount shown.
                  </p>
                </div>
                <div className="upi-details">
                  <span className="verification-pill">Awaiting your proof</span>
                  <small>Exact amount</small>
                  <strong>{money.format(Number(instructions.amount))}</strong>
                  <small>Paying</small>
                  <b>{instructions.merchantName}</b>
                  <code>{instructions.merchantUpiId}</code>
                  <a
                    className="primary upi-app-button"
                    href={instructions.paymentUri}
                  >
                    Pay via UPI App
                  </a>
                  <button
                    className="secondary upi-cancel-button"
                    disabled={busy}
                    onClick={() => void cancelCurrentPayment()}
                  >
                    Cancel payment
                  </button>
                  <ol>
                    <li>
                      Pay exactly {money.format(Number(instructions.amount))}{" "}
                      using the button or QR.
                    </li>
                    <li>
                      Confirm the recipient and amount inside your UPI app.
                    </li>
                    <li>
                      Return here and upload the successful payment screenshot.
                    </li>
                    <li>
                      Your order remains pending until an administrator verifies
                      it.
                    </li>
                  </ol>
                </div>
              </div>
              <div className="proof-upload">
                <label>
                  UPI transaction reference / UTR{" "}
                  <span>Optional, but helps verification</span>
                  <input
                    value={payerReference}
                    onChange={(event) =>
                      setPayerReference(event.target.value.slice(0, 40))
                    }
                    placeholder="Enter the reference shown in your UPI app"
                  />
                </label>
                <label className="upload-drop">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) =>
                      setScreenshot(event.target.files?.[0] ?? null)
                    }
                  />
                  <span>
                    {screenshot ? screenshot.name : "Choose payment screenshot"}
                  </span>
                  <small>PNG, JPEG or WebP · maximum 5 MB</small>
                </label>
                {screenshotPreview && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="proof-preview"
                      src={screenshotPreview}
                      alt="Selected payment screenshot preview"
                    />
                  </>
                )}
                <button
                  className="primary full-button"
                  disabled={busy || !screenshot}
                  onClick={uploadProof}
                >
                  {busy
                    ? "Saving proof securely…"
                    : "Submit proof for verification"}
                </button>
                <button
                  className="secondary full-button"
                  disabled={busy}
                  onClick={() => void cancelCurrentPayment()}
                >
                  Back to checkout / cancel payment
                </button>
                <p className="manual-warning">
                  A screenshot is evidence for review, not proof of settlement.
                  Nexora never marks this payment successful automatically.
                </p>
              </div>
            </section>
          )}
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
        </div>
        <OrderSummary
          subtotal={subtotal}
          shipping={shipping}
          total={Number(instructions?.amount ?? total)}
          compact
          onCheckout={order ? uploadProof : createOrder}
          onMessage={onMessage}
        />
      </div>
    </section>
  );
}

function ProductSection({
  title,
  subtitle,
  products,
  onOpen,
  onAdd,
  wishlist,
  onWishlist,
  loading,
  onAll,
}: {
  title: string;
  subtitle: string;
  products: Product[];
  onOpen: (product: Product) => void;
  onAdd: (product: Product) => void;
  wishlist: number[];
  onWishlist: (id: number) => void;
  loading: boolean;
  onAll: () => void;
}) {
  return (
    <section className="product-section wrap">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <button onClick={onAll}>
          View all <span aria-hidden="true">→</span>
        </button>
      </div>
      {loading ? (
        <div className="product-grid">
          {[1, 2, 3, 4].map((item) => (
            <div className="skeleton-card" key={item}>
              <i />
              <b />
              <span />
              <span />
            </div>
          ))}
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpen={onOpen}
              onAdd={onAdd}
              liked={wishlist.includes(product.id)}
              onWishlist={onWishlist}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function MobileMarketplaceToolbar({
  products,
  brand,
  budget,
  sort,
  onBrand,
  onBudget,
  onSort,
}: {
  products: Product[];
  brand: string;
  budget: string;
  sort: SortMode;
  onBrand: (value: string) => void;
  onBudget: (value: string) => void;
  onSort: (value: SortMode) => void;
}) {
  const brands = Array.from(
    new Set(
      products
        .filter((product) => product.categoryName === "Phones")
        .map((product) => product.brand ?? product.name.split(" ")[0]),
    ),
  ).sort();
  return (
    <section
      className="mobile-marketplace-toolbar"
      aria-label="Smartphone marketplace controls"
    >
      <div className="mobile-marketplace-hero">
        <div>
          <span className="eyebrow">Nexora Mobile</span>
          <h2>Find the right smartphone</h2>
          <p>
            India-market models with source-backed details, clear pricing and
            configuration-aware shopping.
          </p>
        </div>
        <div className="mobile-marketplace-metrics">
          <span>
            <b>
              {
                products.filter((product) => product.categoryName === "Phones")
                  .length
              }
            </b>{" "}
            verified listings
          </span>
          <span>
            <b>{brands.length}</b> represented brands
          </span>
          <span>
            <b>4</b> products per comparison
          </span>
        </div>
      </div>
      <div className="mobile-filter-grid">
        <label>
          Brand
          <select
            value={brand}
            onChange={(event) => onBrand(event.target.value)}
          >
            <option>All brands</option>
            {brands.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Price
          <select
            value={budget}
            onChange={(event) => onBudget(event.target.value)}
          >
            <option>All prices</option>
            <option value="0-20000">Under ₹20,000</option>
            <option value="20000-40000">₹20,000–₹40,000</option>
            <option value="40000-70000">₹40,000–₹70,000</option>
            <option value="70000-0">Above ₹70,000</option>
          </select>
        </label>
        <label>
          Sort by
          <select
            value={sort}
            onChange={(event) => onSort(event.target.value as SortMode)}
          >
            {sortModes.map((mode) => (
              <option value={mode} key={mode}>
                {sortLabels[mode]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div
        className="mobile-capability-strip"
        aria-label="Smartphone catalogue capabilities"
      >
        <span>5G ready</span>
        <span>Colour variants</span>
        <span>Storage options</span>
        <span>Official-source profiles</span>
        <span>EMI estimate</span>
        <span>Exchange eligibility</span>
      </div>
    </section>
  );
}

function GroceryMarketplace({
  products,
  onOpen,
  onAdd,
  wishlist,
  onWishlist,
  comparisonIds,
  onCompare,
  onAll,
}: {
  products: Product[];
  onOpen: (product: Product) => void;
  onAdd: (product: Product) => void;
  wishlist: number[];
  onWishlist: (id: number) => void;
  comparisonIds: number[];
  onCompare: (id: number) => void;
  onAll: () => void;
}) {
  const tabs = [
    "Trending today",
    "Today's deals",
    "New arrivals",
    "Best sellers",
    "Daily essentials",
    "Popular brands",
    "Recommended for you",
    "Continue shopping",
    "Frequently bought together",
    "Customers also bought",
    "Top rated products",
  ];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const ranked = useMemo(() => {
    const copy = [...products];
    if (activeTab === "Today's deals")
      return copy.sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
    if (activeTab === "New arrivals")
      return copy.sort(
        (a, b) =>
          Number(Boolean(b.newArrival)) - Number(Boolean(a.newArrival)) ||
          b.id - a.id,
      );
    if (activeTab === "Best sellers")
      return copy.sort(
        (a, b) =>
          Number(Boolean(b.bestSeller)) - Number(Boolean(a.bestSeller)) ||
          b.reviews - a.reviews,
      );
    if (activeTab === "Top rated products")
      return copy.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    if (activeTab === "Popular brands")
      return copy.sort((a, b) => (a.brand ?? "").localeCompare(b.brand ?? ""));
    return copy.sort((a, b) => b.reviews - a.reviews || b.rating - a.rating);
  }, [activeTab, products]);
  const brands = Array.from(
    new Set(products.map((product) => product.brand).filter(Boolean)),
  ).slice(0, 10);

  return (
    <section
      className="grocery-marketplace wrap"
      aria-labelledby="grocery-marketplace-title"
    >
      <div className="section-title">
        <div>
          <span className="eyebrow">Nexora Grocery</span>
          <h2 id="grocery-marketplace-title">Fresh picks for every day</h2>
          <p>
            Pantry, beverages, snacks, personal care and home essentials in one
            curated destination
          </p>
        </div>
        <button onClick={onAll}>
          Shop all grocery <span aria-hidden="true">→</span>
        </button>
      </div>
      <div
        className="grocery-discovery-tabs"
        role="tablist"
        aria-label="Grocery collections"
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="grocery-brand-strip" aria-label="Popular grocery brands">
        {brands.map((brand) => (
          <button key={brand} onClick={() => setActiveTab("Popular brands")}>
            {brand}
          </button>
        ))}
      </div>
      <div className="product-grid grocery-marketplace-grid">
        {ranked.slice(0, 4).map((product) => (
          <ProductCard
            key={`${activeTab}-${product.id}`}
            product={product}
            onOpen={onOpen}
            onAdd={onAdd}
            liked={wishlist.includes(product.id)}
            onWishlist={onWishlist}
            compared={comparisonIds.includes(product.id)}
            onCompare={onCompare}
          />
        ))}
      </div>
    </section>
  );
}

function ProductCard({
  product,
  onOpen,
  onAdd,
  liked,
  onWishlist,
  compared = false,
  onCompare,
}: {
  product: Product;
  onOpen: (product: Product) => void;
  onAdd: (product: Product) => void;
  liked: boolean;
  onWishlist: (id: number) => void;
  compared?: boolean;
  onCompare?: (id: number) => void;
}) {
  const saved = product.previousPrice
    ? Math.max(0, product.previousPrice - product.price)
    : 0;
  const marketplaceBadges = [
    product.bestSeller ? "Bestseller" : null,
    product.newArrival ? "New arrival" : null,
    (product.discount ?? 0) >= 30 ? "Limited offer" : null,
    product.rating >= 4.4 ? "Top rated" : null,
    product.stockQuantity > 0 ? "Fast delivery" : null,
  ]
    .filter(Boolean)
    .slice(0, 2) as string[];

  async function shareProduct() {
    const url = `${window.location.origin}/products/${productSlug(product.name)}`;
    if (navigator.share) {
      await navigator
        .share({ title: product.name, url })
        .catch(() => undefined);
    } else {
      await navigator.clipboard?.writeText(url);
    }
  }

  return (
    <article
      className={`product-card${product.categoryName === "Grocery" ? " grocery-card" : ""}${product.categoryName === "Phones" ? " mobile-product-card" : ""}`}
    >
      <div className="product-image" onClick={() => onOpen(product)}>
        <div className="grocery-badge-rail">
          {(marketplaceBadges.length ? marketplaceBadges : [product.badge])
            .filter(Boolean)
            .map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
        </div>
        <button
          className={liked ? "liked" : ""}
          onClick={(event) => {
            event.stopPropagation();
            onWishlist(product.id);
          }}
          aria-label={
            liked
              ? `Remove ${product.name} from wishlist`
              : `Save ${product.name} to wishlist`
          }
        >
          ♡
        </button>
        <Image
          src={product.imageUrl}
          unoptimized
          alt={product.name}
          width={610}
          height={610}
          loading="lazy"
          sizes="(max-width: 760px) 50vw, 25vw"
        />
      </div>
      <div className="product-meta">
        <div className="product-card-tools">
          <small>{product.categoryName}</small>
          {onCompare && (
            <button
              className={compared ? "active" : ""}
              onClick={() => onCompare(product.id)}
              aria-pressed={compared}
            >
              {compared ? "✓ Comparing" : "+ Compare"}
            </button>
          )}
        </div>
        {product.categoryName === "Grocery" && product.brand && (
          <div className="grocery-brand">{product.brand}</div>
        )}
        <button className="product-name" onClick={() => onOpen(product)}>
          {product.name}
        </button>
        {product.categoryName === "Grocery" && product.size && (
          <div className="grocery-size">{product.size}</div>
        )}
        <div className="rating">
          {product.reviews > 0 ? (
            <>
              ★ {product.rating}{" "}
              <span>({product.reviews.toLocaleString("en-IN")} ratings)</span>
            </>
          ) : (
            <span>New listing · no verified reviews</span>
          )}
        </div>
        {product.categoryName === "Grocery" && (
          <div className="grocery-delivery">
            {product.stockQuantity > 0
              ? (product.shipping ?? "Delivery estimate shown at checkout")
              : "Availability confirmed after delivery-location check"}
          </div>
        )}
        {product.categoryName === "Phones" && (
          <div className="mobile-commerce-details">
            <span>
              <b>EMI</b> from {money.format(Math.ceil(product.price / 12))}
              /month
            </span>
            <span>
              <b>Exchange</b> eligibility checked at checkout
            </span>
            <span>
              <b>Delivery</b> free · PIN-code estimate available
            </span>
          </div>
        )}
        <div className="card-bottom">
          <div>
            <strong>{money.format(product.price)}</strong>
            {product.previousPrice && (
              <del>{money.format(product.previousPrice)}</del>
            )}
          </div>
          <button
            className="add-button"
            onClick={() => onAdd(product)}
            aria-label={`Add ${product.name} to bag`}
            disabled={product.stockQuantity < 1}
          >
            {product.stockQuantity < 1 ? "×" : "+"}
          </button>
        </div>
        {product.categoryName === "Grocery" && saved > 0 && (
          <div className="grocery-savings">
            <b>{product.discount}% off</b>
            <span>You save {money.format(saved)}</span>
            <small>Offer price · coupon eligibility at checkout</small>
          </div>
        )}
        {product.categoryName === "Grocery" && (
          <div className="grocery-stock-row">
            <b>In stock</b>
            <span>Free delivery · arrives in 2–3 days</span>
          </div>
        )}
        {product.categoryName === "Phones" && (
          <div className="mobile-card-actions">
            <button className="quick-view" onClick={() => onOpen(product)}>
              Quick view
            </button>
            <button
              className="quick-add"
              onClick={() => onAdd(product)}
              disabled={product.stockQuantity < 1}
            >
              Add to bag
            </button>
            <button className="quick-share" onClick={shareProduct}>
              Share
            </button>
          </div>
        )}
        {product.categoryName === "Grocery" && (
          <div className="grocery-quick-actions">
            <button className="quick-view" onClick={() => onOpen(product)}>
              Quick view
            </button>
            <button
              className="quick-add"
              onClick={() =>
                product.stockQuantity > 0 ? onAdd(product) : onOpen(product)
              }
            >
              {product.stockQuantity > 0 ? "Quick add" : "Check availability"}
            </button>
            <button
              className="quick-share"
              onClick={shareProduct}
              aria-label={`Share ${product.name}`}
            >
              Share
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function ComparisonView({
  products,
  onRemove,
  onShop,
  onOpen,
  onAdd,
}: {
  products: Product[];
  onRemove: (id: number) => void;
  onShop: () => void;
  onOpen: (product: Product) => void;
  onAdd: (product: Product) => void;
}) {
  const rows = useMemo(() => {
    const core = [
      {
        label: "Brand",
        values: products.map(
          (product) =>
            getProductProfile(product.id)?.brand ?? product.name.split(" ")[0],
        ),
      },
      {
        label: "Price",
        values: products.map((product) => money.format(product.price)),
      },
      {
        label: "Rating",
        values: products.map((product) =>
          product.reviews > 0
            ? `${product.rating} ★ (${product.reviews})`
            : "New listing",
        ),
      },
      {
        label: "Features",
        values: products.map(
          (product) =>
            getProductProfile(product.id)?.highlights.slice(0, 3).join(" · ") ??
            product.description,
        ),
      },
      {
        label: "Dimensions",
        values: products.map((product) =>
          findSpecification(product, "Dimensions"),
        ),
      },
      {
        label: "Warranty",
        values: products.map(
          (product) =>
            getProductProfile(product.id)?.warranty ??
            "Manufacturer warranty details pending verification",
        ),
      },
      {
        label: "Availability",
        values: products.map((product) =>
          product.stockQuantity > 0
            ? `In stock · ${product.stockQuantity} units`
            : "Out of stock",
        ),
      },
    ];
    const specificationLabels = Array.from(
      new Set(
        products.flatMap((product) =>
          (getProductProfile(product.id)?.specifications ?? []).flatMap(
            (group) => group.items.map((item) => item.label),
          ),
        ),
      ),
    ).slice(0, 8);
    return [
      ...core,
      ...specificationLabels.map((label) => ({
        label,
        values: products.map((product) => findSpecification(product, label)),
      })),
    ];
  }, [products]);

  if (products.length === 0)
    return (
      <section className="comparison-page wrap page-enter">
        <EmptyState
          title="Choose products to compare"
          body="Add up to four products from the catalogue to see their important differences side by side."
          action="Browse products"
          onAction={onShop}
        />
      </section>
    );

  return (
    <section className="comparison-page wrap page-enter">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Decision workspace</span>
          <h1>Compare products</h1>
          <p>{products.length} of 4 products selected</p>
        </div>
        <button className="filter-button" onClick={onShop}>
          Add another product
        </button>
      </div>
      <div
        className="comparison-scroll"
        tabIndex={0}
        aria-label="Product comparison table"
      >
        <div
          className="enterprise-comparison"
          style={
            { "--comparison-count": products.length } as React.CSSProperties
          }
        >
          <div className="comparison-label comparison-product-label">
            Product
          </div>
          {products.map((product) => (
            <article className="comparison-product" key={product.id}>
              <button
                className="comparison-remove"
                onClick={() => onRemove(product.id)}
                aria-label={`Remove ${product.name}`}
              >
                ×
              </button>
              <button
                className="comparison-image"
                onClick={() => onOpen(product)}
              >
                <Image
                  src={product.imageUrl}
                  unoptimized
                  alt={product.name}
                  width={420}
                  height={420}
                  sizes="(max-width: 760px) 70vw, 24vw"
                />
              </button>
              <button className="product-name" onClick={() => onOpen(product)}>
                {product.name}
              </button>
              <button
                className="primary"
                onClick={() => onAdd(product)}
                disabled={product.stockQuantity < 1}
              >
                Add to bag
              </button>
            </article>
          ))}
          {rows.map((row) => {
            const different = new Set(row.values).size > 1;
            return (
              <div className="comparison-row" key={row.label}>
                <div className="comparison-label">
                  {row.label}
                  {different && <small>Different</small>}
                </div>
                {row.values.map((value, index) => (
                  <div
                    className={different ? "difference" : ""}
                    key={`${row.label}-${products[index].id}`}
                  >
                    {value}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function findSpecification(product: Product, label: string) {
  const item = getProductProfile(product.id)
    ?.specifications.flatMap((group) => group.items)
    .find((candidate) => candidate.label.toLowerCase() === label.toLowerCase());
  return item?.value ?? "Not published";
}

function OrderSummary({
  subtotal,
  shipping,
  total,
  onCheckout,
  onMessage,
  compact = false,
}: {
  subtotal: number;
  shipping: number;
  total: number;
  onCheckout: () => void;
  onMessage: (message: string) => void;
  compact?: boolean;
}) {
  const [coupon, setCoupon] = useState("");
  function applyCoupon() {
    if (!coupon.trim()) return onMessage("Enter a coupon code first");
    onMessage(
      `Coupon “${coupon.trim().toUpperCase()}” checked—no active portfolio promotion found`,
    );
  }
  return (
    <aside className={`order-summary ${compact ? "compact" : ""}`}>
      <h2>Order summary</h2>
      <div>
        <span>Subtotal</span>
        <b>{money.format(subtotal)}</b>
      </div>
      <div>
        <span>Delivery</span>
        <b>{shipping ? money.format(shipping) : "Free"}</b>
      </div>
      <div>
        <span>Estimated GST</span>
        <b>Calculated by server</b>
      </div>
      <div className="summary-total">
        <span>Total</span>
        <strong>{money.format(total)}</strong>
      </div>
      {!compact && (
        <label className="coupon">
          <input
            value={coupon}
            onChange={(event) => setCoupon(event.target.value)}
            placeholder="Coupon code"
          />
          <button onClick={applyCoupon}>Apply</button>
        </label>
      )}
      <button className="primary full-button" onClick={onCheckout}>
        {compact ? "Place order securely" : "Continue to checkout"}
      </button>
      <p className="summary-note">
        ♢ Secure checkout · Easy returns · No hidden fees
      </p>
    </aside>
  );
}

function EmptyState({
  title,
  body,
  action,
  onAction,
}: {
  title: string;
  body: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="empty-state">
      <div aria-hidden="true">◇</div>
      <h2>{title}</h2>
      <p>{body}</p>
      <button className="primary" onClick={onAction}>
        {action}
      </button>
    </div>
  );
}

function AccountView({
  auth,
  wishlistCount,
  onShop,
  onAction,
  onAuthenticated,
}: {
  auth: AuthSession | null;
  wishlistCount: number;
  onShop: () => void;
  onAction: (title: string, body: string) => void;
  onAuthenticated: (user: AuthUser) => void;
}) {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [orders, setOrders] = useState<Array<{
    orderNumber: string; items: Array<{ name: string; quantity: number }>;
    paymentStatus: string; orderStatus: string; total: number; createdAt: string;
    history: Array<{ to_value: string; note: string | null; created_at: string }>;
  }>>([]);
  const [ordersBusy, setOrdersBusy] = useState(false);

  async function loadOrders() {
    if (!auth) return;
    setOrdersBusy(true);
    try {
      const response = await fetch("/api/site/orders", { cache: "no-store" });
      if (!response.ok) throw new Error(await readApiError(response));
      const result = (await response.json()) as { orders: typeof orders };
      setOrders(result.orders);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Orders could not be loaded.");
    } finally {
      setOrdersBusy(false);
    }
  }

  useEffect(() => { void loadOrders(); }, [auth?.user.email]);

  async function cancelCustomerOrder(orderNumber: string) {
    if (!window.confirm(`Cancel ${orderNumber}? Reserved stock will be returned.`)) return;
    const response = await fetch("/api/site/orders/customer-cancel", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber }),
    });
    if (!response.ok) { setAuthError(await readApiError(response)); return; }
    await loadOrders();
  }

  async function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/site/auth/${authMode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const result = (await response.json()) as { user: AuthUser };
      onAuthenticated(result.user);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Sign in could not be completed.");
    } finally {
      setAuthBusy(false);
    }
  }

  return (
    <section className="account-page wrap">
      <div className="account-hero">
        <div>
          <span className="eyebrow">Your Nexora</span>
          <h1>
            {auth
              ? `Welcome back, ${auth.user.name}.`
              : "Protected orders start with your account."}
          </h1>
          <p>
            {auth
              ? `${auth.user.email} · ${auth.user.isAdmin ? "Administrator" : "Customer"}`
              : "Sign in securely to create orders, submit payment proof and see private order history."}
          </p>
          {auth ? (
            <a
              className="secondary account-link"
              href="/auth/sign-out?return_to=%2F"
            >
              Sign out
            </a>
          ) : null}
        </div>
        <div className="account-avatar">
          {auth
            ? auth.user.name
                .split(" ")
                .map((word) => word[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()
            : "N"}
        </div>
      </div>
      {!auth && (
        <div className="auth-form platform-auth">
          <div>
            <span className="eyebrow">Nexora account</span>
            <h2>{authMode === "login" ? "Welcome back" : "Create your account"}</h2>
            <p>
              Sign in directly with Nexora to manage orders, checkout, payment
              verification and customer support.
            </p>
            <div className="auth-tabs" role="tablist" aria-label="Account access">
              <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => { setAuthMode("login"); setAuthError(""); }}>Sign in</button>
              <button type="button" className={authMode === "register" ? "active" : ""} onClick={() => { setAuthMode("register"); setAuthError(""); }}>Create account</button>
            </div>
          </div>
          <form onSubmit={submitAccount}>
            {authMode === "register" && <label>Full name<input name="name" autoComplete="name" required minLength={2} maxLength={80} /></label>}
            <label>Email<input name="email" type="email" autoComplete="email" required /></label>
            <label>Password<input name="password" type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} required minLength={10} maxLength={128} /><small>10 or more characters with a letter and number</small></label>
            {authError && <p className="form-error" role="alert">{authError}</p>}
            <button className="primary" type="submit" disabled={authBusy}>{authBusy ? authMode === "login" ? "Signing in…" : "Creating account…" : authMode === "login" ? "Sign in" : "Create account"}</button>
          </form>
        </div>
      )}
      <div className="account-grid">
        <article>
          <span>□</span>
          <h3>Orders</h3>
          <p>
            Track verified orders, download invoices and review status history.
          </p>
          <button
            onClick={() =>
              onAction(
                "Order privacy",
                auth
                  ? "Your Nexora account is connected. Checkout creates durable orders under this identity."
                  : "Sign in first to access private order history.",
              )
            }
          >
            {auth ? "Connected →" : "Sign in required →"}
          </button>
        </article>
        <article>
          <span>♡</span>
          <h3>Wishlist</h3>
          <p>
            {wishlistCount} saved {wishlistCount === 1 ? "product" : "products"}{" "}
            on this device.
          </p>
          <button onClick={onShop}>Browse products →</button>
        </article>
        <article>
          <span>⌂</span>
          <h3>Addresses</h3>
          <p>Saved delivery locations stay behind account authentication.</p>
          <button
            onClick={() =>
              onAction(
                "Saved addresses",
                "Order delivery details are saved with each authenticated order. A reusable address book remains separate from checkout.",
              )
            }
          >
            Learn more →
          </button>
        </article>
        <article>
          <span>♢</span>
          <h3>Security</h3>
          <p>Protected sign-in and server-enforced administrator routes.</p>
          <button
            onClick={() =>
              onAction(
                "Account security",
                "Never share your password or access token. Nexora does not ask for a UPI PIN or OTP.",
              )
            }
          >
            Safety guidance →
          </button>
        </article>
      </div>
      {auth && (
        <section className="customer-orders">
          <div className="section-heading"><div><span className="eyebrow">Order history</span><h2>Your orders</h2><p>Live payment and fulfilment updates from Nexora.</p></div><button onClick={() => void loadOrders()}>Refresh</button></div>
          {ordersBusy ? <p>Loading orders…</p> : orders.length === 0 ? <p className="admin-empty">No orders yet.</p> : (
            <div className="customer-order-list">{orders.map((order) => (
              <article key={order.orderNumber}>
                <div><small>{new Date(order.createdAt).toLocaleString("en-IN")}</small><h3>{order.orderNumber}</h3><p>{order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</p></div>
                <div className="customer-order-summary"><strong>{money.format(order.total)}</strong><span>{order.orderStatus.replaceAll("_", " ")}</span><small>Payment: {order.paymentStatus.replaceAll("_", " ")}</small></div>
                <ol className="order-timeline">{order.history.map((event, index) => <li key={`${event.created_at}-${index}`}><b>{event.to_value.replaceAll("_", " ")}</b><small>{event.note || new Date(event.created_at).toLocaleString("en-IN")}</small></li>)}</ol>
                {["PLACED", "CONFIRMED", "PROCESSING", "PACKED"].includes(order.orderStatus) && order.paymentStatus !== "VERIFIED" && <button className="secondary" onClick={() => void cancelCustomerOrder(order.orderNumber)}>Cancel order</button>}
              </article>
            ))}</div>
          )}
        </section>
      )}
    </section>
  );
}

function AdminView({
  auth,
  products,
  onBack,
  onAccount,
  onAction,
}: {
  auth: AuthSession | null;
  products: Product[];
  onBack: () => void;
  onAccount: () => void;
  onAction: (title: string, body: string) => void;
}) {
  const stock = products.reduce(
    (sum, product) => sum + product.stockQuantity,
    0,
  );
  const isAdmin = auth?.user.isAdmin === true;
  return (
    <section className="admin-page wrap">
      <div className="admin-head">
        <div>
          <button className="back-link" onClick={onBack}>
            ← Storefront
          </button>
          <span className="eyebrow">Operations centre</span>
          <h1>Payment review, without shortcuts.</h1>
          <p>
            Inspect evidence, make a human decision, then control fulfilment.
          </p>
        </div>
        <button
          className="primary"
          onClick={() =>
            onAction(
              "Add product",
              "Catalogue management is the next protected operation planned for this admin workspace.",
            )
          }
        >
          ＋ Add product
        </button>
      </div>
      {!isAdmin ? (
        <div className="admin-gate">
          <span>♢</span>
          <h2>Administrator access required</h2>
          <p>
            Payment screenshots and review controls are never exposed to public
            visitors or customer accounts.
          </p>
          <button className="primary" onClick={onAccount}>
            Sign in as administrator
          </button>
        </div>
      ) : (
        <>
          <AdminSupportPanel />
          <AdminMobileImportPanel />
          <AdminPaymentPanel auth={auth} />
          <AdminQuestionPanel auth={auth} />
        </>
      )}
      <div className="demo-label">
        Manual UPI review above uses protected hosted storage and administrator
        identity. Catalogue counts below are live; revenue examples are
        illustrative.
      </div>
      <div className="metric-grid">
        <article>
          <span>Gross revenue</span>
          <strong>₹8.42L</strong>
          <small>Illustrative only</small>
        </article>
        <article>
          <span>Review policy</span>
          <strong>Human</strong>
          <small>No automatic screenshot approval</small>
        </article>
        <article>
          <span>Products</span>
          <strong>{products.length}</strong>
          <small>Active catalogue count</small>
        </article>
        <article>
          <span>Units in stock</span>
          <strong>{stock}</strong>
          <small>Catalogue total</small>
        </article>
      </div>
      <div className="admin-columns">
        <section className="chart-card">
          <div className="section-heading">
            <div>
              <h2>Revenue overview</h2>
              <p>Illustrative seven-day trend</p>
            </div>
            <button
              onClick={() =>
                onAction(
                  "Revenue timeframe",
                  "This chart is clearly illustrative; real analytics require a connected event pipeline.",
                )
              }
            >
              Last 7 days ⌄
            </button>
          </div>
          <div
            className="bar-chart"
            aria-label="Illustrative revenue bar chart"
          >
            {[44, 62, 51, 78, 66, 91, 84].map((height, index) => (
              <div key={index}>
                <i style={{ height: `${height}%` }} />
                <span>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="activity-card">
          <div className="section-heading">
            <div>
              <h2>Operational health</h2>
              <p>Backend capabilities</p>
            </div>
          </div>
          <ul>
            <li>
              <span className="status-dot green" />
              <div>
                <b>Manual UPI verification</b>
                <small>
                  Protected proof, approval, rejection and audit history
                </small>
              </div>
              <strong>Ready</strong>
            </li>
            <li>
              <span className="status-dot green" />
              <div>
                <b>Inventory protection</b>
                <small>Transactional stock reservation and restoration</small>
              </div>
              <strong>Ready</strong>
            </li>
            <li>
              <span className="status-dot green" />
              <div>
                <b>Order lifecycle</b>
                <small>Controlled fulfilment transitions</small>
              </div>
              <strong>Ready</strong>
            </li>
            <li>
              <span className="status-dot amber" />
              <div>
                <b>Gateway automation</b>
                <small>Signed Razorpay webhook verification</small>
              </div>
              <strong>Roadmap</strong>
            </li>
          </ul>
        </section>
      </div>
      <section className="inventory-table">
        <div className="section-heading">
          <div>
            <h2>Inventory</h2>
            <p>Products loaded into this preview</p>
          </div>
          <button
            onClick={() =>
              onAction(
                "Inventory reports",
                `The catalogue contains ${products.length} products and ${stock} representative stock units.`,
              )
            }
          >
            View reports →
          </button>
        </div>
        <div className="table-head">
          <span>Product</span>
          <span>Category</span>
          <span>Stock</span>
          <span>Status</span>
        </div>
        {products.slice(0, 5).map((product) => (
          <div className="table-row" key={product.id}>
            <span>
              <Image
                src={product.imageUrl}
                unoptimized
                alt=""
                width={80}
                height={80}
              />
              <b>{product.name}</b>
            </span>
            <span>{product.categoryName}</span>
            <span>{product.stockQuantity}</span>
            <span
              className={product.stockQuantity < 10 ? "low-stock" : "in-stock"}
            >
              {product.stockQuantity < 10 ? "Low stock" : "Healthy"}
            </span>
          </div>
        ))}
      </section>
    </section>
  );
}

function AdminSupportPanel() {
  const [queue, setQueue] = useState<
    Array<{
      id: string;
      customer_name: string;
      customer_email: string;
      status: string;
      intent: string;
      subject: string;
      last_message_at: string;
    }>
  >([]);
  const [selected, setSelected] = useState<string>("");
  const [detail, setDetail] = useState<{
    messages?: SupportMessage[];
    conversation?: Record<string, unknown>;
    orders?: Array<Record<string, unknown>>;
  } | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  async function loadQueue() {
    try {
      const response = await fetch("/api/site/admin/support", {
        cache: "no-store",
      });
      if (response.ok) {
        const body = (await response.json()) as { queue: typeof queue };
        setQueue(body.queue);
      }
    } finally {
      setLoading(false);
    }
  }
  async function loadDetail(id: string) {
    setSelected(id);
    const response = await fetch(
      `/api/site/admin/support?conversationId=${encodeURIComponent(id)}`,
      { cache: "no-store" },
    );
    if (response.ok) setDetail(await response.json());
  }
  async function action(
    actionName: string,
    extra: Record<string, string> = {},
  ) {
    if (!selected) return;
    const response = await fetch("/api/site/admin/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: selected,
        action: actionName,
        ...extra,
      }),
    });
    if (response.ok) {
      setReply("");
      await loadDetail(selected);
      await loadQueue();
    }
  }
  useEffect(() => {
    loadQueue();
    const timer = window.setInterval(loadQueue, 8000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <section className="payment-admin admin-support">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Customer care operations</span>
          <h2>Support queue</h2>
          <p>
            Protected conversations, agent handover and customer order context.
          </p>
        </div>
        <span className="verification-pill">{queue.length} open</span>
      </div>
      <div className="admin-support-layout">
        <div className="support-queue">
          {loading ? (
            <p>Loading queue…</p>
          ) : queue.length ? (
            queue.map((item) => (
              <button
                key={item.id}
                className={selected === item.id ? "active" : ""}
                onClick={() => loadDetail(item.id)}
              >
                <span>
                  <b>{item.customer_name}</b>
                  <small>{item.subject || item.intent}</small>
                </span>
                <em>{item.status.replaceAll("_", " ")}</em>
              </button>
            ))
          ) : (
            <p>No conversations are waiting.</p>
          )}
        </div>
        <div className="support-workspace">
          {!detail ? (
            <div className="admin-empty">
              Select a conversation to review its history.
            </div>
          ) : (
            <>
              <div className="support-agent-head">
                <span>
                  <b>
                    {String(detail.conversation?.customer_name ?? "Customer")}
                  </b>
                  <small>
                    {String(detail.conversation?.customer_email ?? "")}
                  </small>
                </span>
                <button onClick={() => action("JOIN")}>
                  Join conversation
                </button>
              </div>
              <div className="support-agent-messages">
                {detail.messages?.map((message) => (
                  <p
                    key={message.id}
                    className={message.sender_role.toLowerCase()}
                  >
                    <b>{message.sender_role}</b>
                    <span>{message.body}</span>
                    <small>
                      {new Date(message.created_at).toLocaleString("en-IN")}
                    </small>
                  </p>
                ))}
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  action("MESSAGE", { message: reply });
                }}
              >
                <input
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Reply to customer"
                />
              <button className="primary" type="submit" disabled={!reply.trim()}>
                  Send
                </button>
              </form>
              <div className="support-admin-actions">
                <button
                  onClick={() => {
                    const note = window.prompt("Internal note");
                    if (note) action("NOTE", { note });
                  }}
                >
                  Add internal note
                </button>
                <button
                  onClick={() => action("STATUS", { status: "RESOLVED" })}
                >
                  Resolve
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function AdminMobileImportPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    inserted: number;
    updated: number;
    rejected: number;
    errors?: Array<{ rowNumber: number; message: string }>;
    publication?: string;
  } | null>(null);
  const [error, setError] = useState("");

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Choose a CSV, Excel, or JSON file.");
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/site/admin/mobile-import", {
        method: "POST",
        body: form,
      });
      const body = (await response.json()) as typeof result & {
        message?: string;
      };
      if (!response.ok && response.status !== 207)
        throw new Error(body?.message || "Import failed.");
      setResult(body);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="payment-admin mobile-import-admin">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Verified smartphone registry</span>
          <h2>Bulk model import</h2>
          <p>
            Import up to 10,000 source-backed models per job. CSV, Excel, JSON,
            and authenticated JSON API requests use the same validation
            pipeline.
          </p>
        </div>
        <a
          className="account-link secondary"
          href="/api/site/admin/mobile-import"
        >
          Download template
        </a>
      </div>
      <div className="verification-rules">
        <b>Publication guard</b>
        <span>
          Every model needs official identity, India availability, specification
          sources, and a verification date.
        </span>
        <span>{"Price, stock, ratings, reviews, offers, and delivery are never generated."}</span>
        <span>
          Successful imports remain Draft until publication checks are complete.
        </span>
      </div>
      <form className="mobile-import-form" onSubmit={upload}>
        <label className="upload-drop">
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <span>{file ? file.name : "Choose catalog file"}</span>
          <small>CSV, XLSX, XLS, or JSON · maximum 20 MB</small>
        </label>
        <button className="primary" type="submit" disabled={busy}>
          {busy ? "Validating and importing…" : "Validate & import"}
        </button>
      </form>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {result && (
        <div className="import-result" role="status">
          <div>
            <b>{result.total}</b>
            <small>Rows checked</small>
          </div>
          <div>
            <b>{result.inserted}</b>
            <small>Inserted</small>
          </div>
          <div>
            <b>{result.updated}</b>
            <small>Updated</small>
          </div>
          <div>
            <b>{result.rejected}</b>
            <small>Rejected</small>
          </div>
          {result.publication && <p>{result.publication}</p>}
          {result.errors?.length ? (
            <details>
              <summary>Review first {result.errors.length} errors</summary>
              <ul>
                {result.errors.map((item, index) => (
                  <li key={`${item.rowNumber}-${index}`}>
                    Row {item.rowNumber}: {item.message}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      )}
    </section>
  );
}

function AdminPaymentPanel({ auth }: { auth: AuthSession }) {
  const [payments, setPayments] = useState<ManualPayment[]>([]);
  const [filter, setFilter] = useState("PENDING_VERIFICATION");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPayments(nextFilter = filter) {
    setLoading(true);
    setError("");
    try {
      const query = nextFilter === "ALL" ? "" : `?status=${nextFilter}`;
      const response = await fetch(`/api/site/admin/payments${query}`);
      if (!response.ok) throw new Error(await readApiError(response));
      setPayments(await response.json());
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load payment reviews.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/site/admin/payments?status=PENDING_VERIFICATION")
      .then(async (response) => {
        if (!response.ok) throw new Error(await readApiError(response));
        return response.json();
      })
      .then((data: ManualPayment[]) => {
        if (active) setPayments(data);
      })
      .catch((caught) => {
        if (active)
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load payment reviews.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [auth.user.email]);

  async function review(
    payment: ManualPayment,
    decision: "APPROVE" | "REJECT",
  ) {
    const note = window.prompt(
      decision === "APPROVE"
        ? "Optional verification note"
        : "Reason for rejection (shown in audit history)",
      decision === "REJECT"
        ? "Payment details could not be verified"
        : "Amount and recipient verified",
    );
    if (note === null) return;
    try {
      const response = await fetch("/api/site/admin/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: payment.id, decision, note }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      await loadPayments();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Review could not be saved.",
      );
    }
  }

  async function advance(payment: ManualPayment, status: string) {
    try {
      const response = await fetch("/api/site/admin/order-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: payment.orderNumber, status }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      await loadPayments();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Order status could not be updated.",
      );
    }
  }

  return (
    <section className="payment-admin">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Manual UPI queue</span>
          <h2>Payment verification</h2>
          <p>
            Open the protected screenshot, compare the exact amount and
            recipient in your UPI/bank records, then decide.
          </p>
        </div>
        <select
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value);
            void loadPayments(event.target.value);
          }}
          aria-label="Filter payments"
        >
          <option value="PENDING_VERIFICATION">Pending</option>
          <option value="VERIFIED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="ALL">All</option>
        </select>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="admin-empty">Loading protected payment queue…</p>
      ) : payments.length === 0 ? (
        <p className="admin-empty">No payments match this filter.</p>
      ) : (
        <div className="payment-review-grid">
          {payments.map((payment) => (
            <article className="payment-review" key={payment.id}>
              <ProofImage payment={payment} />
              <div className="payment-review-body">
                <span
                  className={`review-status ${payment.reviewStatus.toLowerCase()}`}
                >
                  {payment.reviewStatus.replaceAll("_", " ")}
                </span>
                <h3>{payment.orderNumber}</h3>
                <p>
                  {payment.customerName} · {payment.customerEmail}
                </p>
                <strong>{money.format(Number(payment.amount))}</strong>
                {payment.payerReference && (
                  <code>UTR: {payment.payerReference}</code>
                )}
                <small>
                  Submitted{" "}
                  {new Date(payment.submittedAt).toLocaleString("en-IN")}
                </small>
                {payment.reviewStatus === "PENDING_VERIFICATION" ? (
                  <div className="review-actions">
                    <button
                      className="approve-button"
                      onClick={() => review(payment, "APPROVE")}
                    >
                      Approve & confirm
                    </button>
                    <button
                      className="reject-button"
                      onClick={() => review(payment, "REJECT")}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="review-note">
                      {payment.reviewerNote || "Review completed"}
                    </p>
                    {payment.orderStatus === "CONFIRMED" && (
                      <button
                        className="secondary"
                        onClick={() => advance(payment, "PROCESSING")}
                      >
                        Start processing
                      </button>
                    )}
                    {["PROCESSING", "PACKED"].includes(payment.orderStatus) && (
                      <button
                        className="secondary"
                        onClick={() => advance(payment, "SHIPPED")}
                      >
                        Mark shipped
                      </button>
                    )}
                    {payment.orderStatus === "SHIPPED" && (
                      <button
                        className="secondary"
                        onClick={() => advance(payment, "OUT_FOR_DELIVERY")}
                      >
                        Out for delivery
                      </button>
                    )}
                    {payment.orderStatus === "OUT_FOR_DELIVERY" && (
                      <button
                        className="secondary"
                        onClick={() => advance(payment, "DELIVERED")}
                      >
                        Mark delivered
                      </button>
                    )}
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function AdminQuestionPanel({ auth }: { auth: AuthSession }) {
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadQuestions() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/site/admin/questions?status=PENDING");
      if (!response.ok) throw new Error(await readApiError(response));
      setQuestions((await response.json()) as ProductQuestion[]);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load product questions.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/site/admin/questions?status=PENDING")
      .then(async (response) => {
        if (!response.ok) throw new Error(await readApiError(response));
        return response.json();
      })
      .then((data: ProductQuestion[]) => {
        if (active) setQuestions(data);
      })
      .catch((caught) => {
        if (active)
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load product questions.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [auth.user.email]);

  async function answer(question: ProductQuestion) {
    const responseText = window.prompt(
      `Answer this question about ${question.productName}:\n\n${question.question}`,
      "",
    );
    if (responseText === null) return;
    try {
      const response = await fetch("/api/site/admin/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: question.id, answer: responseText }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      await loadQuestions();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Answer could not be saved.",
      );
    }
  }

  return (
    <section className="admin-questions">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Product support</span>
          <h2>Pending customer questions</h2>
          <p>
            Answers are attributed to the administrator and published only after
            review.
          </p>
        </div>
        <button onClick={() => void loadQuestions()}>Refresh</button>
      </div>
      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p className="admin-empty">Loading questions…</p>
      ) : questions.length === 0 ? (
        <p className="admin-empty">No unanswered product questions.</p>
      ) : (
        <div className="admin-question-list">
          {questions.map((question) => (
            <article key={question.id}>
              <div>
                <span>{question.productName}</span>
                <h3>{question.question}</h3>
                <p>
                  {question.customerEmail} ·{" "}
                  {new Date(question.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <button className="primary" onClick={() => answer(question)}>
                Answer
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ProofImage({ payment }: { payment: ManualPayment }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState(false);
  useEffect(() => {
    let objectUrl = "";
    fetch(payment.proofUrl)
      .then((response) => {
        if (!response.ok) throw new Error("Proof unavailable");
        return response.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => setError(true));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [payment.proofUrl]);
  return (
    <div className="proof-image">
      {url ? (
        <a href={url} target="_blank" rel="noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`Payment screenshot for ${payment.orderNumber}`}
          />
        </a>
      ) : (
        <span>{error ? "Screenshot unavailable" : "Loading screenshot…"}</span>
      )}
    </div>
  );
}
