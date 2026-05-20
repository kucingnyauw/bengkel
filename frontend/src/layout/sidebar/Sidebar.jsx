import { useEffect } from "react";
import { Box, Drawer, Paper, Skeleton, Stack } from "@mui/material";
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
import { selectAuthLoading, selectUser } from "@store/auth/authSelector.js";
import { filterMenuByRole, menuItems } from "@menu/index.js";
import { useDevice } from "@hooks/useDevice.js";

import MenuItem from "@layout/sidebar/MenuItem.jsx";

const SidebarSkeleton = ({ isSidebarOpen }) => (
  <Box
    sx={{
      flexGrow: 1,
      overflow: "hidden",
      px: isSidebarOpen ? 2 : 1,
      py: 2.5,
      display: "flex",
      flexDirection: "column",
      gap: 0.5,
    }}
  >
    <Box sx={{ mt: 2.5, mb: 0.5 }}>
      {isSidebarOpen && (
        <Skeleton
          width={60}
          height={10}
          sx={{ mb: 1.5, ml: 2, borderRadius: 1 }}
        />
      )}
      <Stack sx={{ gap: 0.5 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={44}
            sx={{ borderRadius: 1 }}
          />
        ))}
      </Stack>
    </Box>

    <Skeleton height={1} sx={{ mx: 2, my: 1.5, borderRadius: 0.5 }} />

    <Box sx={{ mt: isSidebarOpen ? 2.5 : 0.5, mb: 0.5 }}>
      {isSidebarOpen && (
        <Skeleton
          width={80}
          height={10}
          sx={{ mb: 1.5, ml: 2, borderRadius: 1 }}
        />
      )}
      <Stack sx={{ gap: 0.5 }}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={44}
            sx={{ borderRadius: 1 }}
          />
        ))}
      </Stack>
    </Box>

    <Skeleton height={1} sx={{ mx: 2, my: 1.5, borderRadius: 0.5 }} />

    <Box sx={{ mt: isSidebarOpen ? 2.5 : 0.5, mb: 0.5 }}>
      {isSidebarOpen && (
        <Skeleton
          width={50}
          height={10}
          sx={{ mb: 1.5, ml: 2, borderRadius: 1 }}
        />
      )}
      <Stack sx={{ gap: 0.5 }}>
        {[1, 2].map((i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={44}
            sx={{ borderRadius: 1 }}
          />
        ))}
      </Stack>
    </Box>
  </Box>
);

/**
 * Sidebar - Application sidebar with menu items, responsive drawer for mobile, and role-based filtering.
 *
 * @component
 * @returns {JSX.Element} Rendered sidebar component
 */
const Sidebar = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const location = useLocation();
  const isLoading = useSelector(selectAuthLoading);
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

  const MenuContent = isLoading ? (
    <SidebarSkeleton isSidebarOpen={isSidebarOpen} />
  ) : (
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