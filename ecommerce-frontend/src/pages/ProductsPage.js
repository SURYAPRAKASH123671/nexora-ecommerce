import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ProductCard from "../components/ProductCard";
import Cart from "../components/Cart";
import CartSidebar from "../components/CartSidebar";
import { useCart } from "../context/CartContext";
import { PRODUCTS } from "../data/data";

export default function ProductsPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { setCartOpen } = useCart();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredProducts = PRODUCTS.filter((product) => {
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

    const matchSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.brand.toLowerCase().includes(search.toLowerCase());

    return matchCategory && matchSearch;
  });

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", color: "white" }}>
      {/* HEADER */}
      <div
        style={{
          width: "100%",
          backgroundColor: "#0b1120",
          padding: isMobile ? "12px 16px" : "20px 60px",
          display: "flex",
          flexDirection: "column",
          borderBottom: "1px solid #1e293b",
          position: isMobile ? "relative" : "fixed",
          top: 0,
          zIndex: 100,
          boxSizing: "border-box",
          gap: isMobile ? "10px" : "0",
        }}
      >
        {/* Top row: logo + nav/icons */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <h1 style={{ color: "#4f83ff", fontSize: isMobile ? "24px" : "35px", margin: 0 }}>
            Nexora 🚀
          </h1>

          {isMobile ? (
            <div style={{ display: "flex", gap: "18px", alignItems: "center" }}>
              <button
                onClick={() => setCartOpen(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "white",
                  fontSize: "22px",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                🛒
              </button>
              <Link
                to="/login"
                style={{
                  backgroundColor: "#2563eb",
                  color: "white",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  fontSize: "14px",
                }}
              >
                Login
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "30px", alignItems: "center" }}>
              <Link to="/" style={navLinkStyle}>Home</Link>
              <Link to="/products" style={navLinkStyle}>Products</Link>
              <Link to="/orders" style={navLinkStyle}>Orders</Link>
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
          )}
        </div>

        {/* Mobile nav links row */}
        {isMobile && (
          <div style={{ display: "flex", gap: "20px" }}>
            <Link to="/" style={{ ...navLinkStyle, fontSize: "14px" }}>Home</Link>
            <Link to="/products" style={{ ...navLinkStyle, fontSize: "14px" }}>Products</Link>
            <Link to="/orders" style={{ ...navLinkStyle, fontSize: "14px" }}>Orders</Link>
          </div>
        )}

        {/* Search bar */}
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: "#1a1a2e",
            border: "1px solid #333",
            borderRadius: "8px",
            padding: "10px 16px",
            color: "white",
            fontSize: "14px",
            width: isMobile ? "100%" : "220px",
            outline: "none",
            boxSizing: "border-box",
            position: isMobile ? "static" : "absolute",
            right: isMobile ? "auto" : "60px",
            top: isMobile ? "auto" : "26px",
          }}
        />
      </div>

      {/* MAIN CONTENT */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          paddingTop: isMobile ? "16px" : "100px",
          maxWidth: "1500px",
          margin: "auto",
          gap: isMobile ? "16px" : "30px",
          paddingInline: isMobile ? "16px" : "20px",
        }}
      >
        <Sidebar activeFilter={filter} onFilter={setFilter} />

        <div style={{ flex: 1 }}>
          {!isMobile && (
            <h2
              style={{
                color: "#C9A84C",
                fontSize: "28px",
                margin: "0 0 25px",
              }}
            >
              All Products
            </h2>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "repeat(2, 1fr)"
                : "repeat(auto-fit, minmax(280px, 1fr))",
              gap: isMobile ? "12px" : "25px",
            }}
          >
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>

      <Cart />
      <CartSidebar />
    </div>
  );
}

const navLinkStyle = {
  color: "white",
  textDecoration: "none",
  fontSize: "18px",
};