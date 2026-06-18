import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ProductCard from "../components/ProductCard";
import Cart from "../components/Cart";
import CartSidebar from "../components/CartSidebar";
import { useCart } from "../context/CartContext";
import { PRODUCTS } from "../data/data";
import API from "../api/api";

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
          setProducts(res.data);
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

  const filteredProducts = products.filter((product) => {
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
      <div
        style={{
          width: "100%",
          backgroundColor: "#0b1120",
          padding: "20px 60px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #1e293b",
          position: "fixed",
          top: 0,
          zIndex: 100,
          boxSizing: "border-box",
        }}
      >
        <h1 style={{ color: "#4f83ff", fontSize: "35px", margin: 0 }}>
          Nexora 🚀
        </h1>

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
            width: "220px",
            outline: "none",
          }}
        />
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "25px",
              }}
            >
                            {filteredProducts.map((product) => (
                              <ProductCard key={product.id} product={product} />
                            ))}
                          </div>
                        )}
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