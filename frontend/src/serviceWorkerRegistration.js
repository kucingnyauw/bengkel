/**
 * Service Worker Registration
 *
 * Responsibilities:
 * - Register service worker in production
 * - Handle update lifecycle
 * - Provide hooks for UI integration
 *
 * @module serviceWorkerRegistration
 */

const isLocalhost =
  ["localhost", "[::1]"].includes(window.location.hostname) ||
  /^127(\.\d{1,3}){3}$/.test(window.location.hostname);

/**
 * Register Service Worker
 *
 * @param {Object} [config]
 * @param {(reg: ServiceWorkerRegistration) => void} [config.onSuccess]
 * @param {(reg: ServiceWorkerRegistration) => void} [config.onUpdate]
 */
export function register(config) {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;

    if (isLocalhost) {
      checkValidServiceWorker(swUrl, config);
    } else {
      registerValidSW(swUrl, config);
    }
  });
}

/**
 * Register valid SW
 */
function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log("[SW] Registered");

      registration.onupdatefound = () => {
        const worker = registration.installing;
        if (!worker) return;

        worker.onstatechange = () => {
          if (worker.state === "installed") {
            if (navigator.serviceWorker.controller) {
              console.log("[SW] Update available");

              config?.onUpdate?.(registration);
            } else {
              console.log("[SW] Ready (offline)");

              config?.onSuccess?.(registration);
            }
          }
        };
      };
    })
    .catch((err) => {
      console.error("[SW] Registration failed:", err);
    });
}

/**
 * Validate SW on localhost
 */
function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { headers: { "Service-Worker": "script" } })
    .then((res) => {
      const contentType = res.headers.get("content-type");

      if (
        res.status === 404 ||
        (contentType && !contentType.includes("javascript"))
      ) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.unregister().then(() => location.reload());
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.warn("[SW] Offline mode");
    });
}

/**
 * Unregister Service Worker
 */
export function unregister() {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.ready
    .then((reg) => reg.unregister())
    .catch((err) => console.error("[SW] Unregister failed:", err));
}