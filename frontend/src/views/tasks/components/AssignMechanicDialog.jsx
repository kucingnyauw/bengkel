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
} from "@mui/material";

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
      >
        <DialogTitle>Assign Mekanik</DialogTitle>

        <Divider />

        <DialogContent>
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary">
              Masukkan nomor order atau ID pesanan yang akan ditugaskan ke{" "}
              <strong>{selectedMechanic?.fullName}</strong>
            </Typography>

            <TextField
              autoFocus
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
              orderQuery.isFetching ? <CircularProgress size={14} color="inherit" /> : null
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
          <Stack spacing={3}>
            {/* Detail Pesanan */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  Detail Pesanan
                </Typography>
                <Stack spacing={1.5}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">No. Order</Typography>
                    <Typography variant="body2" fontWeight={600}>{orderData?.orderNumber}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip
                      label={OrderStatus[orderData?.status] || orderData?.status}
                      color={statusColorMap[orderData?.status] || "default"}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Pelanggan</Typography>
                    <Typography variant="body2" fontWeight={500}>{orderData?.customer?.name || "—"}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Total</Typography>
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      {formatToIdr(orderData?.total || 0)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Info Mekanik */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                  Mekanik yang Ditugaskan
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedMechanic?.fullName}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
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
              isSubmitting ? <CircularProgress size={14} color="inherit" /> : null
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