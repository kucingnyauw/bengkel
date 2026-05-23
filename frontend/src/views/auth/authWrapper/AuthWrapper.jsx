/**
 * AuthWrapper - Fullscreen authentication wrapper with centered content.
 *
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Rendered auth wrapper
 */
import { styled } from "@mui/material/styles";

const AuthWrapper = styled("div")(({ theme }) => ({
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(3),

  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
    alignItems: "center",
    justifyContent: "center",
    paddingTop: theme.spacing(10),
  },
}));

export default AuthWrapper;