import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";
import HomePage from "./pages/HomePage";

const emptyForm = {
  name: "",
  brand: "",
  description: "",
  price: "",
  category: "clothing",
  imageUrl: "",
  badge: "new",
  rating: "4.5",
  reviewCount: "0",
  stock: "1",
};

export default function AdminDashboard() {
  const [form, setForm] = useState(emptyForm);
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await API.get("/products");
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      setMessage("Could not load products. Check backend.");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const payload = {
      ...form,
      price: Number(form.price),
      rating: Number(form.rating),
      reviewCount: Number(form.reviewCount),
      stock: Number(form.stock),
    };

    try {
      await API.post("/admin/products", payload);
      setMessage("Product added successfully.");
      setForm(emptyForm);
      fetchProducts();
    } catch (error) {
      console.error(error);
      setMessage("Failed to add product. Login first and check backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", color: "white" }}>
      <div style={navbarStyle}>
        <h1 style={{ color: "#4f83ff", fontSize: "35px", margin: 0 }}>
          Nexora Admin
        </h1>

        <div style={{ display: "flex", gap: "28px", alignItems: "center" }}>
          <Link to="/" style={navLinkStyle}>Home</Link>
          <Link to="/products" style={navLinkStyle}>Products</Link>
          <Link to="/orders" style={navLinkStyle}>Orders</Link>
        </div>
      </div>

      <main style={{ maxWidth: "1250px", margin: "0 auto", padding: "120px 20px 40px" }}>
        <h2 style={{ color: "#C9A84C", fontSize: "30px", marginBottom: "8px" }}>
          Product Management
        </h2>

        <p style={{ color: "#aaa", marginBottom: "28px" }}>
          Add products to MySQL and show them on the store.
        </p>

        {message && (
          <p style={{
            background: "#141414",
            border: "1px solid #333",
            color: message.includes("successfully") ? "#4ade80" : "#f87171",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}>
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} style={formStyle}>
          <input name="name" placeholder="Product name" value={form.name} onChange={handleChange} style={inputStyle} required />
          <input name="brand" placeholder="Brand" value={form.brand} onChange={handleChange} style={inputStyle} required />
          <input name="price" type="number" placeholder="Price" value={form.price} onChange={handleChange} style={inputStyle} required />
          <input name="imageUrl" placeholder="Image URL" value={form.imageUrl} onChange={handleChange} style={inputStyle} required />

          <select name="category" value={form.category} onChange={handleChange} style={inputStyle}>
            <option value="clothing">Clothing</option>
            <option value="watches">Watches</option>
            <option value="accessories">Accessories</option>
          </select>

          <select name="badge" value={form.badge} onChange={handleChange} style={inputStyle}>
            <option value="new">New</option>
            <option value="hot">Hot</option>
            <option value="sale">Sale</option>
            <option value="">No Badge</option>
          </select>

          <input name="rating" type="number" step="0.1" placeholder="Rating" value={form.rating} onChange={handleChange} style={inputStyle} />
          <input name="reviewCount" type="number" placeholder="Review count" value={form.reviewCount} onChange={handleChange} style={inputStyle} />
          <input name="stock" type="number" placeholder="Stock" value={form.stock} onChange={handleChange} style={inputStyle} />

          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            style={{ ...inputStyle, minHeight: "95px", gridColumn: "1 / -1", resize: "vertical" }}
          />

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Adding..." : "Add Product"}
          </button>
        </form>

        <section style={{ marginTop: "35px" }}>
          <h3 style={{ color: "#C9A84C", fontSize: "24px", marginBottom: "18px" }}>
            Current Products
          </h3>

          <div style={{ display: "grid", gap: "14px" }}>
            {products.map((product) => (
              <div key={product.id} style={productRowStyle}>
                <img
                  src={product.imageUrl || product.image}
                  alt={product.name}
                  style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: "8px" }}
                />

                <div style={{ flex: 1 }}>
                  <strong>{product.brand} {product.name}</strong>
                  <p style={{ color: "#aaa", margin: "6px 0 0" }}>
                    {product.category} | {product.badge || "no badge"} | Stock: {product.stock ?? "N/A"}
                  </p>
                </div>

                <strong style={{ color: "#C9A84C" }}>
                  ₹{Number(product.price).toLocaleString("en-IN")}
                </strong>
              </div>
            ))}

            {products.length === 0 && (
              <p style={{ color: "#aaa" }}>No backend products yet.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

const navbarStyle = {
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
};

const navLinkStyle = {
  color: "white",
  textDecoration: "none",
  fontSize: "18px",
};

const formStyle = {
  background: "#141414",
  border: "1px solid #292929",
  borderRadius: "10px",
  padding: "22px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "14px",
};

const inputStyle = {
  background: "#1a1a1a",
  border: "1px solid #333",
  color: "white",
  borderRadius: "8px",
  padding: "12px",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

const buttonStyle = {
  background: "#C9A84C",
  color: "black",
  border: "none",
  borderRadius: "8px",
  padding: "13px",
  fontWeight: "bold",
  cursor: "pointer",
};

const productRowStyle = {
  background: "#141414",
  border: "1px solid #292929",
  borderRadius: "10px",
  padding: "14px",
  display: "flex",
  alignItems: "center",
  gap: "16px",
};