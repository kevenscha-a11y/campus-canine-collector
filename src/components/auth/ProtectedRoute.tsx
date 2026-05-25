import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isEmailVerified } from "@/lib/authHelpers";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isConfigured } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (!isConfigured) {
    return <Navigate to="/login" state={{ setupRequired: true }} replace />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isEmailVerified(user)) {
    return (
      <Navigate
        to="/verify-email"
        replace
        state={{ email: user.email }}
      />
    );
  }

  return <>{children}</>;
}
