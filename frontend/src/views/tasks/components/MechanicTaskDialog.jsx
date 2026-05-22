/**
 * MechanicTaskDialog - Dialog untuk melihat tugas mekanik yang ditugaskan dengan kemampuan unassign order.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {Object} props.mechanic - Data mekanik
 * @param {string|number} [props.mechanic.id] - ID Mekanik
 * @param {string} [props.mechanic.fullName] - Nama lengkap mekanik
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 *
 * @returns {JSX.Element} Dialog tugas mekanik
 */
import { useState } from "react";
import { ChevronDown, Trash2, X } from "lucide-react";
import { useDispatch } from "react-redux";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
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
import { OrderStatus, statusColorMap } from "@shared/constant";
import { useMechanicTasks, useUnassignMechanicMutation } from "@views/tasks/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const OrderCard = ({ order, isUnassigning, onUnassign, unassigningOrderId }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const hasServices = order.services?.length > 0;
  const isThisUnassigning = unassigningOrderId === order.orderId;

  const handleUnassignConfirm = () => {
    onUnassign(order.orderId);
    setConfirmOpen(false);
  };

  return (
    <>
      <Card
        sx={{
          border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          boxShadow: "none",
          opacity: isUnassigning ? 0.5 : 1,
          transition: theme.transitions.create("opacity", {
            duration: theme.transitions.duration.shorter,
          }),
          pointerEvents: isUnassigning ? "none" : "auto",
        }}
      >
        <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
          <Stack direction="row" sx={{ gap: 2, alignItems: "flex-start" }}>
            <Box
              onClick={() => hasServices && setExpanded(!expanded)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flex: 1,
                minWidth: 0,
                cursor: hasServices ? "pointer" : "default",
                userSelect: "none",
              }}
            >
              {hasServices && (
                <ChevronDown
                  size={16}
                  strokeWidth={1.5}
                  style={{
                    flexShrink: 0,
                    transition: "transform 0.2s ease",
                    transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                    opacity: 0.5,
                  }}
                />
              )}
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 400 }} noWrap>
                  {order.orderNumber}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }} noWrap>
                  {order.customer?.name || "—"} •{" "}
                  {order.vehicle?.plateNumber || "—"}
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" sx={{ gap: 1, alignItems: "center", flexShrink: 0 }}>
              <Chip
                label={normalizeEnumText(OrderStatus[order.status] || order.status)}
                color={statusColorMap[order.status] || "default"}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 400 }}
              />
              {isThisUnassigning ? (
                <CircularProgress size={20} />
              ) : (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmOpen(true);
                  }}
                  disabled={isUnassigning}
                  aria-label="Hapus Penugasan"
                  sx={{
                    border: "1px solid",
                    borderColor: alpha(theme.palette.divider, 0.8),
                    borderRadius: `${theme.shape.borderRadius}px`,
                    bgcolor: alpha(theme.palette.background.paper, 0.6),
                    color: theme.palette.text.secondary,
                    transition: theme.transitions.create(
                      ["background-color", "border-color", "color"],
                      { duration: theme.transitions.duration.shorter }
                    ),
                    "&:hover": {
                      bgcolor: alpha(theme.palette.error.main, 0.06),
                      borderColor: alpha(theme.palette.error.main, 0.4),
                      color: theme.palette.error.main,
                    },
                  }}
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </IconButton>
              )}
            </Stack>
          </Stack>

          {hasServices && (
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Divider sx={{ my: 1.5 }} />
              <Stack sx={{ gap: 0.5 }}>
                {order.services.map((service) => (
                  <Stack
                    key={service.assignmentId}
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                      pl: 2.5,
                      borderLeft: 2,
                      borderColor: alpha(theme.palette.secondary.main, 0.4),
                      py: 0.75,
                    }}
                  >
                    <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
                      <Typography variant="body2" sx={{ fontWeight: 400 }}>
                        {service.name}
                      </Typography>
                      <Chip
                        label={normalizeEnumText(service.taskStatusLabel || service.taskStatus)}
                        color={
                          service.taskStatus === "COMPLETED"
                            ? "success"
                            : service.taskStatus === "IN_PROGRESS"
                            ? "secondary"
                            : "default"
                        }
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 400 }}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                      {service.startAt ? formatDateTime(service.startAt) : "Belum dimulai"}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Collapse>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
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
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: 400,
          }}
        >
          Hapus Penugasan
          <IconButton onClick={() => setConfirmOpen(false)} size="small">
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
            Apakah Anda yakin ingin menghapus penugasan mekanik dari pesanan{" "}
            <strong>{order.orderNumber}</strong>?
          </Typography>
        </DialogContent>

        <Divider />

        <DialogActions>
          <Button
            color="inherit"
            variant="outlined"
            onClick={() => setConfirmOpen(false)}
            sx={{ fontWeight: 400 }}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleUnassignConfirm}
            sx={{ fontWeight: 400 }}
          >
            Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const LoadingSkeleton = () => (
  <Stack sx={{ gap: 2 }}>
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: 2 }} />
    ))}
  </Stack>
);

const MechanicTaskDialog = ({ open, mechanic, onClose }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { data: tasks, isLoading } = useMechanicTasks(mechanic?.id, open);

  const [unassigningOrderId, setUnassigningOrderId] = useState(null);

  const unassignMutation = useUnassignMechanicMutation({
    onSuccess: () => {
      setUnassigningOrderId(null);
      dispatch(
        showNotification({
          message: "Penugasan mekanik berhasil dihapus",
          type: "success",
          title: "Berhasil",
          variant: "snackbar",
          autoHide: 3000,
        })
      );
    },
    onFailed: (error) => {
      setUnassigningOrderId(null);
      dispatch(
        showNotification({
          message: error.message || "Gagal menghapus penugasan",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const handleUnassign = (orderId) => {
    setUnassigningOrderId(orderId);
    unassignMutation.mutate(orderId);
  };

  return (
    <Dialog
      open={open}
      onClose={unassignMutation.isPending ? undefined : onClose}
      maxWidth="md"
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
        Tugas {mechanic?.fullName}
        <IconButton onClick={onClose} disabled={unassignMutation.isPending} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {isLoading ? (
          <LoadingSkeleton />
        ) : tasks?.length > 0 ? (
          <Stack sx={{ gap: 2 }}>
            {tasks.map((order) => (
              <OrderCard
                key={order.orderId}
                order={order}
                isUnassigning={unassignMutation.isPending}
                unassigningOrderId={unassigningOrderId}
                onUnassign={handleUnassign}
              />
            ))}
          </Stack>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ py: 6, fontWeight: 400 }}
          >
            Tidak ada tugas aktif
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

export default MechanicTaskDialog;