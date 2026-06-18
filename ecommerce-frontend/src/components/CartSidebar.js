import React from "react";
import { useCart, formatPrice } from "../context/CartContext";

export default function CartSidebar() {
  const { cartCount, total, setCartOpen } = useCart();

  if (cartCount === 0) return null;

  return (
    <button
      onClick={() => setCartOpen(true)}
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: "#C9A84C",
        color: "black",
        padding: "15px 25px",
        border: "none",
        cursor: "pointer",
        zIndex: 1000,
      }}
    >
      🛍 {cartCount} Items — {formatPrice(total)}
    </button>
  );
}