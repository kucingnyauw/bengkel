import { createBrowserRouter } from "react-router-dom";
import { MainRoutes, AuthRoutes } from "@routes/components";
import ErrorBoundary from "@routes/ErrorBoundary.jsx";

const rootRouter = {
  path: "/",
  errorElement: <ErrorBoundary/>,
  children: [
    ...(Array.isArray(MainRoutes) ? MainRoutes : [MainRoutes]),
    ...(Array.isArray(AuthRoutes) ? AuthRoutes : [AuthRoutes]),
  ],
};

const router = createBrowserRouter([rootRouter]);

export default router;
