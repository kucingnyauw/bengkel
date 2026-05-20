/**
 * Header - Application header with sidebar toggle, theme switcher, notifications, cart, and profile.
 *
 * @component
 * @returns {JSX.Element} Rendered header component
 */
import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Toolbar,
  Typography,
  keyframes,
  useTheme
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Bell, Menu, Moon, ShoppingCart, Sun } from "lucide-react";

import { selectSidebarIsOpen } from "@store/sidebar/sidebarSelector.js";
import { toggleSidebar } from "@store/sidebar/sidebarSlices.js";
import {
  selectCartItems,
  selectIsItemAdded,
} from "@store/cart/cartSelector.js";
import { resetItemAdded } from "@store/cart/cartSlices.js";
import { toggleTheme } from "@store/theme/themeSlices.js";
import { selectThemeMode } from "@store/theme/themeSelector.js";
import { selectAuthLoading, selectUser } from "@store/auth/authSelector.js";
import { HEADER, SIDEBAR } from "@shared/constant";
import { useDevice } from "@hooks";
import { getAvatarUrl } from "@shared/utils";

import { HeaderCart, NotificationPopover, ProfilePopover } from "./components";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteAllNotifications,
  useDeleteNotification,
} from "./hooks/useNotifications.js";

const bounce = keyframes`
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.3); }
  50% { transform: scale(0.9); }
  75% { transform: scale(1.1); }
`;

const Header = () => {
  const dispatch = useDispatch();
  const { isMobile } = useDevice();

  const isOpen = useSelector(selectSidebarIsOpen);
  const items = useSelector(selectCartItems);
  const mode = useSelector(selectThemeMode);
  const isItemAdded = useSelector(selectIsItemAdded);
  const user = useSelector(selectUser);
  const isAuthLoading = useSelector(selectAuthLoading);

  const [cartOpen, setCartOpen] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);

  const sidebarWidth = isOpen ? SIDEBAR.EXPANDED_WIDTH : SIDEBAR.COLLAPSED_WIDTH;

  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.unreadCount ?? 0;

  const {
    data: notifData,
    isLoading: isNotifLoading,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useNotifications({ enabled: notifOpen });

  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteAll = useDeleteAllNotifications();
  const deleteOne = useDeleteNotification();

  useEffect(() => {
    if (isItemAdded) {
      setIsBouncing(true);
      const timer = setTimeout(() => {
        setIsBouncing(false);
        dispatch(resetItemAdded());
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isItemAdded, dispatch]);

  const handleToggleSidebar = () => dispatch(toggleSidebar());
  const handleToggleCart = useCallback(() => setCartOpen((prev) => !prev), []);
  const handleToggleTheme = () => dispatch(toggleTheme());
  const handleProfileOpen = (e) => setProfileAnchorEl(e.currentTarget);
  const handleProfileClose = () => setProfileAnchorEl(null);

  const handleNotifOpen = (e) => {
    setNotifAnchorEl(e.currentTarget);
    setNotifOpen(true);
  };

  const handleNotifClose = () => {
    setNotifAnchorEl(null);
    setNotifOpen(false);
  };

  const handleMarkRead = (id) => markAsRead.mutate(id);
  const handleDelete = (id) => deleteOne.mutate(id);

  if (isAuthLoading) {
    return (
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: "100%",
          height: isMobile ? HEADER.MOBILE_HEIGHT : HEADER.DESKTOP_HEIGHT,
          justifyContent: "center",
          border: "none",
        }}
      >
        <Toolbar
          sx={{
            minHeight: `${isMobile ? HEADER.MOBILE_HEIGHT : HEADER.DESKTOP_HEIGHT}px !important`,
            px: "0 !important",
          }}
        >
          <Box sx={{ width: "100%", display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                width: `${SIDEBAR.COLLAPSED_WIDTH}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 2,
              }}
            >
              <Skeleton variant="circular" width={32} height={32} />
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2 }}>
              <Skeleton variant="circular" width={36} height={36} />
              <Skeleton variant="circular" width={36} height={36} />
              <Skeleton variant="circular" width={36} height={36} />
              <Box sx={{ mx: 0.5 }}>
                <Skeleton width={1} height={24} />
              </Box>
              <Skeleton variant="circular" width={28} height={28} />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: "100%",
          height: isMobile ? HEADER.MOBILE_HEIGHT : HEADER.DESKTOP_HEIGHT,
          justifyContent: "center",
          border: "none",
        }}
      >
        <Toolbar
          sx={{
            minHeight: `${isMobile ? HEADER.MOBILE_HEIGHT : HEADER.DESKTOP_HEIGHT}px !important`,
            px: "0 !important",
          }}
        >
          <Box sx={{ width: "100%", display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                width: `${sidebarWidth}px`,
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 0.5,
                transition: "width 0.3s ease",
                overflow: "hidden",
                justifyContent: isOpen ? "space-between" : "center",
              }}
            >
              {isOpen && !isMobile && (
                <Typography variant="h6" fontWeight={700} noWrap>
                  BENGKEL
                </Typography>
              )}
              <IconButton
                onClick={handleToggleSidebar}
                size="small"
                sx={{
                  border: "1px solid",
                  borderColor: alpha(useTheme().palette.divider, 0.8),
                  color: "text.secondary",
                  "&:hover": {
                    bgcolor: alpha(useTheme().palette.text.primary, 0.06),
                    borderColor: "text.primary",
                    color: "text.primary",
                  },
                }}
              >
                <Menu size={18} />
              </IconButton>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 0.5 }}>
              <IconButton
                onClick={handleToggleTheme}
                sx={{
                  border: "1px solid",
                  borderColor: (t) => alpha(t.palette.divider, 0.8),
                  color: "text.secondary",
                  "&:hover": {
                    bgcolor: (t) => alpha(t.palette.text.primary, 0.06),
                    borderColor: "text.primary",
                    color: "text.primary",
                  },
                }}
              >
                {mode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </IconButton>

              <IconButton
                onClick={handleNotifOpen}
                sx={{
                  border: "1px solid",
                  borderColor: (t) => alpha(t.palette.divider, 0.8),
                  color: "text.secondary",
                  "&:hover": {
                    bgcolor: (t) => alpha(t.palette.text.primary, 0.06),
                    borderColor: "text.primary",
                    color: "text.primary",
                  },
                }}
              >
                <Badge
                  badgeContent={unreadCount}
                  color="error"
                  invisible={unreadCount === 0}
                  sx={{ "& .MuiBadge-badge": { fontSize: "0.625rem", height: 16, minWidth: 16 } }}
                >
                  <Bell size={18} />
                </Badge>
              </IconButton>

              <IconButton
                onClick={handleToggleCart}
                sx={{
                  border: "1px solid",
                  borderColor: (t) => alpha(t.palette.divider, 0.8),
                  color: "text.secondary",
                  animation: isBouncing ? `${bounce} 0.6s ease` : "none",
                  "&:hover": {
                    bgcolor: (t) => alpha(t.palette.text.primary, 0.06),
                    borderColor: "text.primary",
                    color: "text.primary",
                  },
                }}
              >
                <Badge
                  badgeContent={items.length}
                  color="error"
                  invisible={items.length === 0}
                  sx={{ "& .MuiBadge-badge": { fontSize: "0.625rem", height: 16, minWidth: 16 } }}
                >
                  <ShoppingCart size={18} />
                </Badge>
              </IconButton>

              <Divider
                orientation="vertical"
                flexItem
                sx={{ height: 24, alignSelf: "center", mx: 0.5 }}
              />

              <Avatar
                onClick={handleProfileOpen}
                src={getAvatarUrl(user?.fullName)}
                sx={{
                  width: 36,
                  height: 36,
                  cursor: "pointer",
                  border: "1px solid",
                  borderColor: (t) => alpha(t.palette.divider, 0.8),
                  "&:hover": {
                    borderColor: "text.primary",
                  },
                }}
              />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <HeaderCart open={cartOpen} onClose={handleToggleCart} />

      <ProfilePopover
        open={Boolean(profileAnchorEl)}
        anchorEl={profileAnchorEl}
        onClose={handleProfileClose}
        user={user}
      />

      {notifOpen && (
        <NotificationPopover
          open={Boolean(notifAnchorEl)}
          anchorEl={notifAnchorEl}
          onClose={handleNotifClose}
          notifications={notifData}
          isLoading={isNotifLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          onFetchNextPage={fetchNextPage}
          onMarkRead={handleMarkRead}
          onMarkAllRead={() => markAllAsRead.mutate()}
          onDeleteAll={() => deleteAll.mutate()}
          onDelete={handleDelete}
          unreadCount={unreadCount}
        />
      )}
    </>
  );
};

export default Header;