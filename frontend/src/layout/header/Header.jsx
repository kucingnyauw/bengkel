/**
 * Header - Application header with sidebar toggle, theme switcher, notifications, cart, and profile.
 * Hanya dirender ketika user sudah terautentikasi (status: "auth")
 *
 * @component
 * @returns {JSX.Element} Rendered header component
 */
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

import { HeaderCart, NotificationPopover, ProfilePopover } from "./components";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteAllNotifications,
  useDeleteNotification,
} from "./hooks/useNotifications.js";

import INFO from "@data/Info.js";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const searchPages = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Point of Sale", path: "/pos" },
  { label: "Pesanan Aktif", path: "/orders" },
  { label: "Riwayat Pesanan", path: "/orders/history" },
  { label: "Pelanggan", path: "/customers" },
  { label: "Kendaraan", path: "/vehicles" },
  { label: "Semua Tugas", path: "/tasks" },
  { label: "Tugas Saya", path: "/tasks/mechanic" },
  { label: "Riwayat Tugas", path: "/tasks/history" },
  { label: "Tugas Belum Ditugaskan", path: "/tasks/unassigned" },
  { label: "Mekanik Tersedia", path: "/tasks/mechanics/available" },
  { label: "Daftar Produk", path: "/products" },
  { label: "Mutasi Stok", path: "/stock/movements" },
  { label: "Pembayaran", path: "/payments" },
  { label: "Pengeluaran", path: "/expenses" },
  { label: "Riwayat Pengeluaran", path: "/expenses/history" },
  { label: "Shift Saya", path: "/shifts" },
  { label: "Semua Shift", path: "/shifts/all" },
  { label: "Laporan Penjualan", path: "/reports/sales" },
  { label: "Laba & Rugi", path: "/reports/profitloss" },
  { label: "Laporan Inventaris", path: "/reports/inventory" },
  { label: "Laporan Mekanik", path: "/reports/mechanics" },
  { label: "Laporan Pengeluaran", path: "/reports/expenses" },
  { label: "Laporan Pembayaran", path: "/reports/payments" },
  { label: "Karyawan", path: "/users" },
  { label: "Pengaturan", path: "/settings" },
];

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

  const filteredPages = useMemo(() => {
    if (!searchVal.trim()) return [];
    const q = searchVal.toLowerCase();
    return searchPages.filter((p) => p.label.toLowerCase().includes(q));
  }, [searchVal]);

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

  /** Inisialisasi mutation hooks */
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteAll = useDeleteAllNotifications();
  const deleteOne = useDeleteNotification();

  const handleMarkRead = (id) => {
    markAsRead.mutate(id, {
      onSuccess: () => {
        dispatch(
          showNotification({
            message: "Notifikasi ditandai sudah dibaca",
            type: "success",
            title: "Berhasil",
            variant: "snackbar",
            autoHide: 2000,
          })
        );
      },
      onError: (error) => {
        dispatch(
          showNotification({
            message: error.message || "Gagal menandai notifikasi",
            type: "error",
            title: "Error",
            variant: "snackbar",
            autoHide: 3000,
          })
        );
      },
    });
  };

  const handleDelete = (id) => {
    deleteOne.mutate(id, {
      onSuccess: () => {
        dispatch(
          showNotification({
            message: "Notifikasi berhasil dihapus",
            type: "success",
            title: "Berhasil",
            variant: "snackbar",
            autoHide: 2000,
          })
        );
      },
      onError: (error) => {
        dispatch(
          showNotification({
            message: error.message || "Gagal menghapus notifikasi",
            type: "error",
            title: "Error",
            variant: "snackbar",
            autoHide: 3000,
          })
        );
      },
    });
  };

  const handleDeleteAll = () => {
    deleteAll.mutate(undefined, {
      onSuccess: () => {
        dispatch(
          showNotification({
            message: "Semua notifikasi berhasil dihapus",
            type: "success",
            title: "Berhasil",
            variant: "snackbar",
            autoHide: 2000,
          })
        );
      },
      onError: (error) => {
        dispatch(
          showNotification({
            message: error.message || "Gagal menghapus semua notifikasi",
            type: "error",
            title: "Error",
            variant: "snackbar",
            autoHide: 3000,
          })
        );
      },
    });
  };

  const handleMarkAllRead = () => {
    markAllAsRead.mutate(undefined, {
      onSuccess: () => {
        dispatch(
          showNotification({
            message: "Semua notifikasi ditandai sudah dibaca",
            type: "success",
            title: "Berhasil",
            variant: "snackbar",
            autoHide: 2000,
          })
        );
      },
      onError: (error) => {
        dispatch(
          showNotification({
            message: error.message || "Gagal menandai semua notifikasi",
            type: "error",
            title: "Error",
            variant: "snackbar",
            autoHide: 3000,
          })
        );
      },
    });
  };

  const handleToggleSidebar = () => dispatch(toggleSidebar());

  const handleToggleCart = useCallback(() => {
    if (isCashier) {
      setCartOpen((prev) => !prev);
    }
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
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Toolbar
          sx={{
            minHeight: `${
              isMobile ? HEADER.MOBILE_HEIGHT : HEADER.DESKTOP_HEIGHT
            }px !important`,
            pl: { xs: 2, md: 0 },
            pr: { xs: 2, sm: 3, md: 2 },
            display: "flex",
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: showMobileSearch ? "none" : "flex",
              alignItems: "center",
              gap: 1.5,
              width: { xs: "auto", md: `${sidebarWidth}px` },
              transition: "width 0.3s ease, padding 0.3s ease",
              justifyContent: { xs: "flex-start", md: isOpen ? "flex-start" : "center" },
              pl: { xs: 0, md: isOpen ? 3 : 0 },
              pr: { xs: 0, md: isOpen ? 2 : 0 },
            }}
          >
           <Box
  component="img"
  src={INFO.logoUrl}
  alt={INFO.name}
  sx={{
    display: { xs: "none", md: isOpen ? "block" : "none" },
    height: 47,
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

          <Box
            sx={{
              flex: 1,
              display: { xs: showMobileSearch ? "flex" : "none", md: "flex" },
              justifyContent: { xs: "flex-start", md: "center" },
              position: "relative",
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
                        width: 40,
                        height: 28,
                        borderRadius: `${theme.shape.borderRadius}px`,
                        bgcolor: alpha(theme.palette.secondary.main, 0.08),
                        color: theme.palette.secondary.main,
                        mr: 1,
                      }}
                    >
                      <Search size={14} strokeWidth={1.5} />
                    </Box>
                  ),
                  sx: { fontWeight: 400, borderRadius: 2 },
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
                  border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                  boxShadow: `0 8px 24px ${alpha(
                    theme.palette.common.black,
                    0.1
                  )}`,
                  maxHeight: 320,
                  overflowY: "auto",
                  zIndex: 1300,
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
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {page.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 400 }}
                    >
                      {page.path}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: { xs: 1, sm: 1.5 },
              flexGrow: { xs: showMobileSearch ? 0 : 1, md: 0 },
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
              sx={{ height: 24, alignSelf: "center", mx: { xs: 0, sm: 0.5 } }}
            />

            <Avatar
              onClick={handleProfileOpen}
              src={getAvatarUrl(user?.fullName)}
              sx={{
                width: { xs: 32, sm: 36 },
                height: { xs: 32, sm: 36 },
                cursor: "pointer",
                border: "1px solid",
                borderRadius: "50%",
                borderColor: alpha(theme.palette.divider, 0.8),
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