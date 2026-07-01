import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/api";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotMode, setForgotMode] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setNotice("Email verified successfully. Login to continue shopping.");
    }
  }, [searchParams]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      if (forgotMode) {
        const response = await API.post("/auth/forgot-password", { email });
        setNotice(response.data?.message || "If an account exists, a reset link has been sent.");
        setPassword("");
        return;
      }

      if (isRegister) {
        const response = await API.post("/auth/signup", {
          name,
          email,
          password,
        });

        if (response.data?.token) {
          persistSession(response.data);
          navigate(destinationFor(response.data.user));
          return;
        }

        setNotice(response.data?.message || "Account created. Check your email to verify your account.");
        setIsRegister(false);
        setPassword("");
        return;
      }

      const response = await API.post("/auth/login", {
        email,
        password,
        rememberMe,
      });

      persistSession(response.data);
      navigate(destinationFor(response.data.user));
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Cannot connect to server. Make sure backend is running.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setError("Enter your email first, then resend verification.");
      return;
    }

    setError("");
    setNotice("");
    setResending(true);

    try {
      const response = await API.post("/auth/resend-verification", { email });
      setNotice(response.data?.message || "Verification email sent.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend verification email.");
    } finally {
      setResending(false);
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
          {forgotMode ? "Reset access" : isRegister ? "Create your account" : "Welcome back"}
        </p>

        {isRegister && !forgotMode && (
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            style={inputStyle}
            autoComplete="name"
            required
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          style={inputStyle}
          autoComplete="email"
          required
        />

        {!forgotMode && (
          <input
            type="password"
            placeholder={isRegister ? "Password with letters and numbers" : "Password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={inputStyle}
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
          />
        )}

        {!isRegister && !forgotMode && (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#cbd5e1",
              fontSize: "13px",
              marginTop: "14px",
            }}
          >
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            Remember me
          </label>
        )}

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
          {loading ? "Please wait..." : forgotMode ? "Send reset link" : isRegister ? "Create account" : "Login"}
        </button>

        {!isRegister && !forgotMode && (
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resending}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "12px",
              background: "transparent",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#cbd5e1",
              cursor: resending ? "not-allowed" : "pointer",
            }}
          >
            {resending ? "Sending..." : "Resend verification email"}
          </button>
        )}

        {!isRegister && !forgotMode && (
          <button
            type="button"
            onClick={() => {
              setForgotMode(true);
              setError("");
              setNotice("");
              setPassword("");
            }}
            style={{
              width: "100%",
              marginTop: "12px",
              background: "none",
              border: "none",
              color: "#93c5fd",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Forgot password?
          </button>
        )}

        <p style={{ textAlign: "center", marginTop: "20px", color: "#aaa", fontSize: "13px" }}>
          {forgotMode ? "Remember your password?" : isRegister ? "Already have an account?" : "Don't have an account?"}
          <button
            type="button"
            onClick={() => {
              if (forgotMode) {
                setForgotMode(false);
                setIsRegister(false);
              } else {
                setIsRegister(!isRegister);
              }
              setError("");
              setNotice("");
            }}
            style={{
              color: "#4f83ff",
              cursor: "pointer",
              marginLeft: "6px",
              background: "none",
              border: "none",
              padding: 0,
              font: "inherit",
            }}
          >
            {forgotMode ? "Login" : isRegister ? "Login" : "Sign up"}
          </button>
        </p>
      </form>
    </div>
  );
}

function persistSession(data) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
}

function destinationFor(user) {
  return user?.role === "ROLE_ADMIN" ? "/admin" : "/";
}
