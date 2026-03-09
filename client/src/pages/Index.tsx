import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/routes/paths";

const Index = () => {
  const { isAuthenticated, authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    navigate(isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN, { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  return null;
};

export default Index;
