import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "@store/auth/authSelector.js";

const PublicRoutes = ({ children, restricted = false }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (isAuthenticated && restricted) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PublicRoutes;
