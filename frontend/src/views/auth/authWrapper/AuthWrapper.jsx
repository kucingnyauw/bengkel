/**
 * AuthWrapper - Fullscreen authentication wrapper with centered content.
 *
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Rendered auth wrapper
 */
import { Box, useTheme } from "@mui/material";

const AuthWrapper = ({ children }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.palette.background.default,
        p: { xs: 2, sm: 3 },
        [theme.breakpoints.down("sm")]: {
          alignItems: "flex-start",
          pt: { xs: 10, sm: 14 },
        },
      }}
    >
      {children}
    </Box>
  );
};

export default AuthWrapper;