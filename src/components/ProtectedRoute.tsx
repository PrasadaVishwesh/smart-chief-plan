import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">Checking your account…</div>;
  if (!user) return <Navigate to="/auth" replace state={{ from: { pathname: location.pathname } }} />;
  return children;
}