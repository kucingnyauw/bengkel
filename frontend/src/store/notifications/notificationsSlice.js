import { createSlice } from "@reduxjs/toolkit";

/**
 * State awal untuk notifikasi
 * @typedef {Object} NotificationState
 * @property {boolean} open - Status visibilitas notifikasi (terbuka/tertutup)
 * @property {string} message - Pesan yang ditampilkan dalam notifikasi
 * @property {"info"|"success"|"warning"|"error"} type - Jenis notifikasi yang menentukan gaya tampilan
 * @property {string} title - Judul notifikasi
 * @property {"snackbar"|"alert"|"dialog"} variant - Varian tampilan notifikasi
 * @property {number} autoHide - Durasi notifikasi muncul dalam milidetik sebelum otomatis tertutup (default: 4000ms)
 */
const initialState = {
  open: false,
  message: "",
  type: "info",
  title: "",
  variant: "snackbar",
  autoHide: 4000,
};

/**
 * Slice Redux untuk mengelola state notifikasi aplikasi.
 * Menyediakan reducer dan action untuk menampilkan, menyembunyikan, dan membersihkan notifikasi.
 */
const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    /**
     * Menampilkan notifikasi dengan konfigurasi yang ditentukan.
     *
     * @param {NotificationState} state - State notifikasi saat ini
     * @param {Object} action - Objek action Redux
     * @param {Object} action.payload - Data payload untuk notifikasi
     * @param {string} action.payload.message - Pesan yang akan ditampilkan (wajib)
     * @param {"info"|"success"|"warning"|"error"} [action.payload.type="info"] - Jenis notifikasi
     * @param {string} [action.payload.title=""] - Judul notifikasi
     * @param {"snackbar"|"alert"|"dialog"} [action.payload.variant="snackbar"] - Varian tampilan notifikasi
     * @param {number} [action.payload.autoHide=4000] - Durasi tampil notifikasi dalam milidetik
     *
     * @example
     * // Menampilkan notifikasi sukses
     * dispatch(showNotification({
     *   message: "Data berhasil disimpan!",
     *   type: "success",
     *   title: "Berhasil"
     * }));
     *
     * @example
     * // Menampilkan notifikasi error dengan dialog
     * dispatch(showNotification({
     *   message: "Gagal menyimpan data!",
     *   type: "error",
     *   variant: "dialog",
     *   autoHide: 6000
     * }));
     */
    showNotification: (state, action) => {
      const {
        message,
        type = "info",
        title = "",
        variant = "snackbar",
        autoHide = 4000,
      } = action.payload;

      state.open = true;
      state.message = message;
      state.type = type;
      state.title = title;
      state.variant = variant;
      state.autoHide = autoHide;
    },
    
    /**
     * Menyembunyikan notifikasi yang sedang ditampilkan.
     * Hanya mengubah properti `open` menjadi `false` tanpa menghapus data notifikasi.
     *
     * @param {NotificationState} state - State notifikasi saat ini
     *
     * @example
     * dispatch(hideNotification());
     */
    hideNotification: (state) => {
      state.open = false;
    },
    
    /**
     * Menghapus seluruh data notifikasi dan mengembalikan state ke nilai awal.
     * Berguna untuk membersihkan state notifikasi sepenuhnya.
     *
     * @returns {NotificationState} State awal notifikasi
     *
     * @example
     * dispatch(clearNotification());
     */
    clearNotification: () => initialState,
  },
});

/**
 * Action creators yang diekspor dari notificationSlice
 * @exports showNotification - Action untuk menampilkan notifikasi
 * @exports hideNotification - Action untuk menyembunyikan notifikasi
 * @exports clearNotification - Action untuk membersihkan state notifikasi ke nilai awal
 */
export const {
  showNotification,
  hideNotification,
  clearNotification,
} = notificationSlice.actions;

/**
 * Selector untuk mengambil state notifikasi dari Redux store
 *
 * @param {Object} state - State Redux secara keseluruhan
 * @param {NotificationState} state.notification - State notifikasi
 * @returns {NotificationState} State notifikasi saat ini
 *
 * @example
 * const notification = useSelector(selectNotification);
 * console.log(notification.message); // Menampilkan pesan notifikasi
 */
export const selectNotification = (state) => state.notification;

/**
 * Reducer notifikasi untuk digunakan dalam Redux store
 * @exports notificationSlice.reducer
 */
export default notificationSlice.reducer;