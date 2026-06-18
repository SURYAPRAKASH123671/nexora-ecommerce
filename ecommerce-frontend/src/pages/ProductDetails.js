import React from "react";
import { useParams } from "react-router-dom";
import { PRODUCTS } from "../data/data";
import { useCart } from "../context/CartContext";

export default function ProductDetails() {
  const { id } = useParams();
  const product = PRODUCTS.find((p) => p.id === parseInt(id));
  const { addToCart, setCartOpen, formatPrice } = useCart();

  if (!product) {
    return (
      <div
        style={{
          background: "#0A0A0A",
          minHeight: "100vh",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
        }}
      >
        Product not found.
      </div>
    );
  }

  const sizes = product.sizes || ["One Size"];
  const reviews = product.customerReviews || getDefaultReviews(product);
  const discount = product.mrp
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const handleAddToCart = () => {
    addToCart(product, sizes[0]);
  };

  const handleBuyNow = () => {
    addToCart(product, sizes[0]);
    setCartOpen(true);
  };

  return (
    <div
      style={{
        background: "#0A0A0A",
        minHeight: "100vh",
        color: "white",
        padding: "32px 24px",
        maxWidth: "1280px",
        margin: "auto",
      }}
    >
      <div style={detailGridStyle}>
        <div style={imagePanelStyle}>
          <img
            src={product.image}
            alt={product.name}
            style={imageStyle}
          />
        </div>

        <div>
          <p style={brandStyle}>{product.brand}</p>
          <h1 style={titleStyle}>{product.name}</h1>

          <div style={ratingRowStyle}>
            <span style={ratingPillStyle}>{product.rating.toFixed(1)} ★</span>
            <span style={{ color: "#8ab4ff" }}>
              {product.reviews.toLocaleString("en-IN")} ratings
            </span>
          </div>

          <hr style={lineStyle} />

          <div style={{ marginBottom: "12px" }}>
            <span style={priceStyle}>{formatPrice(product.price)}</span>
            {product.mrp && (
              <>
                <span style={mrpStyle}>M.R.P: {formatPrice(product.mrp)}</span>
                <span style={discountStyle}>{discount}% off</span>
              </>
            )}
          </div>

          <p style={offerStyle}>{product.offer}</p>
          <p style={deliveryStyle}>{product.delivery}</p>

          <div style={infoGridStyle}>
            <span>7 days replacement</span>
            <span>Secure transaction</span>
            <span>Top brand</span>
            <span>Fast delivery</span>
          </div>

          <h3 style={sectionTitleStyle}>About this item</h3>
          <p style={descriptionStyle}>
            {product.description || "No description available."}
          </p>
        </div>

        <aside style={buyBoxStyle}>
          <p style={stockStyle}>In stock</p>
          <p style={{ color: "#ccc", margin: "0 0 16px" }}>
            Sold by Nexora Retail and fulfilled by Nexora.
          </p>
          <button onClick={handleAddToCart} style={addButtonStyle}>
            Add to Cart
          </button>
          <button onClick={handleBuyNow} style={buyButtonStyle}>
            🛒 Buy Now
          </button>
        </aside>
      </div>

      <section style={reviewsSectionStyle}>
        <h2 style={{ marginTop: 0 }}>Customer Reviews</h2>
        <div style={reviewSummaryStyle}>
          <span style={ratingPillStyle}>{product.rating.toFixed(1)} ★</span>
          <span>{product.reviews.toLocaleString("en-IN")} verified ratings</span>
        </div>

        <div style={reviewsGridStyle}>
          {reviews.map((review) => (
            <div key={review.name} style={reviewCardStyle}>
              <strong>{review.name}</strong>
              <p style={{ color: "#facc15", margin: "8px 0 6px" }}>
                {"★".repeat(review.rating)}
              </p>
              <p style={{ color: "#ddd", margin: 0, lineHeight: 1.5 }}>
                {review.comment}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const getDefaultReviews = (product) => [
  {
    name: "Verified Buyer",
    rating: 5,
    comment: `${product.name} feels worth the price. Packaging was neat and delivery was quick.`,
  },
  {
    name: "Nexora Customer",
    rating: 4,
    comment: "Good quality overall. The product matched the listing and worked well from day one.",
  },
  {
    name: "Recent Buyer",
    rating: 4,
    comment: "Nice deal for the price. Would recommend checking the size/specification before ordering.",
  },
];

const detailGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(280px, 420px) minmax(320px, 1fr) 280px",
  gap: "28px",
  alignItems: "start",
};

const imagePanelStyle = {
  background: "#f8fafc",
  border: "1px solid #2a2a2a",
  borderRadius: "8px",
  padding: "18px",
  position: "sticky",
  top: "24px",
};

const imageStyle = {
  width: "100%",
  height: "340px",
  objectFit: "contain",
  display: "block",
};

const brandStyle = {
  color: "#8ab4ff",
  margin: "0 0 8px",
  fontSize: "14px",
};

const titleStyle = {
  fontSize: "28px",
  lineHeight: 1.25,
  margin: "0 0 12px",
  fontWeight: 600,
};

const ratingRowStyle = {
  display: "flex",
  gap: "10px",
  alignItems: "center",
  marginBottom: "14px",
};

const ratingPillStyle = {
  background: "#16a34a",
  color: "white",
  fontWeight: "bold",
  padding: "4px 8px",
  borderRadius: "4px",
  fontSize: "13px",
};

const lineStyle = {
  border: 0,
  borderTop: "1px solid #2a2a2a",
  margin: "14px 0",
};

const priceStyle = {
  fontSize: "30px",
  fontWeight: "bold",
  marginRight: "10px",
};

const mrpStyle = {
  color: "#999",
  textDecoration: "line-through",
  marginRight: "10px",
};

const discountStyle = {
  color: "#22c55e",
  fontWeight: "bold",
};

const offerStyle = {
  color: "#22c55e",
  margin: "8px 0",
  fontWeight: "bold",
};

const deliveryStyle = {
  color: "#ddd",
  margin: "0 0 16px",
};

const infoGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "10px",
  color: "#d7d7d7",
  fontSize: "13px",
  margin: "16px 0",
};

const sectionTitleStyle = {
  margin: "22px 0 8px",
};

const descriptionStyle = {
  color: "#ccc",
  lineHeight: 1.7,
  margin: 0,
};

const buyBoxStyle = {
  border: "1px solid #333",
  borderRadius: "8px",
  padding: "18px",
  background: "#141414",
  position: "sticky",
  top: "24px",
};

const stockStyle = {
  color: "#22c55e",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 8px",
};

const addButtonStyle = {
  width: "100%",
  padding: "12px",
  background: "#facc15",
  color: "black",
  border: "none",
  borderRadius: "999px",
  cursor: "pointer",
  fontWeight: "bold",
  marginBottom: "10px",
};

const buyButtonStyle = {
  width: "100%",
  padding: "12px",
  background: "#fb923c",
  color: "black",
  border: "none",
  borderRadius: "999px",
  cursor: "pointer",
  fontWeight: "bold",
};

const reviewsSectionStyle = {
  borderTop: "1px solid #2a2a2a",
  marginTop: "34px",
  paddingTop: "24px",
};

const reviewSummaryStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "16px",
};

const reviewsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "14px",
};

const reviewCardStyle = {
  background: "#151515",
  border: "1px solid #2a2a2a",
  borderRadius: "8px",
  padding: "14px",
};
