import { createBrowserRouter } from "react-router-dom";
import { MainRoutes, AuthRoutes } from "@routes/components";

const rootRouter = {
  path: "/",
  errorElement: null,
  children: [
    ...(Array.isArray(MainRoutes) ? MainRoutes : [MainRoutes]),
    ...(Array.isArray(AuthRoutes) ? AuthRoutes : [AuthRoutes]),
  ],
};

const router = createBrowserRouter([rootRouter]);

export default router;
