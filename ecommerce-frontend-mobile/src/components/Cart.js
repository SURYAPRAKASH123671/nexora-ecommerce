import React from "react";
import { useNavigate } from "react-router-dom";
import {
  PAYMENT_METHODS,
  useCart,
  formatPrice,
  getPaymentMethod,
} from "../context/CartContext";
import API from "../api/api";
import { PRODUCTS } from "../data/data";
import { trackOrderItems } from "../utils/personalization";

export default function Cart() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 640);
  const [paymentMethod, setPaymentMethod] = React.useState("cod");
  const [address, setAddress] = React.useState({
    fullName: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [addressError, setAddressError] = React.useState("");

  const {
    cartOpen,
    setCartOpen,
    cartItems,
    subtotal,
    shipping,
    shippingFree,
    gst,
    total,
    removeFromCart,
    changeQty,
    clearCart,
  } = useCart();

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!cartOpen) return null;

  const handleAddressChange = (event) => {
    const { name, value } = event.target;

    setAddress((current) => ({
      ...current,
      [name]: value,
    }));
    setAddressError("");
  };

  const validateAddress = () => {
    const requiredFields = [
      "fullName",
      "email",
      "phone",
      "line1",
      "city",
      "state",
      "pincode",
    ];

    const missingField = requiredFields.find(
      (field) => !address[field].trim()
    );

    if (missingField) {
      setAddressError("Please complete the delivery address.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email.trim())) {
      setAddressError("Enter a valid email address.");
      return false;
    }

    if (!/^[6-9]\d{9}$/.test(address.phone.trim())) {
      setAddressError("Enter a valid 10-digit mobile number.");
      return false;
    }

    if (!/^\d{6}$/.test(address.pincode.trim())) {
      setAddressError("Enter a valid 6-digit pincode.");
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateAddress()) return;

    const deliveryAddress = {
      fullName: address.fullName.trim(),
      email: address.email.trim(),
      phone: address.phone.trim(),
      line1: address.line1.trim(),
      line2: address.line2.trim(),
      city: address.city.trim(),
      state: address.state.trim(),
      pincode: address.pincode.trim(),
    };

    const method = getPaymentMethod(paymentMethod);
    const payload = {
      paymentMethod: method.label,
      paymentStatus: method.id === "cod" ? "Pay on delivery" : "Payment pending",
      deliveryAddress,
      items: cartItems.map((item) => ({
        productId: Number.isFinite(Number(item.id)) ? Number(item.id) : null,
        productName: item.name,
        brand: item.brand || "",
        variant: item.selectedSize ? `Size: ${item.selectedSize}` : "",
        imageUrl: resolveOrderImageUrl(item),
        quantity: item.qty,
        unitPrice: item.price,
      })),
      subtotal,
      gst,
      shipping,
      total,
    };

    try {
      const response = await API.post("/orders", payload);
      trackOrderItems(cartItems);
      clearCart();
      alert(orderSuccessMessage(response.data));
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert("Please login before placing your order.");
        navigate("/login");
        return;
      }
      alert(error.response?.data?.message || "Order could not be placed. Please try again.");
      return;
    }

    setCartOpen(false);
    setAddress({
      fullName: "",
      email: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
    });
  };

  return (
    <div style={{
      position: "fixed",
      right: 0,
      top: 0,
      width: isMobile ? "100vw" : "400px",
      height: "100vh",
      background: "#111",
      color: "white",
      zIndex: 2000,
      padding: isMobile ? "16px" : "20px",
      overflowY: "auto",
      boxSizing: "border-box",
    }}>
      <button onClick={() => setCartOpen(false)} style={closeButtonStyle}>Close</button>
      <h2 style={{ marginTop: "14px" }}>Shopping Bag</h2>

      {cartItems.length === 0 && (
        <p style={{ color: "#888", marginTop: "20px" }}>Your bag is empty.</p>
      )}

      {cartItems.map((item) => (
        <div key={item.cartKey} style={{
          marginTop: "20px",
          borderBottom: "1px solid #333",
          paddingBottom: "10px",
        }}>
          <h3 style={{ margin: "0 0 5px" }}>{item.name}</h3>
          <p style={{ margin: "0 0 8px", color: "#aaa" }}>{formatPrice(item.price)}</p>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <button
              onClick={() => changeQty(item.cartKey, -1)}
              style={qtyBtnStyle}
            >
              -
            </button>
            <span>{item.qty}</span>
            <button
              onClick={() => changeQty(item.cartKey, 1)}
              style={qtyBtnStyle}
            >
              +
            </button>
          </div>

          <p style={{ margin: "0 0 8px", fontWeight: "bold" }}>
            Line total: {formatPrice(item.price * item.qty)}
          </p>

          <button onClick={() => removeFromCart(item.cartKey)} style={removeBtnStyle}>
            Remove
          </button>
        </div>
      ))}

      {cartItems.length > 0 && (
        <div style={{ marginTop: "30px", borderTop: "1px solid #333", paddingTop: "15px" }}>
          <div style={summaryRowStyle}>
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div style={summaryRowStyle}>
            <span>GST (18%)</span>
            <span>{formatPrice(gst)}</span>
          </div>
          <div style={summaryRowStyle}>
            <span>Shipping</span>
            <span>{shippingFree ? "FREE" : formatPrice(shipping)}</span>
          </div>

          <h2 style={{ marginTop: "15px", display: "flex", justifyContent: "space-between" }}>
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </h2>

          <div style={addressSectionStyle}>
            <h3 style={{ margin: "0 0 12px", fontSize: "16px" }}>
              Delivery Address
            </h3>

            <input
              name="fullName"
              placeholder="Full name"
              value={address.fullName}
              onChange={handleAddressChange}
              style={inputStyle}
            />
            <input
              name="email"
              placeholder="Email address"
              value={address.email}
              onChange={handleAddressChange}
              style={inputStyle}
            />
            <input
              name="phone"
              placeholder="Mobile number"
              value={address.phone}
              onChange={handleAddressChange}
              style={inputStyle}
              maxLength={10}
            />
            <input
              name="line1"
              placeholder="House / flat / street"
              value={address.line1}
              onChange={handleAddressChange}
              style={inputStyle}
            />
            <input
              name="line2"
              placeholder="Landmark (optional)"
              value={address.line2}
              onChange={handleAddressChange}
              style={inputStyle}
            />

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "10px" }}>
              <input
                name="city"
                placeholder="City"
                value={address.city}
                onChange={handleAddressChange}
                style={inputStyle}
              />
              <input
                name="state"
                placeholder="State"
                value={address.state}
                onChange={handleAddressChange}
                style={inputStyle}
              />
            </div>

            <input
              name="pincode"
              placeholder="Pincode"
              value={address.pincode}
              onChange={handleAddressChange}
              style={inputStyle}
              maxLength={6}
            />

            {addressError && (
              <p style={errorStyle}>{addressError}</p>
            )}
          </div>

          <div style={paymentSectionStyle}>
            <h3 style={{ margin: "0 0 12px", fontSize: "16px" }}>
              Payment Method
            </h3>

            {PAYMENT_METHODS.map((method) => {
              const selected = paymentMethod === method.id;

              return (
                <label
                  key={method.id}
                  style={{
                    ...paymentOptionStyle,
                    borderColor: selected ? "#C9A84C" : "#333",
                    background: selected ? "#211f15" : "#151515",
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={selected}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    style={{ accentColor: "#C9A84C" }}
                  />
                  <span>
                    <strong>{method.label}</strong>
                    <small style={paymentDescriptionStyle}>
                      {method.description}
                    </small>
                  </span>
                </label>
              );
            })}
          </div>

          <button onClick={handlePlaceOrder} style={placeOrderBtnStyle}>
            Place Order
          </button>
        </div>
      )}
    </div>
  );
}

const resolveOrderImageUrl = (item) => {
  if (item.image || item.imageUrl) {
    return item.image || item.imageUrl;
  }

  const catalogProduct = PRODUCTS.find(
    (product) => String(product.id) === String(item.id)
  );

  return catalogProduct?.image || catalogProduct?.imageUrl || "";
};

const orderSuccessMessage = (order) => {
  if (order.confirmationEmailStatus === "SENT") {
    return `Order ${order.orderNumber} placed successfully! Confirmation email sent.`;
  }

  if (order.confirmationEmailStatus === "FAILED") {
    return `Order ${order.orderNumber} placed successfully, but confirmation email could not be sent. Check SMTP settings.`;
  }

  if (order.confirmationEmailStatus === "SKIPPED") {
    return `Order ${order.orderNumber} placed successfully. Email sending is disabled in this environment.`;
  }

  return `Order ${order.orderNumber} placed successfully.`;
};

const qtyBtnStyle = {
  width: "30px",
  height: "30px",
  background: "#222",
  color: "white",
  border: "1px solid #444",
  cursor: "pointer",
  fontSize: "16px",
  borderRadius: "4px",
};

const closeButtonStyle = {
  background: "#1f2937",
  border: "1px solid #334155",
  color: "white",
  borderRadius: "8px",
  padding: "9px 12px",
  cursor: "pointer",
};

const removeBtnStyle = {
  background: "none",
  border: "1px solid #555",
  color: "#ccc",
  padding: "5px 12px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "13px",
};

const summaryRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "8px",
  color: "#ccc",
};

const addressSectionStyle = {
  marginTop: "22px",
  borderTop: "1px solid #333",
  paddingTop: "16px",
};

const inputStyle = {
  width: "100%",
  padding: "11px",
  marginBottom: "10px",
  background: "#151515",
  border: "1px solid #333",
  borderRadius: "8px",
  color: "white",
  boxSizing: "border-box",
  outline: "none",
};

const errorStyle = {
  color: "#f87171",
  fontSize: "13px",
  margin: "2px 0 0",
};

const paymentSectionStyle = {
  marginTop: "22px",
  borderTop: "1px solid #333",
  paddingTop: "16px",
};

const paymentOptionStyle = {
  display: "flex",
  gap: "10px",
  alignItems: "flex-start",
  border: "1px solid #333",
  borderRadius: "8px",
  padding: "10px",
  marginBottom: "10px",
  cursor: "pointer",
};

const paymentDescriptionStyle = {
  display: "block",
  color: "#aaa",
  fontSize: "12px",
  marginTop: "3px",
  lineHeight: 1.35,
};

const placeOrderBtnStyle = {
  width: "100%",
  marginTop: "20px",
  padding: "14px",
  background: "#C9A84C",
  color: "black",
  fontWeight: "bold",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "16px",
};
