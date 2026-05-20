import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectIsAuthenticated,
  selectAuthInitialized,
  selectAuthLoading,
} from "@store/auth/authSelector.js";
import { AppLoading } from "@components";

const PrivateRoutes = ({ children }) => {
  const location = useLocation();

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const initialized = useSelector(selectAuthInitialized);
  const loading = useSelector(selectAuthLoading);

  if (!initialized || loading) {
    return <AppLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoutes;
