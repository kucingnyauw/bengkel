import ApiError from "#shared/utils/error.js";

/**
 * Middleware untuk membatasi waktu eksekusi request.
 *
 * @param {Object} options
 * @param {number} [options.timeoutMs=5000]
 * @returns {import("express").RequestHandler}
 */
const timeoutMiddleware = ({ timeoutMs = 5000 } = {}) => {
  return (req, res, next) => {
    let isHandled = false;

    const cleanup = () => {
      clearTimeout(timerId);
      isHandled = true;
    };

    const timerId = setTimeout(() => {
      if (isHandled || res.headersSent) return;

      cleanup();

      const timeoutSeconds = timeoutMs / 1000;

      next(
        ApiError.requestTimeout({
          message: `Server membutuhkan waktu terlalu lama untuk merespons (${timeoutSeconds} detik). Silakan coba beberapa saat lagi.`,
        })
      );
    }, timeoutMs);

    res.once("finish", cleanup);
    res.once("close", cleanup);

    next();
  };
};

export default timeoutMiddleware;