import React from "react";
import { useCart, formatPrice } from "../context/CartContext";

export default function CartSidebar() {
  const { cartCount, total, setCartOpen } = useCart();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 640);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (cartCount === 0) return null;

  return (
    <button
      onClick={() => setCartOpen(true)}
      style={{
        position: "fixed",
        bottom: isMobile ? "12px" : "20px",
        right: isMobile ? "12px" : "20px",
        left: isMobile ? "12px" : "auto",
        background: "#C9A84C",
        color: "black",
        padding: isMobile ? "13px 16px" : "15px 25px",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        zIndex: 1000,
        fontWeight: "bold",
      }}
    >
      🛍 {cartCount} Items — {formatPrice(total)}
    </button>
  );
}
