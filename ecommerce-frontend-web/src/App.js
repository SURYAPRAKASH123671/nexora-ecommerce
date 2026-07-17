import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import { CartProvider } from "./context/CartContext";

import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import ProductsPage from "./pages/ProductsPage";
import ProductDetails from "./pages/ProductDetails";
import OrderHistory from "./pages/OrderHistory";
import OrderDetails from "./pages/OrderDetails";
import AdminDashboard from "./pages/AdminDashboard";

import Cart from "./components/Cart";
import CreatorCredit from "./components/CreatorCredit";

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/products" element={<ProductsPage />} />

          <Route path="/login" element={<Login />} />

          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/profile" element={<Profile />} />

          <Route path="/product/:id" element={<ProductDetails />} />

          <Route path="/orders" element={<OrderHistory />} />

          <Route path="/orders/:orderNumber" element={<OrderDetails />} />

          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>

        <Cart />
        <CreatorCredit />
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
