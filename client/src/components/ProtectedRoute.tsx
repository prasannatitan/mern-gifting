import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext.tsx";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate to={`/login?from=${encodeURIComponent(location.pathname)}`} state={{ from: location }} replace />
    );
  }

  return <>{children}</>;
}
