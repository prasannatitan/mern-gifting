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
import NewProduct from "./pages/NewProduct";
import EditProduct from "./pages/EditProduct";
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
import AdminVendors from "./pages/admin/AdminVendors";
import AdminStores from "./pages/admin/AdminStores";
import CeeOverview from "./pages/cee/CeeOverview";
import CeeOrders from "./pages/cee/CeeOrders";
import CeeStores from "./pages/cee/CeeStores";

const queryClient = new QueryClient();

const CORPORATE_ROLES = ["CORPORATE_ADMIN"] as const;

function LoginOrRedirect() {
  const { user } = useAuth();
  if (user) {
    if (user.role === "VENDOR") return <Navigate to="/" replace />;
    if (user.role === "CEE") return <Navigate to="/cee" replace />;
    if (user.role === "CORPORATE_ADMIN") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/login" replace />;
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

            {/* Vendor */}
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
              path="/products/new"
              element={
                <ProtectedRoute allowedRoles={["VENDOR"]}>
                  <NewProduct />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/:id/edit"
              element={
                <ProtectedRoute allowedRoles={["VENDOR"]}>
                  <EditProduct />
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

            {/* CEE — territory orders & stores */}
            <Route
              path="/cee"
              element={
                <ProtectedRoute allowedRoles={["CEE"]}>
                  <CeeOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cee/orders"
              element={
                <ProtectedRoute allowedRoles={["CEE"]}>
                  <CeeOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cee/stores"
              element={
                <ProtectedRoute allowedRoles={["CEE"]}>
                  <CeeStores />
                </ProtectedRoute>
              }
            />

            {/* Corporate admin — catalog + platform */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={[...CORPORATE_ROLES]}>
                  <AdminOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute allowedRoles={[...CORPORATE_ROLES]}>
                  <AdminProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute allowedRoles={["CORPORATE_ADMIN"]}>
                  <AdminOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/cost-letters"
              element={
                <ProtectedRoute allowedRoles={[...CORPORATE_ROLES]}>
                  <AdminCostLetters />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/deliveries"
              element={
                <ProtectedRoute allowedRoles={[...CORPORATE_ROLES]}>
                  <AdminDeliveries />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ProtectedRoute allowedRoles={[...CORPORATE_ROLES]}>
                  <AdminPayments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/vendors"
              element={
                <ProtectedRoute allowedRoles={[...CORPORATE_ROLES]}>
                  <AdminVendors />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/stores"
              element={
                <ProtectedRoute allowedRoles={[...CORPORATE_ROLES]}>
                  <AdminStores />
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
