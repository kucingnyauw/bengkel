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
    alignItems: "flex-start",
    paddingTop: theme.spacing(6),
  },
}));

export default AuthWrapper;