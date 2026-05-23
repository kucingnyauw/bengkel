import { useState, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Divider,
  IconButton,
  Toolbar,
  Typography,
  useTheme,
  TextField,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Bell, Menu, Moon, ShoppingCart, Sun, Search } from "lucide-react";

import { selectSidebarIsOpen } from "@store/sidebar/sidebarSelector.js";
import { toggleSidebar } from "@store/sidebar/sidebarSlices.js";
import { selectCartItems } from "@store/cart/cartSelector.js";
import { toggleTheme } from "@store/theme/themeSlices.js";
import { selectThemeMode } from "@store/theme/themeSelector.js";
import { selectUser } from "@store/auth/authSelector.js";
import { HEADER, SIDEBAR } from "@shared/constant";
import { useDevice, usePermission } from "@hooks";
import { getAvatarUrl } from "@shared/utils";

import {
  HeaderCart,
  NotificationPopover,
  ProfilePopover,
} from "@layout/header/components";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteAllNotifications,
  useDeleteNotification,
} from "@layout/header/hooks/useNotifications.js";

import INFO from "@data/Info.js";
import { showNotification } from "@store/notifications/notificationsSlice.js";
import { getSearchPages } from "@menu/index.js";

const Header = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isMobile } = useDevice();
  const isCashier = usePermission({ role: "CASHIER" });

  const isOpen = useSelector(selectSidebarIsOpen);
  const items = useSelector(selectCartItems);
  const mode = useSelector(selectThemeMode);
  const user = useSelector(selectUser);

  const [cartOpen, setCartOpen] = useState(false);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const sidebarWidth = isOpen
    ? SIDEBAR.EXPANDED_WIDTH
    : SIDEBAR.COLLAPSED_WIDTH;

  const searchPages = useMemo(() => getSearchPages(user?.role), [user?.role]);

  const filteredPages = useMemo(() => {
    if (!searchVal.trim()) return [];
    const q = searchVal.toLowerCase();
    return searchPages.filter((p) => p.label.toLowerCase().includes(q));
  }, [searchVal, searchPages]);

  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.unreadCount ?? 0;

  const {
    data: notifData,
    isLoading: isNotifLoading,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
    refetch,
  } = useNotifications({ enabled: notifOpen });

  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteAll = useDeleteAllNotifications();
  const deleteOne = useDeleteNotification();

  const handleMarkRead = (id) => markAsRead.mutate(id);
  const handleMarkAllRead = () => markAllAsRead.mutate();

  const handleDelete = (id) => {
    deleteOne.mutate(id, {
      onSuccess: () =>
        dispatch(
          showNotification({
            message: "Notifikasi berhasil dihapus",
            type: "success",
            title: "Berhasil",
            variant: "snackbar",
            autoHide: 2000,
          })
        ),
      onError: (error) =>
        dispatch(
          showNotification({
            message: error.message || "Gagal menghapus notifikasi",
            type: "error",
            title: "Error",
            variant: "snackbar",
            autoHide: 3000,
          })
        ),
    });
  };

  const handleDeleteAll = () => {
    deleteAll.mutate(undefined, {
      onSuccess: () =>
        dispatch(
          showNotification({
            message: "Semua notifikasi berhasil dihapus",
            type: "success",
            title: "Berhasil",
            variant: "snackbar",
            autoHide: 2000,
          })
        ),
      onError: (error) =>
        dispatch(
          showNotification({
            message: error.message || "Gagal menghapus semua notifikasi",
            type: "error",
            title: "Error",
            variant: "snackbar",
            autoHide: 3000,
          })
        ),
    });
  };

  const handleToggleSidebar = () => dispatch(toggleSidebar());
  const handleToggleCart = useCallback(() => {
    if (isCashier) setCartOpen((prev) => !prev);
  }, [isCashier]);
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
  const handleRefresh = () => refetch();

  const iconBtnStyle = {
    border: "1px solid",
    borderColor: alpha(theme.palette.divider, 0.8),
    borderRadius: `${theme.shape.borderRadius}px`,
    color: "text.secondary",
    padding: { xs: "6px", sm: "8px" },
    "&:hover": {
      bgcolor: alpha(theme.palette.secondary.main, 0.06),
      borderColor: alpha(theme.palette.secondary.main, 0.4),
      color: theme.palette.secondary.main,
    },
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: "100%",
          height: isMobile ? HEADER.MOBILE_HEIGHT : HEADER.DESKTOP_HEIGHT,
          justifyContent: "center",
          bgcolor: "background.paper",
          borderBottom: `1px solid ${theme.palette.divider}`,
          zIndex: theme.zIndex.appBar,
        }}
      >
        <Toolbar
          sx={{
            minHeight: `${
              isMobile ? HEADER.MOBILE_HEIGHT : HEADER.DESKTOP_HEIGHT
            }px !important`,
            pl: { xs: 1.5, sm: 2, md: 0 },
            pr: { xs: 1.5, sm: 2, md: 2 },
            display: "flex",
            gap: { xs: 1, sm: 2 },
          }}
        >
          {/* LEFT BOX */}
          <Box
            sx={{
              display: showMobileSearch ? "none" : "flex",
              alignItems: "center",
              gap: 1,
              width: { xs: "auto", md: `${sidebarWidth}px` },
              transition: "width 0.3s ease, padding 0.3s ease",
              justifyContent: {
                xs: "flex-start",
                md: isOpen ? "flex-start" : "center",
              },
              pl: { xs: 0, md: isOpen ? 3 : 0 },
              pr: { xs: 0, md: isOpen ? 2 : 0 },
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src={INFO.logoUrl}
              alt={INFO.name}
              sx={{
                display: { xs: "none", md: isOpen ? "block" : "none" },
                height: 40,
                width: "auto",
                maxWidth: 120,
                objectFit: "contain",
                flexShrink: 0,
              }}
            />
            <IconButton
              onClick={handleToggleSidebar}
              size="small"
              sx={{
                ...iconBtnStyle,
                ml: { xs: 0, md: isOpen ? "auto" : 0 },
                flexShrink: 0,
              }}
            >
              <Menu size={18} strokeWidth={1.5} />
            </IconButton>
          </Box>

          {/* CENTER BOX (Search Bar) */}
          <Box
            sx={{
              flex: 1,
              display: { xs: showMobileSearch ? "flex" : "none", md: "flex" },
              justifyContent: { xs: "flex-start", md: "center" },
              position: "relative",
              minWidth: 0,
            }}
          >
            <TextField
              fullWidth
              size="small"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Cari halaman..."
              slotProps={{
                input: {
                  startAdornment: (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 26,
                        borderRadius: `${theme.shape.borderRadius}px`,
                        bgcolor: alpha(theme.palette.secondary.main, 0.08),
                        color: theme.palette.secondary.main,
                        mr: 1,
                      }}
                    >
                      <Search size={14} strokeWidth={1.5} />
                    </Box>
                  ),
                },
              }}
              sx={{ maxWidth: { xs: "100%", md: 320 } }}
            />
            {filteredPages.length > 0 && (
              <Box
                sx={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: { xs: 0, md: "50%" },
                  transform: { xs: "none", md: "translateX(-50%)" },
                  width: "100%",
                  maxWidth: { xs: "100%", md: 320 },
                  bgcolor: "background.paper",
                  borderRadius: `${theme.shape.borderRadius}px`,
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: `0 8px 24px ${alpha(
                    theme.palette.common.black,
                    0.1
                  )}`,
                  maxHeight: 320,
                  overflowY: "auto",
                  zIndex: theme.zIndex.appBar + 1,
                }}
              >
                {filteredPages.map((page) => (
                  <Box
                    key={page.path}
                    onClick={() => {
                      navigate(page.path);
                      setSearchVal("");
                      setShowMobileSearch(false);
                    }}
                    sx={{
                      px: 2,
                      py: 1.25,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      transition: "background-color 0.15s ease",
                      "&:hover": {
                        bgcolor: alpha(theme.palette.secondary.main, 0.06),
                      },
                      "&:not(:last-child)": {
                        borderBottom: `1px solid ${alpha(
                          theme.palette.divider,
                          0.4
                        )}`,
                      },
                    }}
                  >
                    <Typography variant="body2">{page.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {page.path}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* SPACER: Berfungsi mendorong ikon ke kanan saat layar kecil & search tertutup */}
          <Box
            sx={{
              flexGrow: 1,
              display: { xs: showMobileSearch ? "none" : "block", md: "none" },
            }}
          />

          {/* RIGHT BOX (Action Icons) */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: { xs: 0.5, sm: 1.5 },
              flexShrink: 0,
            }}
          >
            <IconButton
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              sx={{
                ...iconBtnStyle,
                display: { xs: "inline-flex", md: "none" },
              }}
            >
              <Search size={18} strokeWidth={1.5} />
            </IconButton>
            <IconButton
              onClick={handleToggleTheme}
              sx={{
                ...iconBtnStyle,
                display: { xs: "none", sm: "inline-flex" },
              }}
            >
              {mode === "dark" ? (
                <Sun size={18} strokeWidth={1.5} />
              ) : (
                <Moon size={18} strokeWidth={1.5} />
              )}
            </IconButton>
            <IconButton onClick={handleNotifOpen} sx={iconBtnStyle}>
              <Badge
                badgeContent={unreadCount}
                color="error"
                invisible={unreadCount === 0}
                sx={{
                  "& .MuiBadge-badge": {
                    fontSize: "0.625rem",
                    height: 16,
                    minWidth: 16,
                  },
                }}
              >
                <Bell size={18} strokeWidth={1.5} />
              </Badge>
            </IconButton>
            {isCashier && (
              <IconButton
                onClick={handleToggleCart}
                sx={{
                  ...iconBtnStyle,
                  display: { xs: "none", sm: "inline-flex" },
                }}
              >
                <Badge
                  badgeContent={items.length}
                  color="error"
                  invisible={items.length === 0}
                  sx={{
                    "& .MuiBadge-badge": {
                      fontSize: "0.625rem",
                      height: 16,
                      minWidth: 16,
                    },
                  }}
                >
                  <ShoppingCart size={18} strokeWidth={1.5} />
                </Badge>
              </IconButton>
            )}
            <Divider
              orientation="vertical"
              flexItem
              sx={{ height: 24, alignSelf: "center", mx: { xs: 0.5, sm: 0.5 } }}
            />
            <Avatar
              onClick={handleProfileOpen}
              src={getAvatarUrl(user?.fullName)}
              sx={{
                width: { xs: 30, sm: 36 },
                height: { xs: 30, sm: 36 },
                cursor: "pointer",
                border: "1px solid",
                borderRadius: "50%",
                borderColor: alpha(theme.palette.divider, 0.8),
                flexShrink: 0,
                "&:hover": {
                  borderColor: alpha(theme.palette.secondary.main, 0.4),
                },
              }}
            />
          </Box>
        </Toolbar>
      </AppBar>

      {isCashier && <HeaderCart open={cartOpen} onClose={handleToggleCart} />}
      <ProfilePopover
        open={Boolean(profileAnchorEl)}
        anchorEl={profileAnchorEl}
        onClose={handleProfileClose}
        user={user}
        isCashier={isCashier}
        onOpenCart={handleToggleCart}
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
          onMarkAllRead={handleMarkAllRead}
          onDeleteAll={handleDeleteAll}
          onDelete={handleDelete}
          unreadCount={unreadCount}
          onRefresh={handleRefresh}
        />
      )}
    </>
  );
};

export default Header;