/**
 * PublicRoutes.jsx
 */

import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuthStatus } from "@store/auth/authSelector.js";

const PublicRoutes = ({ children, restricted = false }) => {
  const location = useLocation();
  const status = useSelector(selectAuthStatus);

  /**
   * Optional: redirect authenticated user away from public pages
   */
  const isAuthenticated = status === "auth";

  /**
   * If route is restricted (login, register, etc)
   * and user already authenticated → redirect home
   */
  if (isAuthenticated && restricted) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  /**
   * IMPORTANT:
   * allow all other states:
   * - guest → normal public access
   * - unknown → still allow (avoid blocking UX)
   * - degraded → still allow (offline-safe)
   */
  return children;
};

export default PublicRoutes;