import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext.tsx";
import { CartProvider } from "@/contexts/CartContext.tsx";
import { Header } from "@/components/Header.tsx";
import { CartSidebar } from "@/components/CartSidebar.tsx";
import { ProtectedRoute } from "@/components/ProtectedRoute.tsx";
import { Home } from "@/pages/Home.tsx";
import { Categories } from "@/pages/Categories.tsx";
import { Product } from "@/pages/Product.tsx";
import { Login } from "@/pages/Login.tsx";
import { Checkout } from "@/pages/Checkout.tsx";
import { OrderSuccess } from "@/pages/OrderSuccess.tsx";

function AppLayout() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <Header onOpenCart={() => setCartOpen(true)} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route path="/order-success" element={<OrderSuccess />} />
        </Routes>
      </main>
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppLayout />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
