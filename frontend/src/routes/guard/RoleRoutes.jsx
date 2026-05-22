/**
 * RoleRoutes.jsx
 */

import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectUser,
  selectAuthStatus,
} from "@store/auth/authSelector.js";

const RoleRoutes = ({ allowedRoles = [], children }) => {
  const user = useSelector(selectUser);
  const status = useSelector(selectAuthStatus);

  /**
   * Role check hanya valid jika auth state sudah resolved
   */
  if (status !== "auth") {
    return null;
  }

  /**
   * Validasi role access
   */
  const hasAccess = allowedRoles.includes(user?.role);

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RoleRoutes;