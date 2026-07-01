import React from "react";
import { useParams } from "react-router-dom";
import { PRODUCTS } from "../data/data";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import {
  getFrequentlyBoughtTogether,
  getRecommendations,
  getRecentlyViewedProducts,
  getSimilarProducts,
  trackProductSignal,
} from "../utils/personalization";

export default function ProductDetails() {
  const { id } = useParams();
  const product = PRODUCTS.find((p) => p.id === parseInt(id));
  const { addToCart, setCartOpen, formatPrice } = useCart();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    if (product) {
      trackProductSignal(product, "view");
    }
  }, [product]);

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
  const youMayLike = getRecommendations(PRODUCTS, product, 4);
  const similarProducts = getSimilarProducts(PRODUCTS, product, 4);
  const bundleProducts = getFrequentlyBoughtTogether(PRODUCTS, product, 3);
  const recentlyViewed = getRecentlyViewedProducts(PRODUCTS, 4).filter((item) => item.id !== product.id);
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

  const handleImageError = (event) => {
    if (product.fallbackImage && event.currentTarget.src !== product.fallbackImage) {
      event.currentTarget.src = product.fallbackImage;
    }
  };

  return (
    <div
      style={{
        background: "#0A0A0A",
        minHeight: "100vh",
        color: "white",
        padding: isMobile ? "18px 14px 84px" : "32px 24px",
        maxWidth: "1280px",
        margin: "auto",
      }}
    >
      <div
        style={{
          ...detailGridStyle,
          gridTemplateColumns: isMobile
            ? "1fr"
            : "minmax(280px, 420px) minmax(320px, 1fr) 280px",
          gap: isMobile ? "18px" : "28px",
        }}
      >
        <div
          style={{
            ...imagePanelStyle,
            position: isMobile ? "relative" : "sticky",
            top: isMobile ? "auto" : "24px",
            padding: isMobile ? "10px" : "18px",
          }}
        >
          <img
            src={product.image}
            alt={product.name}
            onError={handleImageError}
            style={{
              ...imageStyle,
              height: isMobile ? "240px" : "340px",
            }}
          />
        </div>

        <div>
          <p style={brandStyle}>{product.brand}</p>
          <h1 style={{ ...titleStyle, fontSize: isMobile ? "24px" : "28px" }}>
            {product.name}
          </h1>

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

          <div
            style={{
              ...infoGridStyle,
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
            }}
          >
            <span>7 days replacement</span>
            <span>Secure transaction</span>
            <span>Top brand</span>
            <span>Fast delivery</span>
          </div>

          <h3 style={sectionTitleStyle}>About this item</h3>
          <p style={descriptionStyle}>
            {product.description || "No description available."}
          </p>

          <h3 style={sectionTitleStyle}>Key specifications</h3>
          <ul style={specListStyle}>
            {(product.specs || []).map((spec) => (
              <li key={spec}>{spec}</li>
            ))}
          </ul>
        </div>

        <aside
          style={{
            ...buyBoxStyle,
            position: isMobile ? "relative" : "sticky",
            top: isMobile ? "auto" : "24px",
          }}
        >
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

      <section style={{ ...reviewsSectionStyle, marginTop: isMobile ? "24px" : "34px" }}>
        <RecommendationRail title="You may also like" products={youMayLike} />
        <RecommendationRail
          title={product.category === "automotive" ? "Similar performance cars" : "Similar picks"}
          products={similarProducts}
        />
        <RecommendationRail title="Frequently bought together" products={bundleProducts} />
        <RecommendationRail title="Recently viewed" products={recentlyViewed} />

        <h2 style={{ marginTop: 0 }}>Customer Reviews</h2>
        <div style={reviewSummaryStyle}>
          <span style={ratingPillStyle}>{product.rating.toFixed(1)} ★</span>
          <span>{product.reviews.toLocaleString("en-IN")} verified ratings</span>
        </div>

        <div style={reviewsGridStyle}>
          {reviews.map((review) => (
            <div key={`${review.name}-${review.title || review.comment}`} style={reviewCardStyle}>
              <div style={reviewHeaderStyle}>
                <strong>{review.name}</strong>
                {review.location && <span>{review.location}</span>}
              </div>
              {review.title && <h3 style={reviewTitleStyle}>{review.title}</h3>}
              <p style={{ color: "#facc15", margin: "8px 0 6px" }}>
                {"★".repeat(review.rating)}
              </p>
              {review.date && <p style={reviewMetaStyle}>{review.date}</p>}
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

function RecommendationRail({ title, products }) {
  if (!products.length) return null;

  return (
    <div style={{ marginBottom: "28px" }}>
      <h2 style={{ margin: "0 0 14px", color: "#f8fafc", fontSize: "22px" }}>
        {title}
      </h2>
      <div style={recommendationGridStyle}>
        {products.map((item) => (
          <ProductCard key={`${title}-${item.id}`} product={item} />
        ))}
      </div>
    </div>
  );
}

const getDefaultReviews = (product) => [
  {
    name: "Verified Buyer",
    location: "Chennai",
    date: "Verified purchase",
    rating: 5,
    title: "Worth the price",
    comment: `${product.name} feels worth the price. Packaging was neat, delivery was quick, and the listing details matched what arrived.`,
  },
  {
    name: "Nexora Customer",
    location: "Bengaluru",
    date: "Reviewed after 2 weeks",
    rating: 4,
    title: "Good quality overall",
    comment: "The product matched the listing and worked well from day one. I would still suggest checking the exact variant before ordering.",
  },
  {
    name: "Recent Buyer",
    location: "Hyderabad",
    date: "Recent buyer",
    rating: 4,
    title: "Nice offer deal",
    comment: "Nice deal for the price. Delivery updates were clear and the product looked close to the photos shown on the site.",
  },
];

const detailGridStyle = {
  display: "grid",
  alignItems: "start",
};

const imagePanelStyle = {
  background: "#f8fafc",
  border: "1px solid #2a2a2a",
  borderRadius: "8px",
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

const specListStyle = {
  color: "#d7d7d7",
  lineHeight: 1.7,
  margin: "0 0 4px",
  paddingLeft: "20px",
};

const buyBoxStyle = {
  border: "1px solid #333",
  borderRadius: "8px",
  padding: "18px",
  background: "#141414",
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

const recommendationGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
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

const reviewHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  color: "#f8fafc",
  fontSize: "14px",
};

const reviewTitleStyle = {
  color: "white",
  fontSize: "16px",
  margin: "10px 0 0",
};

const reviewMetaStyle = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "0 0 8px",
};
