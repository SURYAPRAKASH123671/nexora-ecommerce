"use client";

import { useEffect, useMemo, useState } from "react";

type View = "home" | "catalog" | "product" | "cart" | "checkout" | "account" | "admin";

type Product = {
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

type CartLine = { product: Product; quantity: number };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const fallbackProducts: Product[] = [
  {
    id: 101,
    name: "Nexora Arc Headphones",
    description: "Adaptive noise cancellation, spatial sound and 38-hour listening.",
    price: 26990,
    previousPrice: 31990,
    stockQuantity: 18,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=88",
    categoryName: "Audio",
    rating: 4.8,
    reviews: 1240,
    badge: "Bestseller",
  },
  {
    id: 102,
    name: "Pixel Studio Phone",
    description: "A brilliant OLED display, pro-grade camera and all-day intelligence.",
    price: 67999,
    previousPrice: 74999,
    stockQuantity: 12,
    imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=88",
    categoryName: "Phones",
    rating: 4.7,
    reviews: 892,
    badge: "New",
  },
  {
    id: 103,
    name: "AeroBook 14",
    description: "Lightweight performance for ambitious work, wherever ideas happen.",
    price: 89990,
    previousPrice: 99990,
    stockQuantity: 7,
    imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=88",
    categoryName: "Computing",
    rating: 4.9,
    reviews: 540,
    badge: "Top rated",
  },
  {
    id: 104,
    name: "Cloudstep One",
    description: "Responsive everyday trainers shaped for movement and long comfort.",
    price: 7495,
    previousPrice: 8995,
    stockQuantity: 24,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=88",
    categoryName: "Lifestyle",
    rating: 4.6,
    reviews: 723,
    badge: "Limited",
  },
  {
    id: 105,
    name: "Halo Watch 2",
    description: "Thoughtful health insights and essential updates at a glance.",
    price: 21999,
    previousPrice: 24999,
    stockQuantity: 15,
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=88",
    categoryName: "Wearables",
    rating: 4.7,
    reviews: 415,
  },
  {
    id: 106,
    name: "Frame Mini Camera",
    description: "A compact creative camera with cinematic color and intuitive controls.",
    price: 52990,
    previousPrice: 57990,
    stockQuantity: 9,
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=88",
    categoryName: "Cameras",
    rating: 4.8,
    reviews: 308,
    badge: "Creator pick",
  },
];

const categories = ["All", "Phones", "Audio", "Computing", "Wearables", "Lifestyle", "Cameras"];

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

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
          imageUrl: String(item.imageUrl || fallbackProducts[index % fallbackProducts.length].imageUrl),
          categoryName: String(item.categoryName ?? "Collection"),
          rating: 4.6 + (index % 4) / 10,
          reviews: 86 + index * 47,
          badge: index === 0 ? "Featured" : undefined,
        }));
        setProducts(mapped);
        setSelected(mapped[0]);
        setUsingDemoCatalog(false);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((product) => {
      const categoryMatch = category === "All" || product.categoryName === category;
      const searchMatch = !term || `${product.name} ${product.description} ${product.categoryName}`.toLowerCase().includes(term);
      return categoryMatch && searchMatch;
    });
  }, [products, query, category]);

  const cartCount = cart.reduce((total, line) => total + line.quantity, 0);
  const subtotal = cart.reduce((total, line) => total + line.product.price * line.quantity, 0);
  const shipping = subtotal > 5000 || subtotal === 0 ? 0 : 99;
  const total = subtotal + shipping;

  function navigate(next: View) {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openProduct(product: Product) {
    setSelected(product);
    navigate("product");
  }

  function addToCart(product: Product) {
    setCart((current) => {
      const line = current.find((item) => item.product.id === product.id);
      if (line) return current.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { product, quantity: 1 }];
    });
    setNotice(`${product.name} added to your bag`);
    window.setTimeout(() => setNotice(""), 2400);
  }

  function changeQuantity(productId: number, delta: number) {
    setCart((current) => current
      .map((line) => line.product.id === productId ? { ...line, quantity: line.quantity + delta } : line)
      .filter((line) => line.quantity > 0));
  }

  function toggleWishlist(productId: number) {
    setWishlist((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]);
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    navigate("catalog");
  }

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="topbar">
        <button className="brand" onClick={() => navigate("home")} aria-label="Nexora home">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>Nexora</span>
        </button>
        <form className="search" onSubmit={submitSearch} role="search">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, categories and more" aria-label="Search products" />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>}
        </form>
        <nav className="header-actions" aria-label="Primary navigation">
          <button onClick={() => navigate("catalog")}><span aria-hidden="true">▦</span><span>Shop</span></button>
          <button onClick={() => navigate("account")}><span aria-hidden="true">◯</span><span>Account</span></button>
          <button className="cart-action" onClick={() => navigate("cart")}><span aria-hidden="true">◇</span><span>Bag</span>{cartCount > 0 && <b>{cartCount}</b>}</button>
        </nav>
      </header>

      <div className="category-strip" aria-label="Shop categories">
        {categories.slice(1).map((item) => (
          <button key={item} onClick={() => { setCategory(item); navigate("catalog"); }}>{item}</button>
        ))}
        <span className="strip-spacer" />
        <button onClick={() => navigate("admin")}>Admin preview</button>
      </div>

      {notice && <div className="toast" role="status">✓ {notice}</div>}

      <main id="main">
        {view === "home" && (
          <>
            <section className="hero wrap">
              <div className="hero-copy">
                <span className="eyebrow">Designed for everyday wonder</span>
                <h1>Good things,<br /><span>thoughtfully chosen.</span></h1>
                <p>Discover technology and lifestyle essentials selected for quality, usefulness and lasting value.</p>
                <div className="hero-actions">
                  <button className="primary" onClick={() => navigate("catalog")}>Explore the collection</button>
                  <button className="secondary" onClick={() => openProduct(products[0])}>See today&apos;s pick <span aria-hidden="true">→</span></button>
                </div>
                <div className="hero-proof">
                  <span><b>4.8</b> customer rating</span>
                  <span><b>2-day</b> priority delivery</span>
                  <span><b>30-day</b> easy returns</span>
                </div>
              </div>
              <div className="hero-visual" aria-label="Featured Nexora products">
                <div className="orb orb-one" />
                <div className="orb orb-two" />
                <div className="hero-card hero-card-main">
                  <span>Editor&apos;s choice</span>
                  <img src={products[0].imageUrl} alt={products[0].name} />
                  <div><b>{products[0].name}</b><small>{money.format(products[0].price)}</small></div>
                </div>
                <div className="hero-card hero-card-small"><span>Free delivery</span><b>Above ₹5,000</b></div>
                <div className="hero-card hero-card-rating"><b>4.8 ★</b><span>Loved by thousands</span></div>
              </div>
            </section>

            <section className="trust-row wrap" aria-label="Nexora service promises">
              <article><span aria-hidden="true">◎</span><div><b>Curated quality</b><small>Products worth bringing home</small></div></article>
              <article><span aria-hidden="true">⌁</span><div><b>Fast, tracked delivery</b><small>Clear updates from cart to door</small></div></article>
              <article><span aria-hidden="true">♢</span><div><b>Protected payments</b><small>Secure checkout and privacy</small></div></article>
              <article><span aria-hidden="true">↺</span><div><b>Easy returns</b><small>Simple support when plans change</small></div></article>
            </section>

            <ProductSection title="Trending now" subtitle="What people are loving this week" products={products.slice(0, 4)} onOpen={openProduct} onAdd={addToCart} wishlist={wishlist} onWishlist={toggleWishlist} loading={loading} onAll={() => navigate("catalog")} />

            <section className="collection-grid wrap">
              <article className="collection-card collection-blue" onClick={() => { setCategory("Computing"); navigate("catalog"); }}>
                <div><span className="eyebrow">Work beautifully</span><h2>Tools for your next big idea.</h2><p>Focused technology for creating, learning and building.</p><button>Explore computing →</button></div>
                <img src={fallbackProducts[2].imageUrl} alt="AeroBook laptop collection" />
              </article>
              <article className="collection-card collection-sand" onClick={() => { setCategory("Lifestyle"); navigate("catalog"); }}>
                <div><span className="eyebrow">Move your way</span><h2>Comfort in every step.</h2><p>Everyday essentials made to keep up.</p><button>Shop lifestyle →</button></div>
                <img src={fallbackProducts[3].imageUrl} alt="Cloudstep lifestyle collection" />
              </article>
            </section>

            <ProductSection title="Recommended for you" subtitle="Based on what is popular across Nexora" products={products.slice(2, 6)} onOpen={openProduct} onAdd={addToCart} wishlist={wishlist} onWishlist={toggleWishlist} loading={loading} onAll={() => navigate("catalog")} />

            <section className="testimonial wrap">
              <div><span className="eyebrow">Customer story</span><blockquote>“The entire experience felt calm and effortless—from finding the right headphones to knowing exactly when they would arrive.”</blockquote><p><b>Ananya R.</b> · Verified buyer</p></div>
              <div className="testimonial-score"><strong>4.8</strong><span>★★★★★</span><small>Average across verified purchases</small></div>
            </section>
          </>
        )}

        {view === "catalog" && (
          <section className="catalog wrap">
            <div className="page-heading"><div><span className="eyebrow">Nexora collection</span><h1>{query ? `Results for “${query}”` : category === "All" ? "Shop everything" : category}</h1><p>{filtered.length} thoughtfully selected products</p></div><button className="filter-button">Sort: Recommended ⌄</button></div>
            {usingDemoCatalog && <div className="info-banner"><span>i</span><div><b>Portfolio catalogue active</b><p>The live backend is supported; curated sample products appear while its database is empty or offline.</p></div></div>}
            <div className="filter-chips" aria-label="Filter by category">
              {categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
            </div>
            {filtered.length ? <div className="product-grid catalog-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} onOpen={openProduct} onAdd={addToCart} liked={wishlist.includes(product.id)} onWishlist={toggleWishlist} />)}</div> : <EmptyState title="No products found" body="Try a broader search or choose another category." action="Clear filters" onAction={() => { setQuery(""); setCategory("All"); }} />}
          </section>
        )}

        {view === "product" && (
          <section className="product-page wrap">
            <button className="back-link" onClick={() => navigate("catalog")}>← Back to products</button>
            <div className="product-layout">
              <div className="product-gallery">
                <div className="main-image"><span className="image-badge">{selected.badge ?? "Nexora select"}</span><img src={selected.imageUrl} alt={selected.name} /></div>
                <div className="thumbnail-row"><button className="selected-thumb"><img src={selected.imageUrl} alt="Front view" /></button><button><img src={selected.imageUrl} alt="Detail view" /></button><button className="future-thumb">360°<small>Future</small></button></div>
              </div>
              <div className="product-info">
                <span className="eyebrow">{selected.categoryName}</span>
                <h1>{selected.name}</h1>
                <button className="rating-link">★ {selected.rating} · {selected.reviews.toLocaleString("en-IN")} reviews</button>
                <p className="product-description">{selected.description}</p>
                <div className="price-line"><strong>{money.format(selected.price)}</strong>{selected.previousPrice && <><del>{money.format(selected.previousPrice)}</del><span>Save {money.format(selected.previousPrice - selected.price)}</span></>}</div>
                <div className="choice-block"><label>Finish</label><div className="swatches"><button className="swatch dark active" aria-label="Obsidian selected" /><button className="swatch light" aria-label="Porcelain" /><button className="swatch blue" aria-label="Sky" /></div><small>Obsidian</small></div>
                <div className="delivery-card"><span aria-hidden="true">⌁</span><div><b>Delivery to 560001</b><p>Order today for priority delivery in 2–3 days.</p></div><button>Change</button></div>
                <div className="purchase-actions"><button className="primary grow" onClick={() => addToCart(selected)}>Add to bag · {money.format(selected.price)}</button><button className={`wish-large ${wishlist.includes(selected.id) ? "liked" : ""}`} onClick={() => toggleWishlist(selected.id)} aria-label="Save to wishlist">♡</button></div>
                <div className="assurance-list"><span>✓ 30-day easy returns</span><span>✓ 1-year manufacturer warranty</span><span>✓ Secure payment options</span></div>
                <details open><summary>Highlights</summary><ul><li>Premium materials selected for everyday durability</li><li>Designed around intuitive, low-friction use</li><li>Reliable support through the Nexora account experience</li></ul></details>
                <details><summary>Specifications</summary><p>Complete specifications are supplied by the product catalogue API when available.</p></details>
              </div>
            </div>
            <ProductSection title="Pairs well with" subtitle="Frequently explored together" products={products.filter((item) => item.id !== selected.id).slice(0, 4)} onOpen={openProduct} onAdd={addToCart} wishlist={wishlist} onWishlist={toggleWishlist} loading={false} onAll={() => navigate("catalog")} />
          </section>
        )}

        {view === "cart" && (
          <section className="bag-page wrap">
            <div className="page-heading"><div><span className="eyebrow">Your selection</span><h1>Your bag</h1><p>{cartCount} {cartCount === 1 ? "item" : "items"}</p></div></div>
            {cart.length === 0 ? <EmptyState title="Your bag is ready for something good" body="Explore thoughtfully selected products and add your favourites here." action="Start shopping" onAction={() => navigate("catalog")} /> : (
              <div className="bag-layout">
                <div className="bag-lines">{cart.map((line) => <article className="bag-line" key={line.product.id}><img src={line.product.imageUrl} alt={line.product.name} /><div className="bag-line-info"><span>{line.product.categoryName}</span><h3>{line.product.name}</h3><p>Obsidian · In stock</p><div className="quantity"><button onClick={() => changeQuantity(line.product.id, -1)} aria-label={`Decrease ${line.product.name} quantity`}>−</button><b>{line.quantity}</b><button onClick={() => changeQuantity(line.product.id, 1)} aria-label={`Increase ${line.product.name} quantity`}>+</button></div></div><div className="bag-price"><strong>{money.format(line.product.price * line.quantity)}</strong><button onClick={() => changeQuantity(line.product.id, -line.quantity)}>Remove</button></div></article>)}</div>
                <OrderSummary subtotal={subtotal} shipping={shipping} total={total} onCheckout={() => navigate("checkout")} />
              </div>
            )}
          </section>
        )}

        {view === "checkout" && (
          <section className="checkout-page wrap">
            <div className="checkout-progress"><span className="active">1</span><b>Delivery</b><i /><span>2</span><b>Payment</b><i /><span>3</span><b>Review</b></div>
            <div className="page-heading"><div><span className="eyebrow">Secure checkout</span><h1>Complete your order</h1><p>One clear page. No surprises.</p></div><span className="secure-label">♢ Protected checkout</span></div>
            {cart.length === 0 ? <EmptyState title="Nothing to check out yet" body="Add an item before continuing to checkout." action="Browse products" onAction={() => navigate("catalog")} /> : (
              <div className="checkout-layout">
                <div className="checkout-form">
                  <section className="form-card"><div className="form-title"><span>1</span><div><h2>Contact</h2><p>We’ll send order updates here.</p></div></div><div className="field-grid"><label className="full">Email address<input type="email" placeholder="you@example.com" /></label><label>First name<input placeholder="First name" /></label><label>Last name<input placeholder="Last name" /></label><label className="full">Phone number<input inputMode="tel" placeholder="+91 98765 43210" /></label></div></section>
                  <section className="form-card"><div className="form-title"><span>2</span><div><h2>Delivery address</h2><p>Choose where your order should arrive.</p></div></div><div className="field-grid"><label className="full">Address line<input placeholder="House number and street" /></label><label>City<input placeholder="Bengaluru" /></label><label>State<input placeholder="Karnataka" /></label><label>PIN code<input inputMode="numeric" placeholder="560001" /></label></div></section>
                  <section className="form-card"><div className="form-title"><span>3</span><div><h2>Payment method</h2><p>Payment processing connects to the secured backend workflow.</p></div></div><div className="payment-options"><label><input type="radio" name="payment" defaultChecked /><span>Card / UPI</span><small>Provider integration required for live payment</small></label><label><input type="radio" name="payment" /><span>Cash on delivery</span><small>Pay when your order arrives</small></label></div><button className="primary full-button" onClick={() => setNotice("Checkout UI validated; sign in and payment provider are required for live submission.")}>Review order · {money.format(total)}</button></section>
                </div>
                <OrderSummary subtotal={subtotal} shipping={shipping} total={total} compact onCheckout={() => setNotice("Order submission requires an authenticated customer session.")} />
              </div>
            )}
          </section>
        )}

        {view === "account" && <AccountView wishlistCount={wishlist.length} onShop={() => navigate("catalog")} />}
        {view === "admin" && <AdminView products={products} onBack={() => navigate("home")} />}
      </main>

      <footer>
        <div className="footer-main wrap"><div className="footer-brand"><div className="brand"><span className="brand-mark">N</span><span>Nexora</span></div><p>Thoughtful products. Clear choices. A better way to shop.</p></div><div><h3>Shop</h3><button onClick={() => navigate("catalog")}>All products</button><button onClick={() => { setCategory("Phones"); navigate("catalog"); }}>Phones</button><button onClick={() => { setCategory("Computing"); navigate("catalog"); }}>Computing</button></div><div><h3>Support</h3><button>Help centre</button><button>Delivery & returns</button><button>Contact us</button></div><div><h3>About</h3><button>Our standards</button><button>Privacy</button><button>Terms</button></div></div>
        <div className="footer-bottom wrap"><span>© 2026 Nexora Commerce</span><span>India · English</span><span>Portfolio product · Live capabilities are documented transparently</span></div>
      </footer>
    </div>
  );
}

function ProductSection({ title, subtitle, products, onOpen, onAdd, wishlist, onWishlist, loading, onAll }: { title: string; subtitle: string; products: Product[]; onOpen: (product: Product) => void; onAdd: (product: Product) => void; wishlist: number[]; onWishlist: (id: number) => void; loading: boolean; onAll: () => void }) {
  return <section className="product-section wrap"><div className="section-heading"><div><h2>{title}</h2><p>{subtitle}</p></div><button onClick={onAll}>View all <span aria-hidden="true">→</span></button></div>{loading ? <div className="product-grid">{[1, 2, 3, 4].map((item) => <div className="skeleton-card" key={item}><i /><b /><span /><span /></div>)}</div> : <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} onOpen={onOpen} onAdd={onAdd} liked={wishlist.includes(product.id)} onWishlist={onWishlist} />)}</div>}</section>;
}

function ProductCard({ product, onOpen, onAdd, liked, onWishlist }: { product: Product; onOpen: (product: Product) => void; onAdd: (product: Product) => void; liked: boolean; onWishlist: (id: number) => void }) {
  return <article className="product-card"><div className="product-image" onClick={() => onOpen(product)}>{product.badge && <span>{product.badge}</span>}<button className={liked ? "liked" : ""} onClick={(event) => { event.stopPropagation(); onWishlist(product.id); }} aria-label={liked ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}>♡</button><img src={product.imageUrl} alt={product.name} loading="lazy" /></div><div className="product-meta"><small>{product.categoryName}</small><button className="product-name" onClick={() => onOpen(product)}>{product.name}</button><div className="rating">★ {product.rating} <span>({product.reviews})</span></div><div className="card-bottom"><div><strong>{money.format(product.price)}</strong>{product.previousPrice && <del>{money.format(product.previousPrice)}</del>}</div><button className="add-button" onClick={() => onAdd(product)} aria-label={`Add ${product.name} to bag`}>+</button></div></div></article>;
}

function OrderSummary({ subtotal, shipping, total, onCheckout, compact = false }: { subtotal: number; shipping: number; total: number; onCheckout: () => void; compact?: boolean }) {
  return <aside className={`order-summary ${compact ? "compact" : ""}`}><h2>Order summary</h2><div><span>Subtotal</span><b>{money.format(subtotal)}</b></div><div><span>Delivery</span><b>{shipping ? money.format(shipping) : "Free"}</b></div><div><span>Estimated GST</span><b>Calculated by server</b></div><div className="summary-total"><span>Total</span><strong>{money.format(total)}</strong></div>{!compact && <label className="coupon"><input placeholder="Coupon code" /><button>Apply</button></label>}<button className="primary full-button" onClick={onCheckout}>{compact ? "Place order securely" : "Continue to checkout"}</button><p className="summary-note">♢ Secure checkout · Easy returns · No hidden fees</p></aside>;
}

function EmptyState({ title, body, action, onAction }: { title: string; body: string; action: string; onAction: () => void }) {
  return <div className="empty-state"><div aria-hidden="true">◇</div><h2>{title}</h2><p>{body}</p><button className="primary" onClick={onAction}>{action}</button></div>;
}

function AccountView({ wishlistCount, onShop }: { wishlistCount: number; onShop: () => void }) {
  return <section className="account-page wrap"><div className="account-hero"><div><span className="eyebrow">Your Nexora</span><h1>Everything you need, in one calm place.</h1><p>Track orders, manage delivery details and return to products you love.</p><button className="primary">Sign in to your account</button></div><div className="account-avatar">SP</div></div><div className="account-grid"><article><span>□</span><h3>Orders</h3><p>Track delivery, download invoices and manage returns.</p><b>Backend ready →</b></article><article><span>♡</span><h3>Wishlist</h3><p>{wishlistCount} saved {wishlistCount === 1 ? "product" : "products"} on this device.</p><button onClick={onShop}>Browse products →</button></article><article><span>⌂</span><h3>Addresses</h3><p>Save delivery locations for faster checkout.</p><b>Backend ready →</b></article><article><span>♢</span><h3>Security</h3><p>Password management and protected account access.</p><b>Backend ready →</b></article></div><div className="info-banner"><span>i</span><div><b>Authentication integration boundary</b><p>The Java backend already implements JWT accounts. This hosted visual preview does not expose or fake a production sign-in session.</p></div></div></section>;
}

function AdminView({ products, onBack }: { products: Product[]; onBack: () => void }) {
  const stock = products.reduce((sum, product) => sum + product.stockQuantity, 0);
  return <section className="admin-page wrap"><div className="admin-head"><div><button className="back-link" onClick={onBack}>← Storefront</button><span className="eyebrow">Operations centre</span><h1>Good morning, Surya.</h1><p>A focused view of commerce health and actions.</p></div><button className="primary">＋ Add product</button></div><div className="demo-label">Portfolio preview · Product and inventory figures reflect the active catalogue; revenue figures are illustrative.</div><div className="metric-grid"><article><span>Gross revenue</span><strong>₹8.42L</strong><small className="positive">↑ 12.4% illustrative</small></article><article><span>Orders</span><strong>1,284</strong><small className="positive">↑ 8.1% illustrative</small></article><article><span>Products</span><strong>{products.length}</strong><small>Live catalogue count</small></article><article><span>Units in stock</span><strong>{stock}</strong><small>Live catalogue total</small></article></div><div className="admin-columns"><section className="chart-card"><div className="section-heading"><div><h2>Revenue overview</h2><p>Illustrative seven-day trend</p></div><button>Last 7 days ⌄</button></div><div className="bar-chart" aria-label="Illustrative revenue bar chart">{[44, 62, 51, 78, 66, 91, 84].map((height, index) => <div key={index}><i style={{ height: `${height}%` }} /><span>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}</span></div>)}</div></section><section className="activity-card"><div className="section-heading"><div><h2>Operational health</h2><p>Backend capabilities</p></div></div><ul><li><span className="status-dot green" /><div><b>Catalog administration</b><small>Create, update, activate and retire products</small></div><strong>Ready</strong></li><li><span className="status-dot green" /><div><b>Inventory protection</b><small>Transactional stock reservation and restoration</small></div><strong>Ready</strong></li><li><span className="status-dot green" /><div><b>Order lifecycle</b><small>Controlled fulfilment transitions</small></div><strong>Ready</strong></li><li><span className="status-dot amber" /><div><b>Payment provider</b><small>External signed webhook integration</small></div><strong>Roadmap</strong></li></ul></section></div><section className="inventory-table"><div className="section-heading"><div><h2>Inventory</h2><p>Live products loaded into this preview</p></div><button>View reports →</button></div><div className="table-head"><span>Product</span><span>Category</span><span>Stock</span><span>Status</span></div>{products.slice(0, 5).map((product) => <div className="table-row" key={product.id}><span><img src={product.imageUrl} alt="" /><b>{product.name}</b></span><span>{product.categoryName}</span><span>{product.stockQuantity}</span><span className={product.stockQuantity < 10 ? "low-stock" : "in-stock"}>{product.stockQuantity < 10 ? "Low stock" : "Healthy"}</span></div>)}</section></section>;
}
