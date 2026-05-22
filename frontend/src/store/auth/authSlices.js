/**
 * authSlice.js
 */

import { createSlice } from "@reduxjs/toolkit";
import { fetchCurrentUser, logout } from "./authThunk.js";

/**
 * Auth state machine:
 * unknown  -> bootstrap belum selesai
 * auth     -> user authenticated
 * guest    -> no valid session
 * degraded -> network / auth service error
 */
const initialState = {
  user: null,
  loading: false,
  initialized: false,
  status: "unknown",
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    /**
     * Reset seluruh auth state
     */
    resetAuthState: () => initialState,

    /**
     * Clear error tanpa mengubah session
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Manual override status (opsional untuk edge-case / debug / recovery flow)
     */
    setAuthStatus: (state, action) => {
      state.status = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder

      /**
       * =========================
       * FETCH CURRENT USER
       * =========================
       */

      /**
       * Pending: auth check sedang berjalan
       */
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.status = "unknown";
      })

      /**
       * Fulfilled: request sukses (session valid atau tidak)
       */
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;

        state.user = action.payload;

        /**
         * SET AUTH STATUS
         * - jika user ada → auth
         * - jika tidak → guest
         */
        state.status = action.payload ? "auth" : "guest";
      })

      /**
       * Rejected: failure (network / supabase / backend error)
       */
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.user = null;

        const code = action.payload?.code;

        /**
         * No internet / service down
         */
        if (code === "NO_INTERNET_CONNECTION") {
          state.status = "degraded";
          state.error = action.payload?.message;
          return;
        }

        /**
         * Invalid session / unauthorized
         */
        if (code === "UNAUTHORIZED" || code === "AUTH_INVALID") {
          state.status = "guest";
          state.error = action.payload?.message;
          return;
        }

        /**
         * Default fallback error state
         */
        state.status = "degraded";
        state.error = action.payload?.message;
      })

      /**
       * =========================
       * LOGOUT
       * =========================
       */

      .addCase(logout.pending, (state) => {
        state.loading = true;
      })

      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.loading = false;
        state.initialized = true;

        /**
         * SET AUTH STATUS AFTER LOGOUT
         */
        state.status = "guest";

        state.error = null;
      })

      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;

        /**
         * optional: tetap guest karena session sudah invalid di client-side
         */
        state.status = "guest";
      });
  },
});

export const {
  resetAuthState,
  clearError,
  setAuthStatus,
} = authSlice.actions;

export default authSlice.reducer;