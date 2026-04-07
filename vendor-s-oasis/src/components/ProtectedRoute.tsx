import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type UserRole } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If set, only these roles can access. Otherwise any logged-in user. */
  allowedRoles?: UserRole[];
}

function homeForRole(role: UserRole): string {
  if (role === "VENDOR") return "/";
  if (role === "CEE") return "/cee";
  if (role === "CORPORATE_ADMIN") return "/admin";
  return "/login";
}

/**
 * Redirects to /login if not authenticated.
 * If allowedRoles is set, redirects to the correct dashboard for the user's role.
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  return <>{children}</>;
}
