/**
 * UserResendDialog - Dialog konfirmasi untuk mengirim ulang email verifikasi (magic link).
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {boolean} props.open - Status dialog terbuka
 * @param {Object} props.user - Data user
 * @param {string} [props.user.fullName] - Nama lengkap user
 * @param {string} [props.user.email] - Email user
 * @param {Function} props.onClose - Handler tutup dialog
 *
 * @returns {JSX.Element} Dialog kirim ulang magic link
 */
import { useDispatch } from "react-redux";
import { X } from "lucide-react";

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { useResendMagicLinkMutation } from "@views/users/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const UserResendDialog = ({ open, user, onClose }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const resendMutation = useResendMagicLinkMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: `Magic link berhasil dikirim ke ${user?.email}`,
          type: "success",
          title: "Berhasil",
          variant: "snackbar",
          autoHide: 3000,
        })
      );
      onClose?.();
    },
    onFailed: (error) => {
      dispatch(
        showNotification({
          message: error.message || "Gagal mengirim magic link",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isPending = resendMutation.isPending;

  const handleConfirm = () => {
    if (!user) return;
    resendMutation.mutate(user.id);
  };

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      onClose={isPending ? undefined : onClose}
      open={open}
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${theme.shape.borderRadius}px`,
            border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: 500,
        }}
      >
        Kirim Ulang Magic Link
        <IconButton onClick={onClose} disabled={isPending} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
          Kirim ulang email verifikasi ke{" "}
          <strong>{user?.fullName || "karyawan ini"}</strong>?
        </Typography>
        {user?.email && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, fontWeight: 400 }}>
            {user.email}
          </Typography>
        )}
      </DialogContent>

      <Divider />

      <DialogActions>
        <Button
          color="inherit"
          variant="outlined"
          disabled={isPending}
          onClick={onClose}
          sx={{ fontWeight: 400 }}
        >
          Batal
        </Button>
        <Button
          variant="contained"
          disabled={isPending}
          onClick={handleConfirm}
          startIcon={
            isPending ? <CircularProgress size={14} color="inherit" /> : null
          }
          sx={{
            fontWeight: 400,
            "&:hover": {
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.secondary.main, 0.3)}`,
            },
          }}
        >
          {isPending ? "Mengirim..." : "Ya, Kirim"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserResendDialog;