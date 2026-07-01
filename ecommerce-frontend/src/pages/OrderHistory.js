import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";
import { formatPrice } from "../context/CartContext";

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/orders");
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/login");
        return;
      }
      setError(err.response?.data?.message || "Could not load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const cancelOrder = async (orderNumber) => {
    try {
      await API.post(`/orders/${orderNumber}/cancel`);
      await loadOrders();
    } catch (err) {
      setError(err.response?.data?.message || "Could not cancel order.");
    }
  };

  const downloadInvoice = async (orderNumber) => {
    try {
      const response = await API.get(`/orders/${orderNumber}/invoice`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `nexora-invoice-${orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "Could not download invoice.");
    }
  };

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", color: "white", padding: "40px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ margin: 0, color: "#4f83ff" }}>My Orders</h1>
          <p style={{ color: "#aaa", marginTop: "8px" }}>Track, cancel, and download invoices.</p>
        </div>
        <Link to="/" style={navButtonStyle}>Continue Shopping</Link>
      </div>

      {loading && <p style={{ color: "#C9A84C" }}>Loading orders...</p>}
      {error && <p style={errorStyle}>{error}</p>}
      {!loading && orders.length === 0 && <p style={{ color: "#aaa" }}>No orders yet.</p>}

      {orders.map((order) => (
        <div key={order.orderNumber} style={orderCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", flexWrap: "wrap" }}>
            <div>
              <span style={{ color: "#aaa" }}>Order #{order.orderNumber}</span>
              <h2 style={{ margin: "6px 0", fontSize: "20px" }}>{order.items.length} item(s)</h2>
              <span style={statusStyle(order.status)}>{order.status.replaceAll("_", " ")}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, color: "#aaa" }}>{new Date(order.placedAt).toLocaleString("en-IN")}</p>
              <h2 style={{ color: "#C9A84C", margin: "8px 0 0" }}>{formatPrice(Number(order.total))}</h2>
            </div>
          </div>

          <div style={{ marginTop: "16px", display: "grid", gap: "10px" }}>
            {order.items.slice(0, 2).map((item) => (
              <div key={item.id} style={itemRowStyle}>
                <span>{item.productName} x{item.quantity}</span>
                <span>{formatPrice(Number(item.lineTotal))}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link to={`/orders/${order.orderNumber}`} style={navButtonStyle}>View Details</Link>
            <button onClick={() => downloadInvoice(order.orderNumber)} style={secondaryButtonStyle}>Download Invoice</button>
            {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
              <button onClick={() => cancelOrder(order.orderNumber)} style={dangerButtonStyle}>Cancel Order</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const orderCardStyle = {
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "20px",
};

const itemRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  padding: "9px 0",
  borderBottom: "1px solid #2a2a2a",
};

const navButtonStyle = {
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "10px 13px",
  textDecoration: "none",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  background: "#1f2937",
  color: "white",
  border: "1px solid #334155",
  borderRadius: "8px",
  padding: "10px 13px",
  cursor: "pointer",
};

const dangerButtonStyle = {
  ...secondaryButtonStyle,
  color: "#fecaca",
  border: "1px solid #7f1d1d",
};

const errorStyle = {
  background: "#3b1111",
  border: "1px solid #7f1d1d",
  color: "#fecaca",
  padding: "12px 14px",
  borderRadius: "8px",
};

const statusStyle = (status) => ({
  display: "inline-block",
  background: status === "CANCELLED" ? "#3b1111" : "#052e1a",
  color: status === "CANCELLED" ? "#fecaca" : "#86efac",
  border: status === "CANCELLED" ? "1px solid #7f1d1d" : "1px solid #166534",
  borderRadius: "999px",
  padding: "5px 10px",
  fontSize: "12px",
  fontWeight: "bold",
});
