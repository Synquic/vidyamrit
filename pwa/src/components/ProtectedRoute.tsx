import { Navigate, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useRoleAccess } from "../hooks/useRoleAccess";
import { UserRole } from "../types/user";
import { Spinner } from "@/components/ui/spinner";
import { AUTH_ROUTE_PATHS } from "@/routes";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { hasAccess } = useRoleAccess();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="medium" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={AUTH_ROUTE_PATHS.login}
        state={{ from: location }}
        replace
      />
    );
  }

  if (requiredRole && !hasAccess(requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
