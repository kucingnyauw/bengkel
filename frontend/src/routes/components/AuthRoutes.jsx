import { lazy } from "react";
import { PublicRoutes } from "@routes/guard";
import { AppLoadable } from "@components";

const Login = AppLoadable(
  lazy(() => import("@views/auth/authentication/Login.jsx"))
);
const Callback = AppLoadable(
  lazy(() => import("@views/auth/authentication/Callback.jsx"))
);

const AuthRoutes = {
  children: [
    {
      path: "login",
      element: (
        <PublicRoutes restricted>
          <Login />
        </PublicRoutes>
      ),
    },

    {
      path: "auth/callback",
      element: <Callback />,
    },
  ],
};

export default AuthRoutes;
