import React from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

export default function ProductCard({ product }) {
  const {
    addToCart,
    toggleWishlist,
    isWishlisted,
    formatPrice,
    setCartOpen,
  } = useCart();
  const navigate = useNavigate();

  const image = product.image || product.imageUrl;
  const reviews = product.reviews || product.reviewCount || 0;
  const sizes = product.sizes || ["One Size"];
  const badge = product.badge?.toLowerCase();
  const discount = product.mrp
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const handleBuyNow = () => {
    addToCart(product, sizes[0]);
    setCartOpen(true);
  };

  return (
    <div
      style={{
        background: "#171717",
        border: "1px solid #2a2a2a",
        borderRadius: "8px",
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: "0 10px 28px rgba(0,0,0,0.22)",
      }}
    >
      <div
        onClick={() => navigate(`/product/${product.id}`)}
        style={{ width: "100%", height: "210px", overflow: "hidden", background: "#f8fafc", position: "relative" }}
      >
        {badge && (
        <div
          style={{
            background:
              badge === "sale"
                ? "#e53e3e"
                : badge === "new"
                ? "#38a169"
                : "#C9A84C",
            color: "white",
            fontSize: "11px",
            fontWeight: "bold",
            padding: "4px 10px",
            display: "inline-block",
            margin: "12px",
            borderRadius: "4px",
            textTransform: "uppercase",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 1,
          }}
        >
          {badge}
        </div>
        )}
        <img
          src={image}
          alt={product.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      <div style={{ padding: "14px" }}>
        <p style={{ color: "#b6b6b6", fontSize: "12px", margin: "0 0 5px" }}>
          {product.brand}
        </p>

        <h3
          onClick={() => navigate(`/product/${product.id}`)}
          style={{
            color: "white",
            fontSize: "15px",
            margin: "0 0 8px",
            cursor: "pointer",
            minHeight: "38px",
            lineHeight: 1.25,
          }}
        >
          {product.name}
        </h3>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "12px",
          }}
        >
          <span style={ratingPillStyle}>
            {(product.rating || 0).toFixed(1)} ★
          </span>
          <span style={{ color: "#aaa", fontSize: "12px" }}>
            {reviews.toLocaleString("en-IN")} ratings
          </span>
        </div>

        <div style={{ marginBottom: "8px" }}>
          <span style={priceStyle}>{formatPrice(product.price)}</span>
          {product.mrp && (
            <>
              <span style={mrpStyle}>{formatPrice(product.mrp)}</span>
              <span style={discountStyle}>{discount}% off</span>
            </>
          )}
        </div>

        <p style={deliveryStyle}>{product.delivery || "Fast delivery available"}</p>
        <p style={offerStyle}>{product.offer || "Limited time offer"}</p>
        <p style={reviewSnippetStyle}>
          "Top rated by verified buyers"
        </p>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => addToCart(product, sizes[0])}
            style={{
              flex: 1,
              background: "#facc15",
              color: "black",
              border: "none",
              padding: "10px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Add to Cart
          </button>

          <button
            onClick={() => toggleWishlist(product.id)}
            style={{
              background: isWishlisted(product.id) ? "#e53e3e" : "#2a2a2a",
              color: "white",
              border: "none",
              padding: "10px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            {isWishlisted(product.id) ? "♥" : "♡"}
          </button>
        </div>

        <button
          onClick={handleBuyNow}
          style={buyNowStyle}
        >
          🛒 Buy Now
        </button>
      </div>
    </div>
  );
}

const ratingPillStyle = {
  background: "#16a34a",
  color: "white",
  fontSize: "12px",
  fontWeight: "bold",
  padding: "3px 7px",
  borderRadius: "4px",
};

const priceStyle = {
  color: "white",
  fontSize: "20px",
  fontWeight: "bold",
  marginRight: "8px",
};

const mrpStyle = {
  color: "#8b8b8b",
  fontSize: "13px",
  textDecoration: "line-through",
  marginRight: "8px",
};

const discountStyle = {
  color: "#22c55e",
  fontSize: "13px",
  fontWeight: "bold",
};

const deliveryStyle = {
  color: "#e7e7e7",
  fontSize: "12px",
  margin: "0 0 4px",
};

const offerStyle = {
  color: "#22c55e",
  fontSize: "12px",
  margin: "0 0 6px",
  minHeight: "16px",
};

const reviewSnippetStyle = {
  color: "#cfcfcf",
  fontSize: "12px",
  margin: "0 0 12px",
  minHeight: "16px",
};

const buyNowStyle = {
  width: "100%",
  marginTop: "10px",
  padding: "10px",
  background: "#fb923c",
  color: "black",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
};
