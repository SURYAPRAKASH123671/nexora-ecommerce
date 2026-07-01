import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const token = searchParams.get("token") || "";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!token) {
      setError("Reset token is missing. Please use the link from your email.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await API.post("/auth/reset-password", {
        token,
        password,
      });
      setNotice(response.data?.message || "Password reset successfully.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    marginTop: "16px",
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "8px",
    color: "white",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0A0A",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "400px",
          maxWidth: "100%",
          background: "#141414",
          padding: "38px",
          borderRadius: "10px",
          border: "1px solid #222",
          boxSizing: "border-box",
        }}
      >
        <h1 style={{ color: "#4f83ff", marginBottom: "8px", fontSize: "30px" }}>
          Nexora
        </h1>
        <p style={{ color: "#aaa", marginBottom: "26px", fontSize: "14px" }}>
          Create a new secure password
        </p>

        <input
          type="password"
          placeholder="New password with letters and numbers"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          style={inputStyle}
          autoComplete="new-password"
          required
        />

        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          style={inputStyle}
          autoComplete="new-password"
          required
        />

        {notice && (
          <p style={{ color: "#4ade80", fontSize: "13px", marginTop: "14px", lineHeight: 1.5 }}>
            {notice}
          </p>
        )}

        {error && (
          <p style={{ color: "#f87171", fontSize: "13px", marginTop: "14px", lineHeight: 1.5 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            marginTop: "20px",
            background: loading ? "#64748b" : "#2563eb",
            border: "none",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "15px",
            color: "white",
          }}
        >
          {loading ? "Resetting..." : "Reset password"}
        </button>

        <p style={{ textAlign: "center", marginTop: "20px", color: "#aaa", fontSize: "13px" }}>
          <Link to="/login" style={{ color: "#93c5fd", textDecoration: "none" }}>
            Back to login
          </Link>
        </p>
      </form>
    </div>
  );
}
