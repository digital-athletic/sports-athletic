import { Navigate } from "react-router-dom";
import { useProfile } from "../hooks/useProfile";
import { LoadingSpinner } from "./LoadingSpinner";

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { profile, loading } = useProfile();

  if (loading) return <LoadingSpinner />;
  if (!profile?.adminGrantedAt) return <Navigate to="/teams" replace />;
  return <>{children}</>;
};
