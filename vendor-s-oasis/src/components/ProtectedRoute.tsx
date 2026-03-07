import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type UserRole } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If set, only these roles can access. Otherwise any logged-in user. */
  allowedRoles?: UserRole[];
}

/**
 * Redirects to /login if not authenticated.
 * If allowedRoles is set, redirects to / (vendor) or /admin (admin) if role doesn't match.
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (user.role === "VENDOR") return <Navigate to="/" replace />;
    if (user.role === "CEE" || user.role === "SUPER_ADMIN") return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
