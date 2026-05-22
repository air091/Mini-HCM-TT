import { Navigate } from "react-router-dom";
import { getDashboardPath } from "../lib/auth";
import { useAuth } from "../hooks/useAuth";
import LoadingScreen from "./LoadingScreen";

export default function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Navigate to={user ? getDashboardPath(user.role) : "/login"} replace />
  );
}
