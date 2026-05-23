// src/main.jsx

/**
 * React DOM
 */
import { createRoot } from "react-dom/client";

/**
 * State Management
 */
import { Provider } from "react-redux";
import store from "@store/index.js";

/**
 * React Query
 */
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

/**
 * Application
 */
import App from "./App.jsx";

/**
 * Shared Constants
 */
import { STALE_TIME } from "@shared/constant/constant.js";

/**
 * Axios Interceptors
 */
import { setupInterceptors } from "@lib/setupInterceptors.js";

import reportWebVitals from "./reportWebVitals.js";
import { register as registerServiceWorker } from "./serviceWorkerRegistration.js";


/**
 * Fonts — Open Sans
 */
import "@fontsource/open-sans/300.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/500.css";
import "@fontsource/open-sans/600.css";
import "@fontsource/open-sans/700.css";



import "@fontsource/open-sans/300.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/500.css";
import "@fontsource/open-sans/600.css";
import "@fontsource/open-sans/700.css";




/**
 * ------------------------------------------------------------
 * Initialize Global Axios Interceptors
 * ------------------------------------------------------------
 */
setupInterceptors({ store });

/**
 * ------------------------------------------------------------
 * Configure React Query Client
 * ------------------------------------------------------------
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});




/**
 * ------------------------------------------------------------
 * Resolve Root DOM Element
 * ------------------------------------------------------------
 */
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "Root element dengan id 'root' tidak ditemukan."
  );
}

/**
 * ------------------------------------------------------------
 * Create React Root Instance
 * ------------------------------------------------------------
 */
const root = createRoot(rootElement);

/**
 * ------------------------------------------------------------
 * Render React Application
 * ------------------------------------------------------------
 */
root.render(
  <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <App />
    </Provider>
  </QueryClientProvider>
);



// =========================
// SERVICE WORKER
// =========================
registerServiceWorker({
  onSuccess: (registration) =>
    console.log("[SW] Registration successful", registration),
  onUpdate: (registration) =>
    console.log("[SW] Update available", registration),
});



reportWebVitals()