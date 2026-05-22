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
    <Skeleton variant="rounded" height={160} sx={{ borderRadius: 2 }} />
    <Skeleton variant="rounded" height={100} sx={{ borderRadius: 2 }} />
    <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2 }} />
  </Stack>
);

const UserDetailDialog = ({ open, userId, onClose }) => {
  const theme = useTheme();
  const { data: user, isLoading } = useUserDetailQuery(userId, open);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
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
          fontWeight: 400,
        }}
      >
        Detail Karyawan
        <IconButton onClick={onClose} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {isLoading ? (
          <DetailSkeleton />
        ) : user ? (
          <Stack sx={{ gap: 3 }}>
            {/* Header Info */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                bgcolor: alpha(theme.palette.secondary.main, 0.02),
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: `${theme.shape.borderRadius}px`,
                    bgcolor: alpha(theme.palette.secondary.main, 0.08),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    fontWeight: 400,
                    color: theme.palette.secondary.main,
                    mx: "auto",
                    mb: 1.5,
                  }}
                >
                  {user.fullName?.charAt(0)?.toUpperCase()}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 400 }}>
                  {user.fullName}
                </Typography>
                <Stack direction="row" sx={{ gap: 1, justifyContent: "center", mt: 1 }}>
                  <Chip
                    label={normalizeEnumText(user.role)}
                    size="small"
                    variant="outlined"
                    color={roleColorMap[user.role] || "default"}
                    sx={{ fontWeight: 400 }}
                  />
                  <Chip
                    label={user.isActive ? "Aktif" : "Nonaktif"}
                    color={user.isActive ? "success" : "default"}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 400 }}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Informasi Kontak */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ py: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 400 }}>
                  Informasi Kontak
                </Typography>
                <Stack sx={{ gap: 1.5 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Email
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {user.email}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Telepon
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {user.phone || "—"}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Informasi Sistem */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ py: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 400 }}>
                  Informasi Sistem
                </Typography>
                <Stack sx={{ gap: 1.5 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      ID User
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                      {user.id}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Tanggal Dibuat
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {formatDateTime(user.createdAt)}
                    </Typography>
                  </Stack>
                  {user.updatedAt && (
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                        Terakhir Diupdate
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 400 }}>
                        {formatDateTime(user.updatedAt)}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4, fontWeight: 400 }}>
            Data tidak ditemukan
          </Typography>
        )}
      </DialogContent>

      <Divider />

      <DialogActions>
        <Button variant="outlined" onClick={onClose} sx={{ fontWeight: 400 }}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDetailDialog;