import React from "react";
import {
  PAYMENT_METHODS,
  useCart,
  formatPrice,
} from "../context/CartContext";
import API from "../api/api";

export default function Cart() {
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
    placeOrder,
  } = useCart();

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

  const buildOrderEmail = (deliveryAddress) => {
    const itemRows = cartItems
      .map(
        (item) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #eee;">${item.name} x${item.qty}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatPrice(item.price * item.qty)}</td>
          </tr>
        `
      )
      .join("");

    const paymentLabel =
      PAYMENT_METHODS.find((method) => method.id === paymentMethod)?.label ||
      "Cash on Delivery";

    return `
      <div style="font-family:Arial,sans-serif;color:#111;line-height:1.5;">
        <h2 style="color:#0b1120;">Thanks for your order, ${deliveryAddress.fullName}!</h2>
        <p>Your Nexora order has been placed successfully.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          ${itemRows}
          <tr>
            <td style="padding:8px;font-weight:bold;">Subtotal</td>
            <td style="padding:8px;text-align:right;">${formatPrice(subtotal)}</td>
          </tr>
          <tr>
            <td style="padding:8px;font-weight:bold;">GST</td>
            <td style="padding:8px;text-align:right;">${formatPrice(gst)}</td>
          </tr>
          <tr>
            <td style="padding:8px;font-weight:bold;">Shipping</td>
            <td style="padding:8px;text-align:right;">${shipping === 0 ? "FREE" : formatPrice(shipping)}</td>
          </tr>
          <tr>
            <td style="padding:8px;font-size:18px;font-weight:bold;">Total</td>
            <td style="padding:8px;text-align:right;font-size:18px;font-weight:bold;">${formatPrice(total)}</td>
          </tr>
        </table>
        <p><strong>Payment:</strong> ${paymentLabel}</p>
        <p><strong>Delivery address:</strong><br />
          ${deliveryAddress.line1}${deliveryAddress.line2 ? ", " + deliveryAddress.line2 : ""}<br />
          ${deliveryAddress.city}, ${deliveryAddress.state} - ${deliveryAddress.pincode}<br />
          Mobile: ${deliveryAddress.phone}
        </p>
        <p style="color:#555;">We will notify you when your order is shipped.</p>
      </div>
    `;
  };

  const sendCustomerEmail = async (deliveryAddress) => {
    const response = await API.post("/email/send", {
      toEmail: deliveryAddress.email,
      subject: "Nexora order confirmation",
      body: buildOrderEmail(deliveryAddress),
      html: true,
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Email send failed");
    }

    return response.data;
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

    placeOrder(paymentMethod, deliveryAddress);

    try {
      await sendCustomerEmail(deliveryAddress);
      alert("Order placed successfully! Confirmation email sent.");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Email could not be sent.";

      alert(`Order placed successfully! ${message}`);
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
      width: "400px",
      height: "100vh",
      background: "#111",
      color: "white",
      zIndex: 2000,
      padding: "20px",
      overflowY: "auto",
      boxSizing: "border-box",
    }}>
      <button onClick={() => setCartOpen(false)}>Close</button>
      <h2>Shopping Bag</h2>

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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
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
