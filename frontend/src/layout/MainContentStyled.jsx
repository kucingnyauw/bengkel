/**
 * MainContentStyled - Styled main content area with responsive sidebar offset and container max-width.
 *
 * @module MainContentStyled
 */
import { styled } from "@mui/material";
import { SIDEBAR, HEADER } from "@shared/constant/layout.js";

const MainContentStyled = styled("main", {
  shouldForwardProp: (prop) => prop !== "open" && prop !== "isMobile",
})(({ theme, open, isMobile }) => {
  const sidebarWidth = isMobile
    ? 0
    : open
    ? SIDEBAR.EXPANDED_WIDTH
    : SIDEBAR.COLLAPSED_WIDTH;

  const headerHeight = isMobile
    ? HEADER.MOBILE_HEIGHT
    : HEADER.DESKTOP_HEIGHT;

  const mx = isMobile ? theme.spacing(2) : theme.spacing(3);
  const my = isMobile ? theme.spacing(2) : theme.spacing(2);

  return {
    flexGrow: 1,
    minHeight: "100vh",
    backgroundColor: theme.palette.background.default,
    borderRadius: `${theme.shape.borderRadius}px`,
    border: "none",

    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeInOut,
      duration: theme.transitions.duration.standard,
    }),

    marginTop: `calc(${headerHeight}px + ${my})`,
    marginLeft: isMobile ? mx : `calc(${sidebarWidth}px + ${mx})`,
    marginRight: mx,
    marginBottom: mx,
    width: isMobile
      ? `calc(100% - ${mx} * 2)`
      : `calc(100% - ${sidebarWidth}px - ${mx} * 2)`,
    padding: theme.spacing(0),

    "& .content-container": {
      maxWidth: "100%",
      margin: "0 auto",
      padding: theme.spacing(3),

      [theme.breakpoints.up("sm")]: {
        padding: theme.spacing(3),
      },

      [theme.breakpoints.up("md")]: {
        padding: theme.spacing(3),
      },

      [theme.breakpoints.up("lg")]: {
        maxWidth: 1200,
      },

      [theme.breakpoints.up("xl")]: {
        maxWidth: 1400,
      },
    },
  };
});

export default MainContentStyled;