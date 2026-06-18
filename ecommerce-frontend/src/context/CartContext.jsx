import React, {
  createContext,
  useContext,
  useReducer,
  useState,
} from "react";

const CartContext = createContext();

export const formatPrice = (amount) => {
  if (amount >= 100000) {
    const lakhs = amount / 100000;

    return (
      "₹" +
      (Number.isInteger(lakhs)
        ? lakhs
        : lakhs.toFixed(1)) +
      "L"
    );
  }

  return "₹" + amount.toLocaleString("en-IN");
};

const GST_RATE = 0.18;

const SHIPPING_CHARGE = 299;

const FREE_SHIPPING_THRESHOLD = 4999;

export const PAYMENT_METHODS = [
  {
    id: "cod",
    label: "Cash on Delivery",
    description: "Pay when your order arrives",
  },
  {
    id: "upi",
    label: "UPI",
    description: "Use PhonePe, GPay, Paytm, or any UPI app",
  },
  {
    id: "card",
    label: "Credit / Debit Card",
    description: "Visa, Mastercard, RuPay, and more",
  },
  {
    id: "netbanking",
    label: "Net Banking",
    description: "Pay directly from your bank account",
  },
  {
    id: "wallet",
    label: "Wallet",
    description: "Use supported digital wallets",
  },
];

export const getPaymentMethod = (paymentMethodId) =>
  PAYMENT_METHODS.find((method) => method.id === paymentMethodId) ||
  PAYMENT_METHODS[0];

const cartReducer = (state, action) => {
  switch (action.type) {

    case "ADD_ITEM": {

      const key =
        `${action.product.id}-${action.size}`;

      const existing = state[key];

      return {
        ...state,

        [key]: existing
          ? {
              ...existing,
              qty: existing.qty + 1,
            }

          : {
              ...action.product,
              qty: 1,
              selectedSize: action.size,
              cartKey: key,
            },
      };
    }

    case "REMOVE_ITEM": {

      const updated = { ...state };

      delete updated[action.cartKey];

      return updated;
    }

    case "CHANGE_QTY": {

      const item = state[action.cartKey];

      if (!item) return state;

      const newQty =
        item.qty + action.delta;

      if (newQty <= 0) {

        const updated = { ...state };

        delete updated[action.cartKey];

        return updated;
      }

      return {
        ...state,

        [action.cartKey]: {
          ...item,
          qty: newQty,
        },
      };
    }

    case "CLEAR_CART":
      return {};

    default:
      return state;
  }
};

const ordersReducer = (state, action) => {
  switch (action.type) {

    case "ADD_ORDER":
      return [action.order, ...state];

    default:
      return state;
  }
};

export const CartProvider = ({
  children,
}) => {

  const [cart, dispatch] =
    useReducer(cartReducer, {});

  const [orders, dispatchOrders] =
    useReducer(ordersReducer, []);

  const [wishlist, setWishlist] =
    useState(new Set());

  const [cartOpen, setCartOpen] =
    useState(false);

  const addToCart = (
    product,
    size
  ) => {

    dispatch({
      type: "ADD_ITEM",
      product,
      size:
        size || product.sizes[0],
    });
  };

  const removeFromCart = (
    cartKey
  ) => {

    dispatch({
      type: "REMOVE_ITEM",
      cartKey,
    });
  };

  const changeQty = (
    cartKey,
    delta
  ) => {

    dispatch({
      type: "CHANGE_QTY",
      cartKey,
      delta,
    });
  };

  const clearCart = () => {

    dispatch({
      type: "CLEAR_CART",
    });
  };

  const toggleWishlist = (id) => {

    setWishlist((prev) => {

      const updated = new Set(prev);

      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }

      return updated;
    });
  };

  const isWishlisted = (id) =>
    wishlist.has(id);

  const cartItems =
    Object.values(cart);

  const cartCount =
    cartItems.reduce(
      (sum, item) =>
        sum + item.qty,
      0
    );

  const subtotal =
    cartItems.reduce(
      (sum, item) =>
        sum +
        item.price * item.qty,
      0
    );

  const shippingFree =
    subtotal >=
    FREE_SHIPPING_THRESHOLD;

  const shipping =
    shippingFree
      ? 0
      : SHIPPING_CHARGE;

  const gst = Math.round(
    subtotal * GST_RATE
  );

  const total =
    subtotal + shipping + gst;

  const placeOrder = (
    paymentMethodId,
    deliveryAddress
  ) => {

    if (cartItems.length === 0) return;

    const paymentMethod =
      getPaymentMethod(paymentMethodId);

    const order = {
      id: Date.now(),
      date: new Date().toLocaleString("en-IN"),
      items: cartItems,
      deliveryAddress,
      paymentMethod,
      paymentStatus:
        paymentMethod.id === "cod"
          ? "Pay on delivery"
          : "Payment pending",
      subtotal,
      gst,
      shipping,
      total,
    };

    dispatchOrders({
      type: "ADD_ORDER",
      order,
    });

    clearCart();
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItems,
        cartCount,
        subtotal,
        shipping,
        shippingFree,
        gst,
        total,
        cartOpen,
        setCartOpen,
        addToCart,
        removeFromCart,
        changeQty,
        clearCart,
        wishlist,
        toggleWishlist,
        isWishlisted,
        formatPrice,
        orders,
        placeOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  return useContext(CartContext);
};

export default CartContext;
