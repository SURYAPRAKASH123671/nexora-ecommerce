import React from "react";
import { useCart, formatPrice } from "../context/CartContext";

export default function OrderHistory() {
  const { orders } = useCart();

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", color: "white", padding: "40px 60px" }}>
      <h1>Order History</h1>

      {orders.length === 0 && (
        <p style={{ color: "#aaa" }}>No orders yet.</p>
      )}

      {orders.map((order) => (
        <div key={order.id} style={{
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ color: "#aaa" }}>Order #{order.id}</span>
            <span style={{ color: "#aaa" }}>{order.date}</span>
          </div>

          {order.items.map((item) => (
            <div key={item.cartKey} style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "1px solid #2a2a2a",
            }}>
              <span>{item.name} x{item.qty}</span>
              <span>{formatPrice(item.price * item.qty)}</span>
            </div>
          ))}

          {order.deliveryAddress && (
            <div style={{
              background: "#111",
              border: "1px solid #2a2a2a",
              borderRadius: "8px",
              padding: "12px",
              marginTop: "14px",
              color: "#ddd",
            }}>
              <strong>Delivery Address</strong>
              <p style={{ margin: "8px 0 0", color: "#aaa", lineHeight: 1.5 }}>
                {order.deliveryAddress.fullName}, {order.deliveryAddress.phone}
                <br />
                {order.deliveryAddress.line1}
                {order.deliveryAddress.line2 ? `, ${order.deliveryAddress.line2}` : ""}
                <br />
                {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
              </p>
            </div>
          )}

          <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#aaa" }}>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#aaa" }}>GST</span>
            <span>{formatPrice(order.gst)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#aaa" }}>Shipping</span>
            <span>{order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
            <span style={{ color: "#aaa" }}>Payment</span>
            <span>{order.paymentMethod?.label || "Cash on Delivery"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#aaa" }}>Payment Status</span>
            <span>{order.paymentStatus || "Pay on delivery"}</span>
          </div>

          <h3 style={{ marginTop: "10px", display: "flex", justifyContent: "space-between" }}>
            <span>Total</span>
            <span style={{ color: "#C9A84C" }}>{formatPrice(order.total)}</span>
          </h3>
        </div>
      ))}
    </div>
  );
}
