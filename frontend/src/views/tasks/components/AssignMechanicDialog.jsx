/**
 * AssignMechanicDialog - Dialog multi-step untuk menugaskan mekanik ke order.
 *
 * Step 1: Input nomor order / ID pesanan.
 * Step 2: Konfirmasi penugasan dengan detail order & mekanik.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {boolean} props.open - Status dialog terbuka
 * @param {string} props.step - Step aktif ("input-order" atau "confirm")
 * @param {Object} props.selectedMechanic - Data mekanik yang dipilih
 * @param {string} props.orderIdentifier - Nomor/ID order yang diinput
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {Function} props.onOrderIdentifierChange - Handler perubahan input order
 * @param {Function} props.onNextStep - Handler lanjut ke step berikutnya
 * @param {Function} props.onDataFetched - Handler setelah data order berhasil di-fetch
 *
 * @returns {JSX.Element} Dialog assign mekanik
 */
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { getOrder } from "@api/orderApi.js";
import { formatToIdr } from "@shared/utils";
import { statusColorMap, OrderStatus } from "@shared/constant";
import { useAssignMechanicMutation } from "@views/tasks/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const AssignMechanicDialog = ({
  open,
  step,
  selectedMechanic,
  orderIdentifier,
  onClose,
  onOrderIdentifierChange,
  onNextStep,
  onDataFetched,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const orderQuery = useQuery({
    queryKey: ["order-detail", orderIdentifier],
    queryFn: () => getOrder(orderIdentifier),
    enabled: false,
  });

  const assignMutation = useAssignMechanicMutation({
    onSuccess: () => {
      dispatch(
        showNotification({
          message: `Mekanik berhasil ditugaskan ke pesanan`,
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
          message: error.message || "Gagal menugaskan mekanik",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const isSubmitting = assignMutation.isPending;

  const handleNextStep = useCallback(async () => {
    if (!orderIdentifier.trim()) return;
    const result = await orderQuery.refetch();
    const order = result?.data;
    if (order) {
      onDataFetched?.(order);
      onNextStep?.();
    }
  }, [orderIdentifier, orderQuery, onDataFetched, onNextStep]);

  const handleConfirmAssign = useCallback(() => {
    if (!selectedMechanic || !orderQuery.data) return;
    assignMutation.mutate({
      orderId: orderQuery.data.id,
      mechanicId: selectedMechanic.id,
    });
  }, [selectedMechanic, orderQuery.data, assignMutation]);

  const orderData = orderQuery.data;

  return (
    <>
      {/* Step 1: Input Order */}
      <Dialog
        open={open && step === "input-order"}
        onClose={onClose}
        maxWidth="xs"
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
        <DialogTitle sx={{ fontWeight: 500 }}>
          Assign Mekanik
        </DialogTitle>

        <Divider />

        <DialogContent>
          <Stack sx={{ gap: 2.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
              Masukkan nomor order atau ID pesanan yang akan ditugaskan ke{" "}
              <strong>{selectedMechanic?.fullName}</strong>
            </Typography>

            <TextField
              autoFocus
              fullWidth
              label="Nomor Order / ID"
              value={orderIdentifier}
              onChange={(e) => onOrderIdentifierChange(e.target.value)}
              placeholder="ORD-20260215-XXXX"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNextStep();
              }}
              slotProps={{
                input: { sx: { fontWeight: 400 } },
                inputLabel: { sx: { fontWeight: 400 } },
              }}
            />
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions>
          <Button
            color="inherit"
            variant="outlined"
            onClick={onClose}
            disabled={orderQuery.isFetching}
            sx={{ fontWeight: 400 }}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleNextStep}
            disabled={!orderIdentifier.trim() || orderQuery.isFetching}
            startIcon={
              orderQuery.isFetching ? <CircularProgress size={14} color="inherit" /> : null
            }
            sx={{
              fontWeight: 400,
              "&:hover": {
                boxShadow: `0 4px 14px 0 ${alpha(theme.palette.secondary.main, 0.3)}`,
              },
            }}
          >
            {orderQuery.isFetching ? "Mencari..." : "Lanjut"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Step 2: Confirm */}
      <Dialog
        open={open && step === "confirm"}
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
        <DialogTitle sx={{ fontWeight: 400 }}>
          Konfirmasi Penugasan
        </DialogTitle>

        <Divider />

        <DialogContent>
          <Stack sx={{ gap: 3 }}>
            {/* Detail Pesanan */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ py: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 400 }}>
                  Detail Pesanan
                </Typography>
                <Stack sx={{ gap: 1.5 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      No. Order
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {orderData?.orderNumber}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Status
                    </Typography>
                    <Chip
                      label={OrderStatus[orderData?.status] || orderData?.status}
                      color={statusColorMap[orderData?.status] || "default"}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 400 }}
                    />
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Pelanggan
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {orderData?.customer?.name || "—"}
                    </Typography>
                  </Stack>
                  {orderData?.vehicle?.plateNumber && (
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                        Kendaraan
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 400 }}>
                        {orderData.vehicle.plateNumber}
                        {orderData.vehicle.brand && ` · ${orderData.vehicle.brand} ${orderData.vehicle.model || ""}`}
                      </Typography>
                    </Stack>
                  )}
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Total
                    </Typography>
                    <Typography variant="body2" color="secondary" sx={{ fontWeight: 400 }}>
                      {formatToIdr(orderData?.total || 0)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Items */}
            {orderData?.items?.length > 0 && (
              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  boxShadow: "none",
                }}
              >
                <CardContent sx={{ py: 2.5, "&:last-child": { pb: 2.5 } }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 400 }}>
                    Item Pesanan ({orderData.items.length})
                  </Typography>
                  <Stack spacing={0}>
                    {orderData.items.map((item, index) => (
                      <Box key={item.id}>
                        <Stack direction="row" sx={{ gap: 2, alignItems: "flex-start" }}>
                          <Avatar
                            alt={item.productName || item.product?.name}
                            src={item.product?.image?.url || ""}
                            variant="rounded"
                            sx={{
                              width: 36,
                              height: 36,
                              flexShrink: 0,
                              borderRadius: `${theme.shape.borderRadius}px`,
                              bgcolor: !item.product?.image?.url
                                ? alpha(theme.palette.secondary.main, 0.08)
                                : "transparent",
                              color: !item.product?.image?.url
                                ? theme.palette.secondary.main
                                : "transparent",
                              fontSize: "0.8125rem",
                              fontWeight: 400,
                            }}
                          >
                            {!item.product?.image?.url &&
                              (item.productName || item.product?.name)?.charAt(0)?.toUpperCase()}
                          </Avatar>
                          <Stack sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 400 }} noWrap>
                              {item.productName || item.product?.name}
                            </Typography>
                            <Stack direction="row" sx={{ gap: 1, alignItems: "center", mt: 0.3 }}>
                              <Chip
                                label={item.product?.type === "SERVICE" ? "Servis" : "Sparepart"}
                                size="small"
                                variant="outlined"
                                color={item.product?.type === "SERVICE" ? "secondary" : "warning"}
                                sx={{ fontWeight: 400, height: 20, fontSize: "0.6875rem" }}
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                                {item.quantity} × {formatToIdr(item.unitPrice)}
                              </Typography>
                            </Stack>
                          </Stack>
                          <Typography variant="body2" sx={{ fontWeight: 400 }} noWrap>
                            {formatToIdr(item.subtotal)}
                          </Typography>
                        </Stack>
                        {index < orderData.items.length - 1 && <Divider sx={{ my: 1.5 }} />}
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Info Mekanik */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                bgcolor: alpha(theme.palette.secondary.main, 0.02),
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ py: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 400 }}>
                  Mekanik yang Ditugaskan
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 400 }}>
                  {selectedMechanic?.fullName}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block", fontWeight: 400 }}>
                  Task aktif: {selectedMechanic?.activeTaskCount}
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions>
          <Button
            color="inherit"
            variant="outlined"
            onClick={onClose}
            disabled={isSubmitting}
            sx={{ fontWeight: 400 }}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmAssign}
            disabled={isSubmitting}
            startIcon={
              isSubmitting ? <CircularProgress size={14} color="inherit" /> : null
            }
            sx={{
              fontWeight: 400,
              "&:hover": {
                boxShadow: `0 4px 14px 0 ${alpha(theme.palette.secondary.main, 0.3)}`,
              },
            }}
          >
            {isSubmitting ? "Menugaskan..." : "Ya, Tugaskan"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AssignMechanicDialog;