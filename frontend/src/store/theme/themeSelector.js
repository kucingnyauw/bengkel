export const selectThemeMode = (state) => state.theme.mode;

export const selectIsDarkMode = (state) => state.theme.mode === "dark";

export const selectIsLightMode = (state) => state.theme.mode === "light";