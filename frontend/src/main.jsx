// src/main.jsx

import { createRoot } from "react-dom/client";

import { Provider } from "react-redux";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import App from "./App.jsx";

import store from "@store/index.js";

import { STALE_TIME } from "@shared/constant/constant.js";

import {
  setupInterceptors,
} from "@lib/setupInterceptors.js";

/**
 * Fonts
 */
import "@fontsource/open-sans/300.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/500.css";
import "@fontsource/open-sans/600.css";
import "@fontsource/open-sans/700.css";

/**
 * Initialize Axios Interceptors
 */
setupInterceptors({ store });

/**
 * React Query Client
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
 * Root Element
 */
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "Root element dengan id 'root' tidak ditemukan."
  );
}

/**
 * React Root
 */
const root = createRoot(rootElement);

/**
 * Render Application
 */
root.render(
  <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <App />
    </Provider>
  </QueryClientProvider>
);