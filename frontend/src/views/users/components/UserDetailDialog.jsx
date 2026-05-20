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
} from "@mui/material";

import { formatDateTime } from "@shared/utils/format.js";
import { useUserDetailQuery } from "@views/users/hooks";

const DetailSkeleton = () => (
  <Stack spacing={3}>
    <Skeleton variant="rounded" height={120} />
    <Skeleton variant="rounded" height={100} />
    <Skeleton variant="rounded" height={80} />
  </Stack>
);

const UserDetailDialog = ({ open, userId, onClose }) => {
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
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {isLoading ? (
          <DetailSkeleton />
        ) : user ? (
          <Stack spacing={3}>
            {/* Header Info */}
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    bgcolor: "action.hover",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "text.primary",
                    mx: "auto",
                    mb: 1.5,
                  }}
                >
                  {user.fullName?.charAt(0)?.toUpperCase()}
                </Box>
                <Typography variant="h6" fontWeight={700}>
                  {user.fullName}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ justifyContent: "center", mt: 1 }}>
                  <Chip
                    label={user.role === "CASHIER" ? "Kasir" : "Mekanik"}
                    size="small"
                    variant="outlined"
                    color={user.role === "CASHIER" ? "primary" : "warning"}
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
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  Informasi Kontak
                </Typography>
                <Stack spacing={1.5}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body2" fontWeight={500}>{user.email}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Telepon</Typography>
                    <Typography variant="body2" fontWeight={600}>{user.phone || "—"}</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Informasi Sistem */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  Informasi Sistem
                </Typography>
                <Stack spacing={1.5}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">ID User</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.id}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Tanggal Dibuat</Typography>
                    <Typography variant="body2" fontWeight={500}>{formatDateTime(user.createdAt)}</Typography>
                  </Stack>
                  {user.updatedAt && (
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Terakhir Diupdate</Typography>
                      <Typography variant="body2" fontWeight={500}>{formatDateTime(user.updatedAt)}</Typography>
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
            Data tidak ditemukan
          </Typography>
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