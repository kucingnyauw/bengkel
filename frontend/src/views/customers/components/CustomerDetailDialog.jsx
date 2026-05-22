/**
 * CustomerDetailDialog - Dialog detail untuk menampilkan informasi lengkap customer,
 * termasuk kendaraan dan riwayat order.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {string|number} props.customerId - ID customer untuk mengambil detail
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 *
 * @returns {JSX.Element} Dialog detail customer
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
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import { formatDateTime } from "@shared/utils";
import { useCustomerDetailQuery } from "@views/customers/hooks";

const DetailSkeleton = () => (
  <Stack spacing={3}>
    <Skeleton variant="rounded" height={100} />
    <Skeleton variant="rounded" height={60} />
    <Skeleton variant="rounded" height={60} />
  </Stack>
);

const CustomerDetailDialog = ({ customerId, onClose, open }) => {
  const { data: detailData, isLoading } = useCustomerDetailQuery(customerId, open);

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight : 500
        }}
      >
        Detail Pelanggan
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {isLoading ? (
          <DetailSkeleton />
        ) : detailData ? (
          <Stack spacing={3}>
            {/* Info Utama */}
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6" fontWeight={700}>
                    {detailData.name}
                  </Typography>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Telepon</Typography>
                    <Typography variant="body2" fontWeight={500}>{detailData.phone || "—"}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Tanggal Daftar</Typography>
                    <Typography variant="body2" fontWeight={500}>{formatDateTime(detailData.createdAt)}</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Statistik */}
            <Grid container spacing={2}>
              <Grid size={6}>
                <Card>
                  <CardContent sx={{ textAlign: "center", py: 2.5, "&:last-child": { pb: 2.5 } }}>
                    <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
                      Kendaraan
                    </Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>
                      {detailData.totalVehicles}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={6}>
                <Card>
                  <CardContent sx={{ textAlign: "center", py: 2.5, "&:last-child": { pb: 2.5 } }}>
                    <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
                      Order
                    </Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>
                      {detailData.totalOrders}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Kendaraan */}
            {detailData.vehicles?.length > 0 && (
              <>
                <Typography variant="subtitle2" fontWeight={600}>
                  Kendaraan
                </Typography>
                <Stack spacing={1.5}>
                  {detailData.vehicles.map((v) => (
                    <Card key={v.id}>
                      <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                        <Typography variant="body2" fontWeight={600}>
                          {v.plateNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {v.brand} {v.model}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </>
            )}

            {/* Riwayat Order */}
            {detailData.orders?.length > 0 && (
              <>
                <Typography variant="subtitle2" fontWeight={600}>
                  Riwayat Order
                </Typography>
                <Stack spacing={1.5}>
                  {detailData.orders.map((o) => (
                    <Card key={o.id}>
                      <CardContent
                        sx={{
                          py: 2,
                          "&:last-child": { pb: 2 },
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body2" fontWeight={500}>
                          {o.orderNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(o.createdAt)}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </>
            )}
          </Stack>
        ) : null}
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

export default CustomerDetailDialog;