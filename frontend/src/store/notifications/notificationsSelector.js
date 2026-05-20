/**
 * Selector untuk mengambil seluruh state notifikasi dari Redux store
 *
 * @param {Object} state - State Redux secara keseluruhan
 * @param {NotificationState} state.notification - State notifikasi
 * @returns {NotificationState} Objek state notifikasi lengkap
 *
 * @example
 * const notification = useSelector(selectNotification);
 * console.log(notification); // { open: true, message: "Berhasil!", type: "success", ... }
 */
export const selectNotification = (state) => state.notification;

/**
 * Selector untuk mengambil status visibilitas notifikasi
 *
 * @param {Object} state - State Redux secara keseluruhan
 * @param {NotificationState} state.notification - State notifikasi
 * @returns {boolean} Status notifikasi sedang terbuka atau tidak
 *
 * @example
 * const isOpen = useSelector(selectNotificationOpen);
 * if (isOpen) {
 *   console.log("Notifikasi sedang ditampilkan");
 * }
 */
export const selectNotificationOpen = (state) => state.notification.open;

/**
 * Selector untuk mengambil pesan notifikasi
 *
 * @param {Object} state - State Redux secara keseluruhan
 * @param {NotificationState} state.notification - State notifikasi
 * @returns {string} Teks pesan notifikasi
 *
 * @example
 * const message = useSelector(selectNotificationMessage);
 * console.log(message); // "Data berhasil disimpan!"
 */
export const selectNotificationMessage = (state) => state.notification.message;

/**
 * Selector untuk mengambil jenis (type) notifikasi
 *
 * @param {Object} state - State Redux secara keseluruhan
 * @param {NotificationState} state.notification - State notifikasi
 * @returns {"info"|"success"|"warning"|"error"} Jenis notifikasi yang menentukan gaya tampilan
 *
 * @example
 * const type = useSelector(selectNotificationType);
 * if (type === "error") {
 *   console.error("Terjadi kesalahan!");
 * }
 */
export const selectNotificationType = (state) => state.notification.type;

/**
 * Selector untuk mengambil judul notifikasi
 *
 * @param {Object} state - State Redux secara keseluruhan
 * @param {NotificationState} state.notification - State notifikasi
 * @returns {string} Teks judul notifikasi
 *
 * @example
 * const title = useSelector(selectNotificationTitle);
 * console.log(title); // "Berhasil" atau string kosong jika tidak ada judul
 */
export const selectNotificationTitle = (state) => state.notification.title;

/**
 * Selector untuk mengambil varian tampilan notifikasi
 *
 * @param {Object} state - State Redux secara keseluruhan
 * @param {NotificationState} state.notification - State notifikasi
 * @returns {"snackbar"|"alert"|"dialog"} Varian tampilan notifikasi yang digunakan
 *
 * @example
 * const variant = useSelector(selectNotificationVariant);
 * if (variant === "dialog") {
 *   console.log("Notifikasi ditampilkan sebagai dialog");
 * }
 */
export const selectNotificationVariant = (state) => state.notification.variant;

/**
 * Selector untuk mengambil durasi tampil otomatis notifikasi
 *
 * @param {Object} state - State Redux secara keseluruhan
 * @param {NotificationState} state.notification - State notifikasi
 * @returns {number} Durasi notifikasi dalam milidetik sebelum otomatis tertutup
 *
 * @example
 * const autoHideDuration = useSelector(selectNotificationAutoHide);
 * console.log(`Notifikasi akan tertutup dalam ${autoHideDuration}ms`); // "Notifikasi akan tertutup dalam 4000ms"
 * 
 * // Menggunakan untuk logika kustom
 * if (autoHideDuration > 5000) {
 *   console.log("Notifikasi akan tampil lebih dari 5 detik");
 * }
 */
export const selectNotificationAutoHide = (state) => state.notification.autoHide;