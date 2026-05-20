import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "@store/auth/authSelector.js";

const RoleRoutes = ({ allowedRoles = [], children }) => {
  const user = useSelector(selectUser);

  const hasAccess = allowedRoles.includes(user?.role);

  return hasAccess ? children : <Navigate to="/unauthorized" replace />;
};

export default RoleRoutes;
