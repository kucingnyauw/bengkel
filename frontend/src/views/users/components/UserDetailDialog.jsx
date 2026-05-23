/**
 * UserDetailDialog - Dialog detail untuk menampilkan informasi lengkap karyawan/user.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {string|number} props.userId - ID User untuk mengambil detail
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 *
 * @returns {JSX.Element} Dialog detail user
 */
import { X } from "lucide-react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { formatDateTime, normalizeEnumText } from "@shared/utils";
import { roleColorMap } from "@shared/constant";
import { useUserDetailQuery } from "@views/users/hooks";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 3 }}>
    <Skeleton variant="rounded" height={160} />
    <Skeleton variant="rounded" height={100} />
    <Skeleton variant="rounded" height={80} />
  </Stack>
);

const DetailRow = ({ label, value, valueVariant }) => (
  <Stack
    direction="row"
    sx={{ justifyContent: "space-between", alignItems: "center" }}
  >
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant={valueVariant || "body2"}>
      {value}
    </Typography>
  </Stack>
);

const UserDetailDialog = ({ open, userId, onClose }) => {
  const theme = useTheme();
  const { data: user, isLoading } = useUserDetailQuery(userId, open);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Detail Karyawan
        <IconButton onClick={onClose} size="small" sx={{ mr: -0.5 }}>
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {isLoading ? (
          <DetailSkeleton />
        ) : user ? (
          <Stack sx={{ gap: theme.spacing(3) }}>
            {/* Header Info */}
            <Card
              sx={(theme) => ({
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                bgcolor: alpha(theme.palette.secondary.main, 0.02),
                boxShadow: "none",
              })}
            >
              <CardContent sx={{ textAlign: "center", py: theme.spacing(3) }}>
                <Box
                  sx={(theme) => ({
                    width: 64,
                    height: 64,
                    borderRadius: `${theme.shape.borderRadius}px`,
                    bgcolor: alpha(theme.palette.secondary.main, 0.08),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    color: theme.palette.secondary.main,
                    mx: "auto",
                    mb: theme.spacing(1.5),
                  })}
                >
                  {user.fullName?.charAt(0)?.toUpperCase()}
                </Box>
                <Typography variant="h6">{user.fullName}</Typography>
                <Stack
                  direction="row"
                  sx={{
                    gap: theme.spacing(1),
                    justifyContent: "center",
                    mt: theme.spacing(1),
                  }}
                >
                  <Chip
                    label={normalizeEnumText(user.role)}
                    size="small"
                    variant="outlined"
                    color={roleColorMap[user.role] || "default"}
                  />
                  <Chip
                    label={user.isActive ? "Aktif" : "Nonaktif"}
                    color={user.isActive ? "success" : "default"}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Informasi Kontak */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: theme.spacing(2) }}>
                  Informasi Kontak
                </Typography>
                <Stack sx={{ gap: theme.spacing(1.5) }}>
                  <DetailRow label="Email" value={user.email} />
                  <DetailRow label="Telepon" value={user.phone || "—"} />
                </Stack>
              </CardContent>
            </Card>

            {/* Informasi Sistem */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: theme.spacing(2) }}>
                  Informasi Sistem
                </Typography>
                <Stack sx={{ gap: theme.spacing(1.5) }}>
                  <DetailRow
                    label="ID User"
                    value={user.id}
                    valueVariant="caption"
                  />
                  <DetailRow
                    label="Tanggal Dibuat"
                    value={formatDateTime(user.createdAt)}
                  />
                  {user.updatedAt && (
                    <DetailRow
                      label="Terakhir Diupdate"
                      value={formatDateTime(user.updatedAt)}
                    />
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: theme.spacing(4),
              gap: theme.spacing(1),
            }}
          >
            <Typography variant="body1" color="text.secondary">
              Data tidak ditemukan
            </Typography>
            <Typography variant="caption" color="text.disabled">
              User mungkin telah dihapus atau ID tidak valid
            </Typography>
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDetailDialog;