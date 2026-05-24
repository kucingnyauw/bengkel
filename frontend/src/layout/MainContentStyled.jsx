/**
 * MainContentStyled - Styled main content area with responsive sidebar offset, container max-width, and flexbox layout for footer positioning.
 *
 * @module MainContentStyled
 * @param {Object} props - Component props
 * @param {boolean} props.open - Sidebar open state
 * @param {boolean} props.isMobile - Mobile device flag
 * @returns {JSX.Element} Styled main component
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
    display: "flex",
    flexDirection: "column",
    minHeight: `calc(100vh - ${headerHeight}px - ${my} * 2)`,
    backgroundColor: theme.palette.background.default,
    borderRadius: `${theme.shape.borderRadius}px`,
    border: "none",
  


    transition: theme.transitions.create(["margin-left", "width"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),

    marginTop: `calc(${headerHeight}px + ${my})`,
    marginLeft: isMobile ? mx : `calc(${sidebarWidth}px + ${mx})`,
    marginRight: mx,
    marginBottom: mx,
    width: isMobile
      ? `calc(100% - ${mx} * 2)`
      : `calc(100% - ${sidebarWidth}px - ${mx} * 2)`,

    ...(open && !isMobile && {
      transition: theme.transitions.create(["margin-left", "width"], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),

    "& .content-container": {
      flex: 1,
      width: "100%",
      maxWidth: "100%",
      margin: "0 auto",
      padding: theme.spacing(2),
      transition: theme.transitions.create("max-width", {
        easing: theme.transitions.easing.easeInOut,
        duration: theme.transitions.duration.standard,
      }),

      [theme.breakpoints.up("sm")]: {
        padding: theme.spacing(2.5),
      },

      [theme.breakpoints.up("md")]: {
        padding: theme.spacing(3),
      },

      [theme.breakpoints.up("lg")]: {
        maxWidth: 1200,
        padding: theme.spacing(3),
      },

      [theme.breakpoints.up("xl")]: {
        maxWidth: 1400,
        padding: theme.spacing(3, 4),
      },
    },

    "& .footer-container": {
      flexShrink: 0,
      marginTop: "auto",
    },
  };
});

export default MainContentStyled;