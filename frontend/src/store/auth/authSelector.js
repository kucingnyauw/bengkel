/**
 * authSelector.js
 */

export const selectUser = (state) => state.auth.user;

export const selectAuthStatus = (state) => state.auth.status;

export const selectAuthLoading = (state) => state.auth.loading;

export const selectAuthInitialized = (state) => state.auth.initialized;