import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../api/api";
import { formatPrice } from "../context/CartContext";

export default function OrderDetails() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  const loadOrder = async () => {
    try {
      const response = await API.get(`/orders/${orderNumber}`);
      setOrder(response.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/login");
        return;
      }
      setError(err.response?.data?.message || "Could not load order.");
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderNumber]);

  const cancelOrder = async () => {
    try {
      const response = await API.post(`/orders/${orderNumber}/cancel`);
      setOrder(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not cancel order.");
    }
  };

  const downloadInvoice = async () => {
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

  if (error) {
    return <Shell><p style={errorStyle}>{error}</p></Shell>;
  }

  if (!order) {
    return <Shell><p style={{ color: "#C9A84C" }}>Loading order...</p></Shell>;
  }

  return (
    <Shell>
      <Link to="/orders" style={{ color: "#93c5fd", textDecoration: "none" }}>Back to orders</Link>
      <h1 style={{ color: "#4f83ff" }}>Order #{order.orderNumber}</h1>
      <p style={{ color: "#aaa" }}>{new Date(order.placedAt).toLocaleString("en-IN")}</p>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Status Timeline</h2>
        <div style={{ display: "grid", gap: "12px" }}>
          {order.timeline.map((step) => (
            <div key={step.status} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span style={dotStyle(step)} />
              <span style={{ color: step.completed ? "white" : "#64748b" }}>{step.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Items</h2>
        {order.items.map((item) => (
          <div key={item.id} style={itemRowStyle}>
            <div>
              <strong>{item.productName}</strong>
              {item.variant && <p style={mutedStyle}>{item.variant}</p>}
            </div>
            <span>{item.quantity} x {formatPrice(Number(item.unitPrice))}</span>
            <strong>{formatPrice(Number(item.lineTotal))}</strong>
          </div>
        ))}
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Delivery & Payment</h2>
        <p style={mutedStyle}>{order.deliveryAddress.fullName} | {order.deliveryAddress.phone}</p>
        <p style={mutedStyle}>
          {order.deliveryAddress.line1}
          {order.deliveryAddress.line2 ? `, ${order.deliveryAddress.line2}` : ""}, {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
        </p>
        <p style={mutedStyle}>Payment: {order.paymentMethod} - {order.paymentStatus}</p>
      </section>

      <section style={panelStyle}>
        <div style={summaryRowStyle}><span>Subtotal</span><span>{formatPrice(Number(order.subtotal))}</span></div>
        <div style={summaryRowStyle}><span>GST</span><span>{formatPrice(Number(order.gst))}</span></div>
        <div style={summaryRowStyle}><span>Shipping</span><span>{Number(order.shipping) === 0 ? "FREE" : formatPrice(Number(order.shipping))}</span></div>
        <h2 style={{ display: "flex", justifyContent: "space-between" }}><span>Total</span><span style={{ color: "#C9A84C" }}>{formatPrice(Number(order.total))}</span></h2>
      </section>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button onClick={downloadInvoice} style={buttonStyle}>Download Invoice</button>
        {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
          <button onClick={cancelOrder} style={dangerButtonStyle}>Cancel Order</button>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", color: "white", padding: "40px 60px" }}>
      {children}
    </div>
  );
}

const panelStyle = {
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: "8px",
  padding: "20px",
  margin: "18px 0",
};

const sectionTitleStyle = {
  color: "#C9A84C",
  marginTop: 0,
};

const itemRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto auto",
  gap: "18px",
  borderBottom: "1px solid #2a2a2a",
  padding: "12px 0",
};

const mutedStyle = {
  color: "#aaa",
  margin: "6px 0 0",
};

const summaryRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "8px",
  color: "#ccc",
};

const buttonStyle = {
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "10px 13px",
  cursor: "pointer",
};

const dangerButtonStyle = {
  ...buttonStyle,
  background: "#3b1111",
  border: "1px solid #7f1d1d",
};

const errorStyle = {
  background: "#3b1111",
  border: "1px solid #7f1d1d",
  color: "#fecaca",
  padding: "12px 14px",
  borderRadius: "8px",
};

const dotStyle = (step) => ({
  width: "14px",
  height: "14px",
  borderRadius: "50%",
  background: step.completed ? "#22c55e" : "#334155",
  outline: step.current ? "3px solid rgba(34,197,94,0.2)" : "none",
});
