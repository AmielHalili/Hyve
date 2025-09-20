import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthStore();
  const loc = useLocation();
  if (loading) return null; // or a spinner
  if (!user) return <Navigate to="/signin" replace state={{ from: loc }} />;
  return <>{children}</>;
}
