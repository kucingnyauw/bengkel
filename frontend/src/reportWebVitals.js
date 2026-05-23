/**
 * Report Web Vitals
 *
 * Collects and reports performance metrics:
 * - CLS  (Cumulative Layout Shift)
 * - FCP  (First Contentful Paint)
 * - LCP  (Largest Contentful Paint)
 * - TTFB (Time to First Byte)
 * - INP  (Interaction to Next Paint)
 *
 * Usage:
 * reportWebVitals(console.log)
 *
 * @param {(metric: import("web-vitals").Metric) => void} [onPerfEntry]
 */
const reportWebVitals = (onPerfEntry) => {
    if (typeof onPerfEntry !== "function") return;
  
    import("web-vitals").then(
      ({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
        onCLS(onPerfEntry);
        onFCP(onPerfEntry);
        onLCP(onPerfEntry);
        onTTFB(onPerfEntry);
        onINP(onPerfEntry);
      }
    );
  };
  
  export default reportWebVitals;