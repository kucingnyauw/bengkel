import { Box, Typography } from "@mui/material";
import INFO from "@/data/Info.js";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        py: 2,
        px: 3,
      }}
    >
      <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 400 }}>
        &copy; {new Date().getFullYear()} {INFO.name}
      </Typography>
      <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 400 }}>
        All rights reserved
      </Typography>
    </Box>
  );
};

export default Footer;