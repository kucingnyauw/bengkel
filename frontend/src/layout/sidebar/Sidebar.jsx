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

import MenuItem from "@layout/sidebar/MenuItem.jsx";

/**
 * Sidebar - Application sidebar dengan menu items, responsive drawer untuk mobile, 
 * dan role-based filtering
 * Hanya dirender ketika user sudah terautentikasi (status: "auth")
 * @component
 * @returns {JSX.Element} Rendered sidebar component
 */
const Sidebar = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector(selectUser);
  const isSidebarOpen = useSelector(selectSidebarIsOpen);
  const { isMobile, isTablet } = useDevice();

  /**
   * Filter menu items berdasarkan role user
   */
  const filteredMenu = filterMenuByRole(menuItems.items, user?.role);

  /**
   * Effect untuk menandai menu item yang aktif berdasarkan URL saat ini
   */
  useEffect(() => {
    /**
     * Mencari item menu yang aktif berdasarkan pathname
     * @param {Array} items - Array menu items
     * @returns {string|null} ID item yang aktif atau null
     */
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

  /**
   * Close sidebar saat item diklik (mobile/tablet)
   */
  const handleItemClick = () => {
    if (isMobile || isTablet) dispatch(closeSidebar());
  };

  const sidebarWidth = isSidebarOpen
    ? SIDEBAR.EXPANDED_WIDTH
    : SIDEBAR.COLLAPSED_WIDTH;

  /**
   * Menu content yang akan dirender di sidebar/drawer
   */
  const MenuContent = (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: "auto",
        overflowX: "hidden",
        px: isSidebarOpen ? 2 : 1,
        py: 2.5,
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

  /**
   * Mobile: render sebagai Drawer
   */
  if (isMobile) {
    return (
      <Drawer
        anchor="left"
        open={isSidebarOpen}
        onClose={() => dispatch(toggleSidebar())}
        ModalProps={{ keepMounted: true }}
        sx={{
          zIndex: theme.zIndex.appBar - 10,
          "& .MuiDrawer-paper": {
            top: HEADER.MOBILE_HEIGHT,
            height: `calc(100% - ${HEADER.MOBILE_HEIGHT}px)`,
            width: SIDEBAR.EXPANDED_WIDTH,
            borderRadius: 0,
            border: "none",
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
          },
        }}
      >
        {MenuContent}
      </Drawer>
    );
  }

  /**
   * Desktop: render sebagai sidebar tetap
   */
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
        borderRight: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        boxShadow: `2px 0 12px -6px ${alpha(theme.palette.secondary.main, 0.08)}`,
      }}
    >
      {MenuContent}
    </Paper>
  );
};

export default Sidebar;