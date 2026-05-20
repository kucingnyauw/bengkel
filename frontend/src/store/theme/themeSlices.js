import { createSlice } from "@reduxjs/toolkit";

const getInitialTheme = () => {
  if (typeof window === "undefined") return "light";

  try {
    return localStorage.getItem("theme") || "light";
  } catch {
    return "light";
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
    },
    toggleTheme: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;