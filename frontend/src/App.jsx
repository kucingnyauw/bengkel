import { useEffect, useMemo } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { RouterProvider } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { selectThemeMode } from "@store/theme/themeSelector.js";
import { getTheme } from "@styles/Theme.jsx";
import { fetchCurrentUser } from "@store/auth/authThunk.js";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { NotificationHandler } from "@components";
import router from "@routes";

const App = () => {
  const dispatch = useDispatch();
  const mode = useSelector(selectThemeMode);
  const theme = useMemo(() => getTheme(mode), [mode]);

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    const bg = theme.palette.background.default;
    meta?.setAttribute("content", bg);
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode, theme]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationHandler />
        <RouterProvider router={router} />
      </ThemeProvider>
    </LocalizationProvider>
  );
};

export default App;
