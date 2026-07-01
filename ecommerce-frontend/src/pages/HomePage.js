import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ProductCard from "../components/ProductCard";
import Cart from "../components/Cart";
import CartSidebar from "../components/CartSidebar";
import { useCart } from "../context/CartContext";
import { PRODUCTS } from "../data/data";
import API from "../api/api";
import { getDynamicHomeSections, rankProducts } from "../utils/personalization";

const FALLBACK_IMAGES = {
  mobiles: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=700&q=80",
  electronics: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=700&q=80",
  fashion: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&q=80",
  home: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=700&q=80",
};

export default function HomePage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState(PRODUCTS);
  const [loading, setLoading] = useState(true);
  const { setCartOpen } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await API.get("/products");

        if (Array.isArray(res.data) && res.data.length > 0) {
          setProducts(mergeProductCatalog(res.data));
        } else {
          setProducts(PRODUCTS);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts(PRODUCTS);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = rankProducts(products.filter((product) => {
    const productBadge = product.badge?.toLowerCase();
    const productCategory = product.category?.toLowerCase();

    const matchCategory =
      filter === "all"
        ? true
        : filter === "new"
        ? productBadge === "new"
        : filter === "sale"
        ? productBadge === "sale"
        : filter === "hot"
        ? productBadge === "hot"
        : productCategory === filter;

    const query = search.toLowerCase();
    const matchSearch =
      product.name.toLowerCase().includes(query) ||
      product.brand.toLowerCase().includes(query);

    return matchCategory && matchSearch;
  }), search);
  const dynamicSections = getDynamicHomeSections(products);
  const showDynamicSections = !loading && !search && filter === "all";

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", color: "white" }}>
      <div
        style={{
          width: "100%",
          backgroundColor: "#0b1120",
          padding: "20px 60px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "28px",
          borderBottom: "1px solid #1e293b",
          position: "fixed",
          top: 0,
          zIndex: 100,
          boxSizing: "border-box",
        }}
      >
        <Link to="/" style={brandLinkStyle} aria-label="Nexora home">
          <span style={brandWordStyle}>Nexora</span>
          <span style={brandSmileStyle} />
        </Link>

        <div
          style={{
            display: "flex",
            gap: "24px",
            alignItems: "center",
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <Link to="/" style={navLinkStyle}>Home</Link>
          <Link to="/products" style={navLinkStyle}>Products</Link>
          <Link to="/orders" style={navLinkStyle}>Orders</Link>
          <Link to="/admin" style={navLinkStyle}>Admin</Link>

          <button
            onClick={() => setCartOpen(true)}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: "18px",
              cursor: "pointer",
              fontFamily: "inherit",
              padding: 0,
            }}
          >
            Cart 🛒
          </button>

          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "#1a1a2e",
              border: "1px solid #333",
              borderRadius: "8px",
              padding: "8px 16px",
              color: "white",
              fontSize: "14px",
              width: "min(220px, 22vw)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          <Link
            to="/login"
            style={{
              backgroundColor: "#2563eb",
              color: "white",
              padding: "12px 22px",
              borderRadius: "12px",
              textDecoration: "none",
            }}
          >
            Login
          </Link>
        </div>

      </div>

      <div
        style={{
          display: "flex",
          paddingTop: "100px",
          maxWidth: "1500px",
          margin: "auto",
          gap: "30px",
          paddingInline: "20px",
        }}
      >
        <Sidebar activeFilter={filter} onFilter={setFilter} />

        <div style={{ flex: 1 }}>
          {loading && (
            <p style={{ color: "#C9A84C", fontSize: "18px" }}>
              Loading products...
            </p>
          )}

          {!loading && (
            <>
              {showDynamicSections && dynamicSections.map((section) => (
                <section key={section.title} style={{ marginBottom: "32px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", alignItems: "end", marginBottom: "14px" }}>
                    <div>
                      <h2 style={{ color: "#f8fafc", fontSize: "24px", margin: "0 0 5px" }}>
                        {section.title}
                      </h2>
                      <p style={{ color: "#94a3b8", margin: 0, fontSize: "13px" }}>
                        {section.subtitle}
                      </p>
                    </div>
                    <Link to="/products" style={{ color: "#facc15", textDecoration: "none", fontWeight: "bold" }}>
                      View all
                    </Link>
                  </div>
                  <div style={homeSectionGridStyle}>
                    {section.products.map((product) => (
                      <ProductCard key={`${section.title}-${product.id}`} product={product} />
                    ))}
                  </div>
                </section>
              ))}

              <h2 style={{ color: "#C9A84C", fontSize: "24px", margin: "8px 0 18px" }}>
                {search ? "Personalized Search Results" : "Explore Nexora"}
              </h2>
              <div style={productGridStyle}>
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Cart />
      <CartSidebar />
    </div>
  );
}

function normalizeProduct(product) {
  const match = PRODUCTS.find((item) => item.name.toLowerCase() === product.name.toLowerCase());
  const category = String(product.categoryName || match?.category || "all").toLowerCase();
  const image = product.imageUrl || match?.image || FALLBACK_IMAGES[category] || FALLBACK_IMAGES.electronics;

  return {
    ...match,
    ...product,
    brand: match?.brand || product.categoryName || "Nexora",
    category,
    badge: match?.badge || (Number(product.stockQuantity) <= 5 ? "hot" : "new"),
    image,
    imageUrl: image,
    rating: match?.rating || 4.4,
    reviews: match?.reviews || 1200 + Number(product.id || 0) * 47,
    mrp: match?.mrp || Math.round(Number(product.price) * 1.18),
    sizes: match?.sizes || ["One Size"],
    delivery: match?.delivery || "Fast delivery available",
    offer: match?.offer || "Nexora verified catalog item",
  };
}

function mergeProductCatalog(apiProducts) {
  const normalized = apiProducts.map(normalizeProduct);
  const apiNames = new Set(normalized.map((product) => product.name.toLowerCase()));
  const localOnlyProducts = PRODUCTS.filter((product) => !apiNames.has(product.name.toLowerCase()));

  return [...normalized, ...localOnlyProducts];
}

const productGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "25px",
};

const homeSectionGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "16px",
};

const navLinkStyle = {
  color: "white",
  textDecoration: "none",
  fontSize: "18px",
};

const brandLinkStyle = {
  display: "inline-flex",
  flexDirection: "column",
  alignItems: "flex-start",
  textDecoration: "none",
  lineHeight: 1,
};

const brandWordStyle = {
  color: "#4f83ff",
  fontSize: "35px",
  fontWeight: 800,
  letterSpacing: "0",
  fontFamily: "Georgia, 'Times New Roman', serif",
};

const brandSmileStyle = {
  width: "74px",
  height: "5px",
  borderBottom: "3px solid #f59e0b",
  borderRadius: "0 0 999px 999px",
  transform: "translate(28px, -1px) rotate(-2deg)",
};
