import { Box } from "@mui/material";
import { HEADER } from "@shared/constant/layout.js";

const Footer = () => {
  return <Box sx={{
    height : `${HEADER.DESKTOP_HEIGHT}px`
  }} component="footer" />;
};

export default Footer;