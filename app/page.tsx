"use client";

import { useEffect, useMemo, useState } from "react";
import { categories, fallbackProducts, type Product } from "./catalog";

type View =
  | "home"
  | "catalog"
  | "product"
  | "cart"
  | "checkout"
  | "account"
  | "admin";
type SortMode = "recommended" | "price-low" | "price-high" | "rating";

type CartLine = { product: Product; quantity: number };
type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
};
type AuthSession = { token: string; user: AuthUser };
type OrderCreated = {
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
};
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

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const sortModes: SortMode[] = [
  "recommended",
  "price-low",
  "price-high",
  "rating",
];
const sortLabels: Record<SortMode, string> = {
  recommended: "Recommended",
  "price-low": "Price: Low to high",
  "price-high": "Price: High to low",
  rating: "Customer rating",
};

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [loading, setLoading] = useState(true);
  const [usingDemoCatalog, setUsingDemoCatalog] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<Product>(fallbackProducts[0]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [notice, setNotice] = useState("");
  const [dialog, setDialog] = useState<{ title: string; body: string } | null>(
    null,
  );
  const [sortMode, setSortMode] = useState<SortMode>("recommended");
  const [finish, setFinish] = useState("Obsidian");
  const [imageMode, setImageMode] = useState<"front" | "detail">("front");
  const [deliveryPin, setDeliveryPin] = useState("560001");
  const [auth, setAuth] = useState<AuthSession | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = window.sessionStorage.getItem("nexora-auth");
      return saved ? (JSON.parse(saved) as AuthSession) : null;
    } catch {
      window.sessionStorage.removeItem("nexora-auth");
      return null;
    }
  });

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/api/products`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Catalog unavailable");
        return response.json();
      })
      .then((data: Array<Record<string, unknown>>) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const mapped = data.map((item, index) => ({
          id: Number(item.id),
          name: String(item.name),
          description: String(item.description ?? ""),
          price: Number(item.price),
          stockQuantity: Number(item.stockQuantity ?? 0),
          imageUrl: String(
            item.imageUrl ||
              fallbackProducts[index % fallbackProducts.length].imageUrl,
          ),
          categoryName: String(item.categoryName ?? "Collection"),
          rating: 4.6 + (index % 4) / 10,
          reviews: 86 + index * 47,
          badge: index === 0 ? "Featured" : undefined,
        }));
        const liveNames = new Set(
          mapped.map((product) => product.name.toLowerCase()),
        );
        setProducts([
          ...mapped,
          ...fallbackProducts.filter(
            (product) => !liveNames.has(product.name.toLowerCase()),
          ),
        ]);
        setSelected(mapped[0]);
        setUsingDemoCatalog(false);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  function updateAuth(session: AuthSession | null) {
    setAuth(session);
    if (session)
      window.sessionStorage.setItem("nexora-auth", JSON.stringify(session));
    else window.sessionStorage.removeItem("nexora-auth");
  }

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
    return matches;
  }, [products, query, category, sortMode]);

  const cartCount = cart.reduce((total, line) => total + line.quantity, 0);
  const subtotal = cart.reduce(
    (total, line) => total + line.product.price * line.quantity,
    0,
  );
  const shipping = subtotal > 5000 || subtotal === 0 ? 0 : 99;
  const total = subtotal + shipping;

  function navigate(next: View) {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openProduct(product: Product) {
    setSelected(product);
    setFinish("Obsidian");
    setImageMode("front");
    navigate("product");
  }

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  function openInfo(title: string, body: string) {
    setDialog({ title, body });
  }

  function addToCart(product: Product) {
    setCart((current) => {
      const line = current.find((item) => item.product.id === product.id);
      if (line)
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      return [...current, { product, quantity: 1 }];
    });
    showNotice(`${product.name} added to your bag`);
  }

  function changeQuantity(productId: number, delta: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.product.id === productId
            ? { ...line, quantity: line.quantity + delta }
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

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    navigate("catalog");
  }

  function cycleSort() {
    const next =
      sortModes[(sortModes.indexOf(sortMode) + 1) % sortModes.length];
    setSortMode(next);
    showNotice(`Products sorted by ${sortLabels[next].toLowerCase()}`);
  }

  function changeDeliveryPin() {
    const next = window.prompt(
      "Enter a 6-digit delivery PIN code",
      deliveryPin,
    );
    if (next === null) return;
    if (!/^\d{6}$/.test(next.trim())) {
      showNotice("Please enter a valid 6-digit PIN code");
      return;
    }
    setDeliveryPin(next.trim());
    showNotice(`Delivery location updated to ${next.trim()}`);
  }

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <button
          className="brand"
          onClick={() => navigate("home")}
          aria-label="Nexora home"
        >
          <span className="brand-mark" aria-hidden="true">
            N
          </span>
          <span>Nexora</span>
        </button>
        <form className="search" onSubmit={submitSearch} role="search">
          <span aria-hidden="true">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, categories and more"
            aria-label="Search products"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </form>
        <nav className="header-actions" aria-label="Primary navigation">
          <button onClick={() => navigate("catalog")}>
            <span aria-hidden="true">▦</span>
            <span>Shop</span>
          </button>
          <button onClick={() => navigate("account")}>
            <span aria-hidden="true">◯</span>
            <span>Account</span>
          </button>
          <button className="cart-action" onClick={() => navigate("cart")}>
            <span aria-hidden="true">◇</span>
            <span>Bag</span>
            {cartCount > 0 && <b>{cartCount}</b>}
          </button>
        </nav>
      </header>

      <div className="category-strip" aria-label="Shop categories">
        {categories.slice(1).map((item) => (
          <button
            key={item}
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
      </div>

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
              <div className="hero-copy">
                <span className="eyebrow">Designed for everyday wonder</span>
                <h1>
                  Good things,
                  <br />
                  <span>thoughtfully chosen.</span>
                </h1>
                <p>
                  Discover technology and lifestyle essentials selected for
                  quality, usefulness and lasting value.
                </p>
                <div className="hero-actions">
                  <button
                    className="primary"
                    onClick={() => navigate("catalog")}
                  >
                    Explore the collection
                  </button>
                  <button
                    className="secondary"
                    onClick={() => openProduct(products[0])}
                  >
                    See today&apos;s pick <span aria-hidden="true">→</span>
                  </button>
                </div>
                <div className="hero-proof">
                  <span>
                    <b>4.8</b> customer rating
                  </span>
                  <span>
                    <b>2-day</b> priority delivery
                  </span>
                  <span>
                    <b>30-day</b> easy returns
                  </span>
                </div>
              </div>
              <div
                className="hero-visual"
                aria-label="Featured Nexora products"
              >
                <div className="orb orb-one" />
                <div className="orb orb-two" />
                <div className="hero-card hero-card-main">
                  <span>Editor&apos;s choice</span>
                  <img src={products[0].imageUrl} alt={products[0].name} />
                  <div>
                    <b>{products[0].name}</b>
                    <small>{money.format(products[0].price)}</small>
                  </div>
                </div>
                <div className="hero-card hero-card-small">
                  <span>Free delivery</span>
                  <b>Above ₹5,000</b>
                </div>
                <div className="hero-card hero-card-rating">
                  <b>4.8 ★</b>
                  <span>Loved by thousands</span>
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
                <img
                  src={
                    fallbackProducts.find(
                      (product) => product.categoryName === "Computing",
                    )?.imageUrl
                  }
                  alt="Laptop collection"
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
                <img
                  src={
                    fallbackProducts.find(
                      (product) => product.categoryName === "Lifestyle",
                    )?.imageUrl
                  }
                  alt="Lifestyle collection"
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
                <p>{filtered.length} thoughtfully selected products</p>
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
                  Product models are real and sold in India. Prices, discounts,
                  stock, ratings and reviews are representative portfolio
                  data—not live retailer claims.
                </p>
              </div>
            </div>
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
            {filtered.length ? (
              <div className="product-grid catalog-grid">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpen={openProduct}
                    onAdd={addToCart}
                    liked={wishlist.includes(product.id)}
                    onWishlist={toggleWishlist}
                  />
                ))}
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
          <section className="product-page wrap">
            <button className="back-link" onClick={() => navigate("catalog")}>
              ← Back to products
            </button>
            <div className="product-layout">
              <div className="product-gallery">
                <div
                  className={`main-image ${imageMode === "detail" ? "detail-zoom" : ""}`}
                >
                  <span className="image-badge">
                    {selected.badge ?? "Nexora select"}
                  </span>
                  <img src={selected.imageUrl} alt={selected.name} />
                </div>
                <div className="thumbnail-row">
                  <button
                    className={imageMode === "front" ? "selected-thumb" : ""}
                    onClick={() => setImageMode("front")}
                  >
                    <img src={selected.imageUrl} alt="Front view" />
                  </button>
                  <button
                    className={imageMode === "detail" ? "selected-thumb" : ""}
                    onClick={() => setImageMode("detail")}
                  >
                    <img src={selected.imageUrl} alt="Magnified detail view" />
                  </button>
                  <button
                    className="future-thumb"
                    onClick={() =>
                      openInfo(
                        "360° product view",
                        "Interactive 360° photography is planned for the production media service. The front and detail views are available now.",
                      )
                    }
                  >
                    360°<small>Future</small>
                  </button>
                </div>
              </div>
              <div className="product-info">
                <span className="eyebrow">{selected.categoryName}</span>
                <h1>{selected.name}</h1>
                <button
                  className="rating-link"
                  onClick={() =>
                    openInfo(
                      "Portfolio ratings",
                      "Ratings and review totals are representative catalogue data. Verified customer review moderation is part of the production roadmap.",
                    )
                  }
                >
                  ★ {selected.rating} ·{" "}
                  {selected.reviews.toLocaleString("en-IN")} reviews
                </button>
                <p className="product-description">{selected.description}</p>
                <div className="price-line">
                  <strong>{money.format(selected.price)}</strong>
                  {selected.previousPrice && (
                    <>
                      <del>{money.format(selected.previousPrice)}</del>
                      <span>
                        Save{" "}
                        {money.format(selected.previousPrice - selected.price)}
                      </span>
                    </>
                  )}
                </div>
                <div className="choice-block">
                  <label>Finish</label>
                  <div className="swatches">
                    <button
                      className={`swatch dark ${finish === "Obsidian" ? "active" : ""}`}
                      onClick={() => setFinish("Obsidian")}
                      aria-label="Choose Obsidian"
                    />
                    <button
                      className={`swatch light ${finish === "Porcelain" ? "active" : ""}`}
                      onClick={() => setFinish("Porcelain")}
                      aria-label="Choose Porcelain"
                    />
                    <button
                      className={`swatch blue ${finish === "Sky" ? "active" : ""}`}
                      onClick={() => setFinish("Sky")}
                      aria-label="Choose Sky"
                    />
                  </div>
                  <small>{finish}</small>
                </div>
                <div className="delivery-card">
                  <span aria-hidden="true">⌁</span>
                  <div>
                    <b>Delivery to {deliveryPin}</b>
                    <p>Order today for priority delivery in 2–3 days.</p>
                  </div>
                  <button onClick={changeDeliveryPin}>Change</button>
                </div>
                <div className="purchase-actions">
                  <button
                    className="primary grow"
                    onClick={() => addToCart(selected)}
                  >
                    Add to bag · {money.format(selected.price)}
                  </button>
                  <button
                    className={`wish-large ${wishlist.includes(selected.id) ? "liked" : ""}`}
                    onClick={() => toggleWishlist(selected.id)}
                    aria-label="Save to wishlist"
                  >
                    ♡
                  </button>
                </div>
                <div className="assurance-list">
                  <span>✓ 30-day easy returns</span>
                  <span>✓ 1-year manufacturer warranty</span>
                  <span>✓ Secure payment options</span>
                </div>
                <details open>
                  <summary>Highlights</summary>
                  <ul>
                    <li>Premium materials selected for everyday durability</li>
                    <li>Designed around intuitive, low-friction use</li>
                    <li>
                      Reliable support through the Nexora account experience
                    </li>
                  </ul>
                </details>
                <details>
                  <summary>Specifications</summary>
                  <p>
                    Complete specifications are supplied by the product
                    catalogue API when available.
                  </p>
                </details>
              </div>
            </div>
            <ProductSection
              title="Pairs well with"
              subtitle="Frequently explored together"
              products={products
                .filter((item) => item.id !== selected.id)
                .slice(0, 4)}
              onOpen={openProduct}
              onAdd={addToCart}
              wishlist={wishlist}
              onWishlist={toggleWishlist}
              loading={false}
              onAll={() => navigate("catalog")}
            />
          </section>
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
                    <article className="bag-line" key={line.product.id}>
                      <img
                        src={line.product.imageUrl}
                        alt={line.product.name}
                      />
                      <div className="bag-line-info">
                        <span>{line.product.categoryName}</span>
                        <h3>{line.product.name}</h3>
                        <p>Obsidian · In stock</p>
                        <div className="quantity">
                          <button
                            onClick={() => changeQuantity(line.product.id, -1)}
                            aria-label={`Decrease ${line.product.name} quantity`}
                          >
                            −
                          </button>
                          <b>{line.quantity}</b>
                          <button
                            onClick={() => changeQuantity(line.product.id, 1)}
                            aria-label={`Increase ${line.product.name} quantity`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="bag-price">
                        <strong>
                          {money.format(line.product.price * line.quantity)}
                        </strong>
                        <button
                          onClick={() =>
                            changeQuantity(line.product.id, -line.quantity)
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
            onShop={() => navigate("catalog")}
            onComplete={() => setCart([])}
            onMessage={showNotice}
          />
        )}

        {view === "account" && (
          <AccountView
            auth={auth}
            onAuth={updateAuth}
            wishlistCount={wishlist.length}
            onShop={() => navigate("catalog")}
            onAction={openInfo}
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
      </main>

      <footer>
        <div className="footer-main wrap">
          <div className="footer-brand">
            <div className="brand">
              <span className="brand-mark">N</span>
              <span>Nexora</span>
            </div>
            <p>Thoughtful products. Clear choices. A better way to shop.</p>
          </div>
          <div>
            <h3>Shop</h3>
            <button onClick={() => navigate("catalog")}>All products</button>
            <button
              onClick={() => {
                setCategory("Phones");
                navigate("catalog");
              }}
            >
              Phones
            </button>
            <button
              onClick={() => {
                setCategory("Computing");
                navigate("catalog");
              }}
            >
              Computing
            </button>
          </div>
          <div>
            <h3>Support</h3>
            <button
              onClick={() =>
                openInfo(
                  "Help centre",
                  "Browse products, manage your bag and use authenticated checkout when the configured Java API is online.",
                )
              }
            >
              Help centre
            </button>
            <button
              onClick={() =>
                openInfo(
                  "Delivery & returns",
                  "The portfolio experience demonstrates tracked delivery and a 30-day return journey. Live carrier booking and return labels require production integrations.",
                )
              }
            >
              Delivery & returns
            </button>
            <button
              onClick={() =>
                openInfo(
                  "Contact Nexora",
                  "This is a portfolio storefront. A production contact channel and service desk are included in the launch roadmap.",
                )
              }
            >
              Contact us
            </button>
          </div>
          <div>
            <h3>About</h3>
            <button
              onClick={() =>
                openInfo(
                  "Our standards",
                  "Nexora prioritises clear product information, accessible interaction, honest capability labels and low-friction shopping.",
                )
              }
            >
              Our standards
            </button>
            <button
              onClick={() =>
                openInfo(
                  "Privacy",
                  "Account and payment-proof data is sent only to the configured Nexora API after authentication. Payment screenshots are available only to administrators. Wishlist state stays in this browser tab.",
                )
              }
            >
              Privacy
            </button>
            <button
              onClick={() =>
                openInfo(
                  "Terms",
                  "Catalogue ratings and reviews are representative portfolio data. A real order is created only when an authenticated API request succeeds.",
                )
              }
            >
              Terms
            </button>
          </div>
        </div>
        <div className="footer-bottom wrap">
          <span>© 2026 Nexora Commerce</span>
          <span>India · English</span>
          <span>
            Portfolio product · Live capabilities are documented transparently
          </span>
        </div>
      </footer>
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
  onShop: () => void;
  onComplete: () => void;
  onMessage: (message: string) => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "COD">("UPI");
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

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

  async function createOrder() {
    setError("");
    if (!auth)
      return setError(
        "Sign in or create an account before creating a protected order reference.",
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
    setBusy(true);
    try {
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
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
            productName: line.product.name,
            variant: "Obsidian",
            imageUrl: line.product.imageUrl,
            quantity: line.quantity,
            unitPrice: line.product.price,
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
        setSubmitted(true);
        onComplete();
        return;
      }
      const instructionResponse = await fetch(
        `${API_BASE}/api/orders/${encodeURIComponent(created.orderNumber)}/payments/upi/instructions`,
        { headers: { Authorization: `Bearer ${auth.token}` } },
      );
      if (!instructionResponse.ok)
        throw new Error(await readApiError(instructionResponse));
      setInstructions(await instructionResponse.json());
      onMessage(`Secure payment reference ${created.orderNumber} created`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The order service is unavailable.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function uploadProof() {
    setError("");
    if (!auth || !order || !screenshot)
      return setError("Choose a payment screenshot before submitting.");
    if (screenshot.size > 5 * 1024 * 1024)
      return setError("Payment screenshots must be 5 MB or smaller.");
    setBusy(true);
    try {
      const data = new FormData();
      data.append("screenshot", screenshot);
      if (payerReference.trim())
        data.append("payerReference", payerReference.trim());
      const response = await fetch(
        `${API_BASE}/api/orders/${encodeURIComponent(order.orderNumber)}/payments/upi/proof`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${auth.token}` },
          body: data,
        },
      );
      if (!response.ok) throw new Error(await readApiError(response));
      await response.json();
      setSubmitted(true);
      onComplete();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The screenshot could not be submitted.",
      );
    } finally {
      setBusy(false);
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
              : "Order placed"}
          </h1>
          <p>
            {paymentMethod === "UPI"
              ? "Your screenshot was saved securely. We have not marked the payment successful—an administrator must verify it before the order is confirmed."
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
            The server calculates the final amount. UPI payments require human
            verification.
          </p>
        </div>
        <span className="secure-label">♢ Manual verification</span>
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
                  Choose direct UPI with manual proof review or cash on
                  delivery.
                </p>
              </div>
            </div>
            <div className="payment-options">
              <label
                className={paymentMethod === "UPI" ? "selected-payment" : ""}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "UPI"}
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
              <button
                className="primary full-button"
                disabled={busy || !auth}
                onClick={createOrder}
              >
                {busy
                  ? "Creating secure reference…"
                  : paymentMethod === "UPI"
                    ? "Create UPI payment reference"
                    : `Place COD order · ${money.format(total)}`}
              </button>
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
                  <img
                    src="/upi-qr-surya.jpeg"
                    alt={`UPI QR for ${instructions.merchantName}, ${instructions.merchantUpiId}`}
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
                  <img
                    className="proof-preview"
                    src={screenshotPreview}
                    alt="Selected payment screenshot preview"
                  />
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

function ProductCard({
  product,
  onOpen,
  onAdd,
  liked,
  onWishlist,
}: {
  product: Product;
  onOpen: (product: Product) => void;
  onAdd: (product: Product) => void;
  liked: boolean;
  onWishlist: (id: number) => void;
}) {
  return (
    <article className="product-card">
      <div className="product-image" onClick={() => onOpen(product)}>
        {product.badge && <span>{product.badge}</span>}
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
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
      </div>
      <div className="product-meta">
        <small>{product.categoryName}</small>
        <button className="product-name" onClick={() => onOpen(product)}>
          {product.name}
        </button>
        <div className="rating">
          ★ {product.rating} <span>({product.reviews})</span>
        </div>
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
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
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
  onAuth,
  wishlistCount,
  onShop,
  onAction,
}: {
  auth: AuthSession | null;
  onAuth: (session: AuthSession | null) => void;
  wishlistCount: number;
  onShop: () => void;
  onAction: (title: string, body: string) => void;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function authenticate(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(
        `${API_BASE}/api/auth/${mode === "login" ? "login" : "signup"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "login"
              ? { email, password, rememberMe: false }
              : { name, email, password },
          ),
        },
      );
      if (!response.ok) throw new Error(await readApiError(response));
      const body = (await response.json()) as {
        token: string | null;
        user: AuthUser;
        message: string;
      };
      if (!body.token)
        return setMessage(
          body.message || "Verify your email before signing in.",
        );
      onAuth({ token: body.token, user: body.user });
      setPassword("");
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "The account service is unavailable.",
      );
    } finally {
      setBusy(false);
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
              ? `${auth.user.email} · ${auth.user.role === "ROLE_ADMIN" ? "Administrator" : "Customer"}`
              : "Sign in to create orders, submit payment proof and see private order history."}
          </p>
          {auth ? (
            <button className="secondary" onClick={() => onAuth(null)}>
              Sign out
            </button>
          ) : (
            <div className="auth-tabs">
              <button
                className={mode === "login" ? "active" : ""}
                onClick={() => {
                  setMode("login");
                  setMessage("");
                }}
              >
                Sign in
              </button>
              <button
                className={mode === "signup" ? "active" : ""}
                onClick={() => {
                  setMode("signup");
                  setMessage("");
                }}
              >
                Create account
              </button>
            </div>
          )}
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
        <form className="auth-form" onSubmit={authenticate}>
          <div>
            <span className="eyebrow">
              {mode === "login" ? "Welcome back" : "Join Nexora"}
            </span>
            <h2>
              {mode === "login" ? "Sign in securely" : "Create your account"}
            </h2>
            <p>
              Your access token stays in this browser tab and is sent only to
              the configured Nexora API.
            </p>
          </div>
          <div>
            {mode === "signup" && (
              <label>
                Full name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  maxLength={120}
                />
              </label>
            )}
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
              />
              <small>At least 8 characters with a letter and number</small>
            </label>
            {message && (
              <p className="form-error" role="alert">
                {message}
              </p>
            )}
            <button type="submit" className="primary full-button" disabled={busy}>
              {busy
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </div>
        </form>
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
                  ? "Your JWT-authenticated order APIs are connected. Checkout creates orders under this account."
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
                "The Java profile API provides authenticated address persistence.",
              )
            }
          >
            Learn more →
          </button>
        </article>
        <article>
          <span>♢</span>
          <h3>Security</h3>
          <p>JWT access, BCrypt passwords and protected admin routes.</p>
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
  const isAdmin = auth?.user.role === "ROLE_ADMIN";
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
              "Product creation remains available through the protected Java admin API.",
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
        <AdminPaymentPanel auth={auth} />
      )}
      <div className="demo-label">
        Manual UPI review above is live when the configured Java API is online.
        Catalogue counts below are live; revenue examples are illustrative.
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
              <img src={product.imageUrl} alt="" />
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
      const response = await fetch(
        `${API_BASE}/api/admin/payments/upi${query}`,
        { headers: { Authorization: `Bearer ${auth.token}` } },
      );
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
    fetch(
      `${API_BASE}/api/admin/payments/upi?status=PENDING_VERIFICATION`,
      { headers: { Authorization: `Bearer ${auth.token}` } },
    )
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
  }, [auth.token]);

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
      const response = await fetch(
        `${API_BASE}/api/admin/payments/upi/${payment.id}/review`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({ decision, note }),
        },
      );
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
      const response = await fetch(
        `${API_BASE}/api/admin/orders/${encodeURIComponent(payment.orderNumber)}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({ status }),
        },
      );
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
              <ProofImage payment={payment} token={auth.token} />
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
                        onClick={() => advance(payment, "PACKED")}
                      >
                        Mark packed
                      </button>
                    )}
                    {payment.orderStatus === "PACKED" && (
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

function ProofImage({
  payment,
  token,
}: {
  payment: ManualPayment;
  token: string;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState(false);
  useEffect(() => {
    let objectUrl = "";
    fetch(`${API_BASE}${payment.proofUrl}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
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
  }, [payment.proofUrl, token]);
  return (
    <div className="proof-image">
      {url ? (
        <a href={url} target="_blank" rel="noreferrer">
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
