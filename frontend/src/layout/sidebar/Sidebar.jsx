/**
 * Sidebar - Application sidebar dengan menu items, responsive drawer untuk mobile, 
 * dan role-based filtering
 * Hanya dirender ketika user sudah terautentikasi (status: "auth")
 * @component
 * @returns {JSX.Element} Rendered sidebar component
 */
import { useEffect } from "react";
import { Box, Drawer, Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

import { SIDEBAR, HEADER } from "@shared/constant/layout.js";
import { selectSidebarIsOpen } from "@store/sidebar/sidebarSelector.js";
import {
  toggleSidebar,
  closeSidebar,
  setActiveItem,
} from "@store/sidebar/sidebarSlices.js";
import { selectUser } from "@store/auth/authSelector.js";
import { filterMenuByRole, menuItems } from "@menu/index.js";
import { useDevice } from "@hooks/useDevice.js";

import INFO from "@data/Info.js";
import MenuItem from "@layout/sidebar/MenuItem.jsx";

const Sidebar = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector(selectUser);
  const isSidebarOpen = useSelector(selectSidebarIsOpen);
  const { isMobile, isTablet } = useDevice();

  const filteredMenu = filterMenuByRole(menuItems.items, user?.role);

  useEffect(() => {
    const findActiveItem = (items) => {
      for (const item of items) {
        if (item.url && location.pathname === item.url) return item.id;
        if (
          (item.type === "collapse" || item.type === "group") &&
          item.children
        ) {
          const childId = findActiveItem(item.children);
          if (childId) return childId;
        }
      }
      return null;
    };

    const activeId = findActiveItem(filteredMenu);
    if (activeId) dispatch(setActiveItem(activeId));
  }, [location.pathname, filteredMenu, dispatch]);

  const handleItemClick = () => {
    if (isMobile || isTablet) dispatch(closeSidebar());
  };

  const sidebarWidth = isSidebarOpen
    ? SIDEBAR.EXPANDED_WIDTH
    : SIDEBAR.COLLAPSED_WIDTH;

  const LogoSection = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: isMobile ? "flex-start" : "center",
        px: isMobile ? 2.5 : isSidebarOpen ? 3 : 1.5,
        py: 2.5,
        flexShrink: 0,
      }}
    >
      <Box
        component="img"
        src={INFO.logoUrl}
        alt={INFO.name}
        sx={{
          height: 36,
          width: "auto",
          maxWidth: isMobile || isSidebarOpen ? 120 : 36,
          objectFit: "contain",
          transition: theme.transitions.create("max-width", {
            duration: "0.3s",
          }),
        }}
      />
    </Box>
  );

  const MenuContent = (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: "auto",
        overflowX: "hidden",
        px: isMobile || isSidebarOpen ? 2.5 : 1.5,
        py: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        "&::-webkit-scrollbar": {
          width: "4px",
        },
        "&::-webkit-scrollbar-track": {
          background: "transparent",
        },
        "&::-webkit-scrollbar-thumb": {
          background: alpha(theme.palette.secondary.main, 0.2),
          borderRadius: "4px",
        },
        "&::-webkit-scrollbar-thumb:hover": {
          background: alpha(theme.palette.secondary.main, 0.4),
        },
      }}
    >
      {filteredMenu.map((item) => (
        <MenuItem
          key={item.id}
          item={item}
          isCollapsed={!isSidebarOpen && !isMobile}
          level={0}
          onItemClick={handleItemClick}
        />
      ))}
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="left"
        open={isSidebarOpen}
        onClose={() => dispatch(toggleSidebar())}
        ModalProps={{ keepMounted: true }}
        sx={{
          zIndex: theme.zIndex.appBar + 1,
          "& .MuiDrawer-paper": {
            top: 0,
            height: "100%",
            width: SIDEBAR.EXPANDED_WIDTH,
            borderRadius: 0,
            border: "none",
            backgroundColor: theme.palette.background.paper,
            boxShadow: `4px 0 20px -8px ${alpha(theme.palette.common.black, 0.12)}`,
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {LogoSection}
        {MenuContent}
      </Drawer>
    );
  }

  return (
    <Paper
      component="nav"
      elevation={0}
      sx={{
        width: sidebarWidth,
        position: "fixed",
        top: HEADER.DESKTOP_HEIGHT,
        left: 0,
        height: `calc(100vh - ${HEADER.DESKTOP_HEIGHT}px)`,
        display: "flex",
        flexDirection: "column",
        transition: theme.transitions.create("width", {
          easing: theme.transitions.easing.easeInOut,
          duration: "0.3s",
        }),
        zIndex: theme.zIndex.drawer,
        overflowX: "hidden",
        borderRadius: 0,
        border: "none",
        backgroundColor: theme.palette.background.paper,
        boxShadow: `4px 0 20px -8px ${alpha(theme.palette.common.black, 0.08)}`,
      }}
    >
      {MenuContent}
    </Paper>
  );
};

export default Sidebar;