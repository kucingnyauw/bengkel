import { Box, Typography, useTheme } from "@mui/material";
import INFO from "@/data/Info.js";

const Footer = () => {
  const theme = useTheme();
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: { xs: "center", sm: "space-between" },
        alignItems: "center",
        gap: { xs: 0.5, sm: 0 },
        py: theme.spacing(2),
        px: theme.spacing(3),
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography variant="caption" color="text.disabled">
        &copy; {year} {INFO.name}
      </Typography>
      <Typography variant="caption" color="text.disabled">
        All rights reserved
      </Typography>
    </Box>
  );
};

export default Footer;