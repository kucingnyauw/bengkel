/**
 * NotificationHandler - Global notification handler supporting snackbar and dialog variants.
 *
 * @component
 * @returns {JSX.Element|null} Rendered notification or null
 */
import { RotateCcw, X } from "lucide-react";
import {
  Snackbar,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton,
  Stack,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";

import { hideNotification } from "@store/notifications/notificationsSlice.js";
import {
  selectNotificationOpen,
  selectNotificationMessage,
  selectNotificationType,
  selectNotificationTitle,
  selectNotificationVariant,
  selectNotificationAutoHide,
} from "@store/notifications/notificationsSelector.js";

const NotificationHandler = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const open = useSelector(selectNotificationOpen);
  const type = useSelector(selectNotificationType) || "info";
  const title = useSelector(selectNotificationTitle);
  const message = useSelector(selectNotificationMessage);
  const variant = useSelector(selectNotificationVariant);
  const autoHide = useSelector(selectNotificationAutoHide);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") return;
    dispatch(hideNotification());
  };

  const handleRefresh = () => {
    dispatch(hideNotification());
    window.location.reload();
  };

  if (!open) return null;

  if (variant === "dialog") {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
      >
        {title && (
          <DialogTitle
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              pb: 1.5,
            }}
          >
            {title}
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{
                color: "text.secondary",
                mr: -1,
                "&:hover": { bgcolor: alpha(theme.palette.secondary.main, 0.08) },
              }}
            >
              <X size={18} strokeWidth={2} />
            </IconButton>
          </DialogTitle>
        )}

        <DialogContent dividers={!!title} sx={{ py: 3 }}>
          <DialogContentText color="text.primary" sx={{ lineHeight: 1.6 }}>
            {message}
          </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Stack
            direction="row"
            sx={{ width: "100%", justifyContent: "space-between", alignItems: "center" }}
          >
            <Button
              color="inherit"
              onClick={handleRefresh}
              startIcon={<RotateCcw size={16} strokeWidth={1.5} />}
              sx={{
                color: "text.secondary",
                "&:hover": { color: "text.primary", bgcolor: "transparent" },
              }}
            >
              Segarkan
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={handleClose}
              color={type === "error" ? "error" : "primary"}
            >
              Tutup
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHide}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert
        severity={type}
        variant="standard"
        sx={{
          minWidth: 320,
          borderRadius: 2,
          boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.12)}`,
          border: "1px solid",
          borderColor: alpha(theme.palette[type].main, 0.15),
          bgcolor: theme.palette.background.paper,
          color: "text.primary",
          alignItems: title ? "flex-start" : "center",
          "& .MuiAlert-icon": {
            color: theme.palette[type].main,
            opacity: 0.9,
          },
          "& .MuiAlert-message": {
            flex: 1,
          },
        }}
      >
        {title && <AlertTitle sx={{ mb: 0.5 }}>{title}</AlertTitle>}
        {message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationHandler;