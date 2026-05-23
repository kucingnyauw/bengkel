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
import {
  useMechanicTasks,
  useUnassignMechanicMutation,
} from "@views/tasks/hooks";
import { showNotification } from "@store/notifications/notificationsSlice.js";

const OrderCard = ({
  order,
  isUnassigning,
  onUnassign,
  unassigningOrderId,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const hasServices = order.services?.length > 0;
  const isThisUnassigning = unassigningOrderId === order.orderId;

  const handleUnassignConfirm = () => {
    onUnassign(order.orderId);
    setConfirmOpen(false);
  };

  const getServiceStatusColor = (taskStatus) => {
    if (taskStatus === "COMPLETED") return "success";
    if (taskStatus === "IN_PROGRESS") return "secondary";
    return "default";
  };

  return (
    <>
      <Card
        sx={{
          opacity: isUnassigning ? 0.5 : 1,
          transition: theme.transitions.create("opacity", {
            duration: theme.transitions.duration.shorter,
          }),
          pointerEvents: isUnassigning ? "none" : "auto",
        }}
      >
        <CardContent>
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
                <Typography variant="body2" noWrap>
                  {order.orderNumber}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {order.customer?.name || "—"} •{" "}
                  {order.vehicle?.plateNumber || "—"}
                </Typography>
              </Box>
            </Box>

            <Stack
              direction="row"
              sx={{ gap: 1, alignItems: "center", flexShrink: 0 }}
            >
              <Chip
                label={normalizeEnumText(
                  OrderStatus[order.status] || order.status
                )}
                color={statusColorMap[order.status] || "default"}
                size="small"
                variant="outlined"
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
                  sx={(theme) => ({
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
                  })}
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </IconButton>
              )}
            </Stack>
          </Stack>

          {hasServices && (
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Divider sx={{ my: theme.spacing(1.5) }} />
              <Stack sx={{ gap: 0.5 }}>
                {order.services.map((service) => (
                  <Stack
                    key={service.assignmentId}
                    direction="row"
                    sx={(theme) => ({
                      justifyContent: "space-between",
                      alignItems: "center",
                      pl: theme.spacing(2.5),
                      borderLeft: 2,
                      borderColor: alpha(theme.palette.secondary.main, 0.4),
                      py: 0.75,
                    })}
                  >
                    <Stack
                      direction="row"
                      sx={{ gap: 1, alignItems: "center" }}
                    >
                      <Typography variant="body2">{service.name}</Typography>
                      <Chip
                        label={normalizeEnumText(
                          service.taskStatusLabel || service.taskStatus
                        )}
                        color={getServiceStatusColor(service.taskStatus)}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {service.startAt
                        ? formatDateTime(service.startAt)
                        : "Belum dimulai"}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Collapse>
          )}
        </CardContent>
      </Card>

      {/* Confirm Unassign Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Hapus Penugasan
          <IconButton
            onClick={() => setConfirmOpen(false)}
            size="small"
            sx={{ mr: -0.5 }}
          >
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent>
          <Typography variant="body2" color="text.secondary">
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
          >
            Batal
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleUnassignConfirm}
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
      <Skeleton key={i} variant="rounded" height={72} />
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
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Tugas {mechanic?.fullName}
        <IconButton
          onClick={onClose}
          disabled={unassignMutation.isPending}
          size="small"
          sx={{ mr: -0.5 }}
        >
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {isLoading ? (
          <LoadingSkeleton />
        ) : tasks?.length > 0 ? (
          <Stack sx={{ gap: theme.spacing(2) }}>
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
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: theme.spacing(8),
              gap: theme.spacing(1),
            }}
          >
            <Typography variant="body1" color="text.secondary">
              Tidak ada tugas aktif
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Mekanik belum memiliki pesanan yang ditugaskan
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

export default MechanicTaskDialog;