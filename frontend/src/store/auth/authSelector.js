const selectAuth = (state) => state.auth;

export const selectUser = (state) => selectAuth(state).user;
export const selectAuthLoading = (state) => selectAuth(state).loading;
export const selectAuthError = (state) => selectAuth(state).error;
export const selectMagicLinkSent = (state) => selectAuth(state).magicLinkSent;
export const selectAuthInitialized = (state) => selectAuth(state).initialized;


export const selectIsAuthenticated = (state) => {
  const user = selectUser(state);
  return !!user;
};

export const selectIsAuthReady = (state) => {
  const auth = selectAuth(state);
  return auth.initialized && !auth.loading;
};

export const selectAuthStatus = (state) => {
  const auth = selectAuth(state);

  return {
    isAuthenticated: !!auth.user,
    isReady: auth.initialized && !auth.loading,
    loading: auth.loading,
  };
};