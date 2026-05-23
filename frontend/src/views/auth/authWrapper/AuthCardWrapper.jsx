/**
 * AuthCardWrapper - Styled card wrapper for authentication forms.
 *
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Rendered auth card
 */
import { Card, alpha, styled } from "@mui/material";

const AuthCardWrapper = styled(Card)(({ theme }) => ({
  width: "100%",
  maxWidth: 440,
  maxHeight: 400,
  margin: "0 auto",
  padding: theme.spacing(6),

  display: "flex",
  flexDirection: "column",

  backgroundColor: alpha(theme.palette.background.paper, 0.78),
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",

  borderRadius: 16,
  border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,

  boxShadow: `0 8px 30px ${alpha(theme.palette.common.black, 0.08)}`,

  transition: theme.transitions.create(
    ["box-shadow", "border-color", "transform"],
    {
      duration: theme.transitions.duration.standard,
    }
  ),

  "&:hover": {
    boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.12)}`,
    borderColor: alpha(theme.palette.primary.main, 0.35),
  },

  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(4),
    maxWidth: 420,
  },

  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(4, 2.5),
    maxWidth: "calc(100vw - 32px)",
    borderRadius: 20,
  },
}));

export default AuthCardWrapper;