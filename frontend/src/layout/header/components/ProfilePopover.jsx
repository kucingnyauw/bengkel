/**
 * ProfilePopover - User profile popover with greeting, role, theme toggle, cart access, and logout functionality.
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.open - Popover open state
 * @param {HTMLElement} props.anchorEl - Anchor element
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.user - User data
 * @param {string} [props.user.fullName] - User full name
 * @param {string} [props.user.role] - User role
 * @param {boolean} props.isCashier - Whether user is a cashier
 * @param {Function} [props.onOpenCart] - Handler to open the cart drawer/modal
 *
 * @returns {JSX.Element} Rendered profile popover
 */
import { useSelector, useDispatch } from "react-redux";
import {
  Badge,
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  Stack,
  Switch,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ChevronRight, LogOut, Moon, ShoppingCart, Sun } from "lucide-react";

import { getGreeting } from "@shared/utils";
import { logout } from "@store/auth/authThunk.js";
import { selectAuthLoading } from "@store/auth/authSelector.js";
import { selectThemeMode } from "@store/theme/themeSelector.js";
import { toggleTheme } from "@store/theme/themeSlices.js";
import { selectCartItems } from "@store/cart/cartSelector.js";


const ProfilePopover = ({
  open,
  anchorEl,
  onClose,
  user,
  isCashier,
  onOpenCart,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const isLoading = useSelector(selectAuthLoading);
  const mode = useSelector(selectThemeMode);
  const cartItems = useSelector(selectCartItems);

  const handleLogout = () => {
    dispatch(logout());
    onClose();
  };

  const handleToggleTheme = (event) => {
    event.stopPropagation();
    dispatch(toggleTheme());
  };

  const handleCartClick = () => {
    onClose();
    if (onOpenCart) onOpenCart();
  };

  return (
    <>
    
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              mt: 1.5,
              width: 300,
              borderRadius: `${theme.shape.borderRadius}px`,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[4],
              overflow: "hidden",
              backgroundColor: theme.palette.background.paper,
              backgroundImage: "none",
              p: theme.spacing(2),
            },
          },
        }}
      >
        {/* Header: Greeting + Nama (1 baris) + Role */}
        <Box sx={{ mb: theme.spacing(2) , px : theme.spacing(4) }}>
          <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
            <Box component="span" sx={{ fontWeight: 500 }}>
              {getGreeting()},{" "}
            </Box>
            <Box component="span" sx={{ fontWeight: 400 }}>
              {user?.fullName || "Pengguna"}
            </Box>
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textTransform: "capitalize", mt: 0.5, display: "block", fontWeight: 300 }}
          >
            {user?.role || "—"}
          </Typography>
        </Box>

        <Divider sx={{ mb: theme.spacing(1.5) }} />

        {/* Menu Items */}
        <List sx={{ p: 0 }}>
          {/* Cart Menu - Only visible for Kasir */}
          {isCashier && (
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleCartClick}
                sx={(theme) => ({
                  borderRadius: `${theme.shape.borderRadius}px`,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.secondary.main, 0.06),
                  },
                })}
              >
                <ListItemIcon sx={{ minWidth: 40, mr: 0.5 }}>
                  <Box
                    sx={(theme) => ({
                      width: 32,
                      height: 32,
                      borderRadius: `${theme.shape.borderRadius}px`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: alpha(theme.palette.secondary.main, 0.08),
                      color: theme.palette.secondary.main,
                    })}
                  >
                    <ShoppingCart size={16} strokeWidth={1.5} />
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary="Keranjang Belanja"
                  slotProps={{
                    primary: {
                      variant: "body2",
                      color: "text.primary",
                    },
                  }}
                />
                <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
                  {cartItems.length > 0 && (
                    <Badge
                      badgeContent={cartItems.length}
                      color="error"
                      sx={{
                        "& .MuiBadge-badge": {
                          position: "static",
                          transform: "none",
                          fontSize: "0.625rem",
                          height: 18,
                          minWidth: 18,
                          borderRadius: `${theme.shape.borderRadius}px`,
                        },
                      }}
                    />
                  )}
                  <ChevronRight size={14} strokeWidth={1.5} color={theme.palette.text.disabled} />
                </Stack>
              </ListItemButton>
            </ListItem>
          )}

          {/* Theme Toggle */}
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleToggleTheme}
              sx={(theme) => ({
                borderRadius: `${theme.shape.borderRadius}px`,
                "&:hover": {
                  bgcolor: alpha(theme.palette.secondary.main, 0.06),
                },
              })}
            >
              <ListItemIcon sx={{ minWidth: 40, mr: 0.5 }}>
                <Box
                  sx={(theme) => ({
                    width: 32,
                    height: 32,
                    borderRadius: `${theme.shape.borderRadius}px`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(theme.palette.warning.main, 0.08),
                    color: theme.palette.warning.main,
                  })}
                >
                  {mode === "dark" ? (
                    <Sun size={16} strokeWidth={1.5} />
                  ) : (
                    <Moon size={16} strokeWidth={1.5} />
                  )}
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={mode === "dark" ? "Mode Terang" : "Mode Gelap"}
                slotProps={{
                  primary: {
                    variant: "body2",
                    color: "text.primary",
                  },
                }}
              />
              <Switch
                size="small"
                checked={mode === "dark"}
                onChange={handleToggleTheme}
                onClick={(event) => event.stopPropagation()}
              />
            </ListItemButton>
          </ListItem>
        </List>

        <Divider sx={{ my: theme.spacing(1.5) }} />

        {/* Logout */}
        <List sx={{ p: 0 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              disabled={isLoading}
              sx={(theme) => ({
                borderRadius: `${theme.shape.borderRadius}px`,
                color: theme.palette.error.main,
                "&:hover": {
                  bgcolor: alpha(theme.palette.error.main, 0.08),
                },
              })}
            >
              <ListItemIcon sx={{ minWidth: 40, mr: 0.5, color: "inherit" }}>
                <Box
                  sx={(theme) => ({
                    width: 32,
                    height: 32,
                    borderRadius: `${theme.shape.borderRadius}px`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(theme.palette.error.main, 0.08),
                  })}
                >
                  <LogOut size={16} strokeWidth={1.5} />
                </Box>
              </ListItemIcon>
              <ListItemText
                primary="Keluar"
                slotProps={{
                  primary: {
                    variant: "body2",
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Popover>
    </>
  );
};

export default ProfilePopover;