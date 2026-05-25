import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import type { ReactNode } from "react";

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin, loading } = useUserRole();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg">Verificando permissões...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
