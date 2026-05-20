import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

export const useDevice = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isLargeDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
  };
};
