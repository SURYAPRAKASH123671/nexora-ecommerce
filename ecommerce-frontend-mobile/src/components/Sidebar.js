import React, { useState, useEffect } from "react";
import { CATEGORIES } from "../data/data";

export default function Sidebar({ activeFilter, onFilter }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isMobile) {
    // Amazon-style horizontal scrollable category chips
    return (
      <div
        style={{
          display: "flex",
          gap: "10px",
          overflowX: "auto",
          paddingBottom: "10px",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onFilter(cat.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexShrink: 0,
              background: activeFilter === cat.key ? "#facc15" : "#111",
              color: activeFilter === cat.key ? "black" : "white",
              border: "1px solid #333",
              borderRadius: "20px",
              padding: "8px 16px",
              cursor: "pointer",
              fontWeight: activeFilter === cat.key ? "bold" : "normal",
              fontSize: "13px",
              whiteSpace: "nowrap",
            }}
          >
            <span>{cat.icon} {cat.label}</span>
            <span style={{ opacity: 0.7 }}>({cat.count})</span>
          </button>
        ))}
      </div>
    );
  }

  // Desktop: original vertical sidebar
  return (
    <div style={{ width: "240px", color: "white" }}>
      <h3 style={{ color: "#facc15", marginTop: 0 }}>Shop by Category</h3>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onFilter(cat.key)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            marginTop: "10px",
            background: activeFilter === cat.key ? "#facc15" : "#111",
            color: activeFilter === cat.key ? "black" : "white",
            border: "1px solid #333",
            borderRadius: "6px",
            padding: "11px 12px",
            width: "100%",
            cursor: "pointer",
            fontWeight: activeFilter === cat.key ? "bold" : "normal",
          }}
        >
          <span>{cat.icon} {cat.label}</span>
          <span style={{ opacity: 0.8 }}>{cat.count}</span>
        </button>
      ))}
    </div>
  );
}