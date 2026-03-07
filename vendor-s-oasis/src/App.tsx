import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import CostLetters from "./pages/CostLetters";
import Deliveries from "./pages/Deliveries";
import Payments from "./pages/Payments";
import NotFound from "./pages/NotFound";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCostLetters from "./pages/admin/AdminCostLetters";
import AdminDeliveries from "./pages/admin/AdminDeliveries";
import AdminPayments from "./pages/admin/AdminPayments";

const queryClient = new QueryClient();

function LoginOrRedirect() {
  const { user } = useAuth();
  if (user) {
    if (user.role === "VENDOR") return <Navigate to="/" replace />;
    if (user.role === "CEE" || user.role === "SUPER_ADMIN") return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }
  return <Login />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginOrRedirect />} />

            {/* Vendor Dashboard — VENDOR only */}
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={["VENDOR"]}>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute allowedRoles={["VENDOR"]}>
                  <Products />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute allowedRoles={["VENDOR"]}>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cost-letters"
              element={
                <ProtectedRoute allowedRoles={["VENDOR"]}>
                  <CostLetters />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deliveries"
              element={
                <ProtectedRoute allowedRoles={["VENDOR"]}>
                  <Deliveries />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute allowedRoles={["VENDOR"]}>
                  <Payments />
                </ProtectedRoute>
              }
            />

            {/* Admin Dashboard — CEE & SUPER_ADMIN */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["CEE", "SUPER_ADMIN"]}>
                  <AdminOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute allowedRoles={["CEE", "SUPER_ADMIN"]}>
                  <AdminProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute allowedRoles={["CEE", "SUPER_ADMIN"]}>
                  <AdminOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/cost-letters"
              element={
                <ProtectedRoute allowedRoles={["CEE", "SUPER_ADMIN"]}>
                  <AdminCostLetters />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/deliveries"
              element={
                <ProtectedRoute allowedRoles={["CEE", "SUPER_ADMIN"]}>
                  <AdminDeliveries />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ProtectedRoute allowedRoles={["CEE", "SUPER_ADMIN"]}>
                  <AdminPayments />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
