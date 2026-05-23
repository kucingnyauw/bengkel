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

const DetailRow = ({ label, value, valueColor }) => {
  const isValueNode = typeof value !== "string" && typeof value !== "number";

  return (
    <Stack
      direction="row"
      sx={{ justifyContent: "space-between", alignItems: "center" }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      {isValueNode ? (
        value
      ) : (
        <Typography variant="body2" color={valueColor}>
          {value}
        </Typography>
      )}
    </Stack>
  );
};

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
          message: "Mekanik berhasil ditugaskan ke pesanan",
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
  const orderData = orderQuery.data;

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

  return (
    <>
      {/* Step 1: Input Order */}
      <Dialog
        open={open && step === "input-order"}
        onClose={onClose}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Assign Mekanik</DialogTitle>

        <Divider />

        <DialogContent>
          <Stack sx={{ gap: theme.spacing(2.5) }}>
            <Typography variant="body2" color="text.secondary">
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
          >
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleNextStep}
            disabled={!orderIdentifier.trim() || orderQuery.isFetching}
            startIcon={
              orderQuery.isFetching ? (
                <CircularProgress size={14} color="inherit" />
              ) : null
            }
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
      >
        <DialogTitle>Konfirmasi Penugasan</DialogTitle>

        <Divider />

        <DialogContent>
          <Stack sx={{ gap: theme.spacing(3) }}>
            {/* Detail Pesanan */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: theme.spacing(2) }}>
                  Detail Pesanan
                </Typography>
                <Stack sx={{ gap: theme.spacing(1.5) }}>
                  <DetailRow
                    label="No. Order"
                    value={orderData?.orderNumber}
                  />
                  <DetailRow
                    label="Status"
                    value={
                      <Chip
                        label={
                          OrderStatus[orderData?.status] || orderData?.status
                        }
                        color={
                          statusColorMap[orderData?.status] || "default"
                        }
                        size="small"
                        variant="outlined"
                      />
                    }
                  />
                  <DetailRow
                    label="Pelanggan"
                    value={orderData?.customer?.name || "—"}
                  />
                  {orderData?.vehicle?.plateNumber && (
                    <DetailRow
                      label="Kendaraan"
                      value={`${orderData.vehicle.plateNumber}${orderData.vehicle.brand ? ` · ${orderData.vehicle.brand} ${orderData.vehicle.model || ""}` : ""}`}
                    />
                  )}
                  <DetailRow
                    label="Total"
                    value={formatToIdr(orderData?.total || 0)}
                    valueColor="secondary"
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Items */}
            {orderData?.items?.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ mb: theme.spacing(2) }}>
                    Item Pesanan ({orderData.items.length})
                  </Typography>
                  <Stack spacing={0}>
                    {orderData.items.map((item, index) => (
                      <Box key={item.id}>
                        <Stack
                          direction="row"
                          sx={{ gap: 2, alignItems: "flex-start" }}
                        >
                          <Avatar
                            alt={item.productName || item.product?.name}
                            src={item.product?.image?.url || ""}
                            variant="rounded"
                            sx={(theme) => ({
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
                            })}
                          >
                            {!item.product?.image?.url &&
                              (item.productName || item.product?.name)
                                ?.charAt(0)
                                ?.toUpperCase()}
                          </Avatar>
                          <Stack sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" noWrap>
                              {item.productName || item.product?.name}
                            </Typography>
                            <Stack
                              direction="row"
                              sx={{
                                gap: 1,
                                alignItems: "center",
                                mt: 0.3,
                              }}
                            >
                              <Chip
                                label={
                                  item.product?.type === "SERVICE"
                                    ? "Servis"
                                    : "Sparepart"
                                }
                                size="small"
                                variant="outlined"
                                color={
                                  item.product?.type === "SERVICE"
                                    ? "secondary"
                                    : "warning"
                                }
                                sx={{ height: 20, fontSize: "0.6875rem" }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {item.quantity} ×{" "}
                                {formatToIdr(item.unitPrice)}
                              </Typography>
                            </Stack>
                          </Stack>
                          <Typography variant="body2" noWrap>
                            {formatToIdr(item.subtotal)}
                          </Typography>
                        </Stack>
                        {index < orderData.items.length - 1 && (
                          <Divider sx={{ my: theme.spacing(1.5) }} />
                        )}
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Info Mekanik */}
            <Card
              sx={(theme) => ({
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                bgcolor: alpha(theme.palette.secondary.main, 0.02),
                boxShadow: "none",
              })}
            >
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: theme.spacing(1.5) }}>
                  Mekanik yang Ditugaskan
                </Typography>
                <Typography variant="body1">
                  {selectedMechanic?.fullName}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5, display: "block" }}
                >
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
          >
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmAssign}
            disabled={isSubmitting}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={14} color="inherit" />
              ) : null
            }
          >
            {isSubmitting ? "Menugaskan..." : "Ya, Tugaskan"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AssignMechanicDialog;