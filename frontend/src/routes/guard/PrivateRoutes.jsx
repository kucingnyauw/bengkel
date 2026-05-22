import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuthStatus } from "@store/auth/authSelector.js";

/**
 * Guard component untuk route yang membutuhkan autentikasi
 * Hanya handle redirect ke login jika guest
 * Loading & error di-handle oleh MainLayout
 * @param {Object} props
 * @param {React.ReactNode} props.children - Children components
 * @returns {JSX.Element} Protected route atau redirect ke login
 */
const PrivateRoutes = ({ children }) => {
  const location = useLocation();
  const status = useSelector(selectAuthStatus);

  /**
   * Tidak ada session valid - redirect ke login
   */
  if (status === "guest") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  /**
   * Auth valid, degraded, atau unknown
   * Semua di-handle oleh MainLayout
   */
  return children;
};

export default PrivateRoutes;