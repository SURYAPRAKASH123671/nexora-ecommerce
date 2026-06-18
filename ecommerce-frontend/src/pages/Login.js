import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    const url = isRegister
      ? "http://localhost:8080/api/auth/register"
      : "http://localhost:8080/api/auth/login";

    const body = isRegister
      ? { name, email, password }
      : { email, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
        setLoading(false);
        return;
      }

      // Save token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({ name: data.name, email: data.email }));

      navigate("/");
    } catch (err) {
      setError("Cannot connect to server. Make sure backend is running.");
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
    <div style={{
      minHeight: "100vh",
      background: "#0A0A0A",
      color: "white",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}>
      <div style={{
        width: "380px",
        background: "#141414",
        padding: "40px",
        borderRadius: "12px",
        border: "1px solid #222",
      }}>

        {/* Logo */}
        <h1 style={{ color: "#C9A84C", marginBottom: "8px", fontSize: "28px" }}>
          Nexora 🚀
        </h1>
        <p style={{ color: "#aaa", marginBottom: "28px", fontSize: "14px" }}>
          {isRegister ? "Create your account" : "Welcome back"}
        </p>

        {/* Name field (register only) */}
        {isRegister && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        {/* Error message */}
        {error && (
          <p style={{ color: "#e53e3e", fontSize: "13px", marginTop: "12px" }}>
            {error}
          </p>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            marginTop: "20px",
            background: loading ? "#888" : "#C9A84C",
            border: "none",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "15px",
            color: "black",
          }}
        >
          {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
        </button>

        {/* Toggle */}
        <p style={{ textAlign: "center", marginTop: "20px", color: "#aaa", fontSize: "13px" }}>
          {isRegister ? "Already have an account?" : "Don't have an account?"}
          <span
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
            style={{ color: "#C9A84C", cursor: "pointer", marginLeft: "6px" }}
          >
            {isRegister ? "Login" : "Register"}
          </span>
        </p>

      </div>
    </div>
  );
}
