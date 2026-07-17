import React from "react";

export default function CreatorCredit() {
  return (
    <div
      aria-label="Nexora creator"
      style={{
        position: "fixed",
        right: "14px",
        bottom: "14px",
        zIndex: 200,
        padding: "9px 13px",
        borderRadius: "999px",
        border: "1px solid rgba(148, 163, 184, 0.28)",
        background: "rgba(11, 17, 32, 0.92)",
        color: "#e2e8f0",
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.28)",
        backdropFilter: "blur(12px)",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        fontSize: "12px",
        letterSpacing: "0.01em",
      }}
    >
      Designed &amp; developed by <strong>Surya Prakash K S</strong>
    </div>
  );
}
