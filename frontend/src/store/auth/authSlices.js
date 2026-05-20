import { createSlice } from "@reduxjs/toolkit";
import {
  fetchCurrentUser,
  loginWithEmail,
  loginWithGoogle,
  logout,
} from "./authThunk.js";

const initialState = {
  user: null,
  loading: false,
  error: null,
  magicLinkSent: false,
  initialized: false,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetAuthState: () => initialState,
    clearError: (state) => {
      state.error = null;
    },
    resetMagicLinkSent: (state) => {
      state.magicLinkSent = false;
    },
    setInitialized: (state) => {
      state.initialized = true;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        state.initialized = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.initialized = true;
      })

      .addCase(loginWithEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.magicLinkSent = false;
      })
      .addCase(loginWithEmail.fulfilled, (state) => {
        state.loading = false;
        state.magicLinkSent = true;
      })
      .addCase(loginWithEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.magicLinkSent = false;
      })

      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(logout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.initialized = true;
        state.loading = false;
        state.error = null;
        state.magicLinkSent = false;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  resetAuthState,
  clearError,
  resetMagicLinkSent,
  setInitialized,
} = authSlice.actions;

export default authSlice.reducer;