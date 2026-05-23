/**
 * AuthCardWrapper - Styled card wrapper for authentication forms.
 *
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Rendered auth card
 */
import { Card, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

const AuthCardWrapper = ({ children }) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        width: "100%",
        maxWidth: 440,
        margin: "0 auto",
        px: { xs: 3, sm: 5 },
        py: { xs: 4, sm: 5 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: alpha(theme.palette.background.paper, 0.85),
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: { xs: 3, sm: 4 },
        border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
        boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.06)}`,
        transition: theme.transitions.create(
          ["box-shadow", "border-color"],
          { duration: theme.transitions.duration.standard }
        ),
        "&:hover": {
          boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.1)}`,
          borderColor: alpha(theme.palette.secondary.main, 0.3),
        },
      }}
    >
      {children}
    </Card>
  );
};

export default AuthCardWrapper;