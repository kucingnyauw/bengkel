import { createSlice } from "@reduxjs/toolkit";

const THEME_STORAGE_KEY = "theme-mode";

const getInitialTheme = () => {
  if (typeof window === "undefined") return "dark";

  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || "dark";
  } catch {
    return "dark";
  }
};

const themeSlice = createSlice({
  name: "theme",
  initialState: {
    mode: getInitialTheme(),
  },
  reducers: {
    setTheme: (state, action) => {
      state.mode = action.payload;
      try {
        localStorage.setItem(THEME_STORAGE_KEY, action.payload);
      } catch {}
    },
    toggleTheme: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
      try {
        localStorage.setItem(THEME_STORAGE_KEY, state.mode);
      } catch {}
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;