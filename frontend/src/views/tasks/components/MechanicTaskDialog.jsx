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

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import { formatDateTime, normalizeEnumText } from "@shared/utils";
import { OrderStatus, statusColorMap } from "@shared/constant";
import { useMechanicTasks, useUnassignMechanicMutation } from "@views/tasks/hooks";

/**
 * OrderCard - Kartu order dengan layanan yang dapat dilipat.
 *
 * @param {Object} props
 * @param {Object} props.order - Data order
 * @param {boolean} props.isUnassigning - Status unassign
 * @param {Function} props.onUnassign - Handler unassign
 */
const OrderCard = ({ order, isUnassigning, onUnassign }) => {
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const hasServices = order.services?.length > 0;

  const handleUnassignConfirm = () => {
    onUnassign(order.orderId);
    setConfirmOpen(false);
  };

  return (
    <>
      <Card>
        <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
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
                  style={{
                    flexShrink: 0,
                    transition: "transform 0.2s ease",
                    transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                    opacity: 0.5,
                  }}
                />
              )}
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {order.orderNumber}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {order.customer?.name || "—"} •{" "}
                  {order.vehicle?.plateNumber || "—"}
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
              <Chip
                label={normalizeEnumText(OrderStatus[order.status] || order.status)}
                color={statusColorMap[order.status] || "default"}
                size="small"
                variant="outlined"
              />
              {isUnassigning ? (
                <Skeleton variant="circular" width={30} height={30} />
              ) : (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmOpen(true);
                  }}
                  aria-label="Hapus Penugasan"
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    color: "text.secondary",
                    transition: (theme) =>
                      theme.transitions.create(["background-color", "border-color", "color"], {
                        duration: theme.transitions.duration.shorter,
                      }),
                    "&:hover": {
                      bgcolor: "action.hover",
                      borderColor: "text.primary",
                      color: "text.primary",
                    },
                  }}
                >
                  <Trash2 size={14} />
                </IconButton>
              )}
            </Stack>
          </Stack>

          {hasServices && (
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Divider sx={{ my: 1.5 }} />
              <Stack spacing={0.5}>
                {order.services.map((service) => (
                  <Stack
                    key={service.assignmentId}
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                      pl: 2.5,
                      borderLeft: 2,
                      borderColor: "primary.main",
                      py: 0.75,
                    }}
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Typography variant="body2">{service.name}</Typography>
                      <Chip
                        label={service.taskStatusLabel}
                        color={
                          service.taskStatus === "COMPLETED"
                            ? "success"
                            : service.taskStatus === "IN_PROGRESS"
                            ? "warning"
                            : "default"
                        }
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {service.startAt ? formatDateTime(service.startAt) : "Belum dimulai"}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Collapse>
          )}
        </CardContent>
      </Card>

      {/* Unassign Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Hapus Penugasan
          <IconButton onClick={() => setConfirmOpen(false)} size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent>
          <DialogContentText>
            Apakah Anda yakin ingin menghapus penugasan mekanik dari pesanan{" "}
            <strong>{order.orderNumber}</strong>?
          </DialogContentText>
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
  <Stack spacing={2}>
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} variant="rounded" height={72} />
    ))}
  </Stack>
);

const MechanicTaskDialog = ({ open, mechanic, onClose }) => {
  const { data: tasks, isLoading } = useMechanicTasks(mechanic?.id, open);
  const unassignMutation = useUnassignMechanicMutation();

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
        <IconButton onClick={onClose} disabled={unassignMutation.isPending} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {isLoading ? (
          <LoadingSkeleton />
        ) : tasks?.length > 0 ? (
          <Stack spacing={2}>
            {tasks.map((order) => (
              <OrderCard
                key={order.orderId}
                order={order}
                isUnassigning={unassignMutation.isPending}
                onUnassign={(orderId) => unassignMutation.mutate(orderId)}
              />
            ))}
          </Stack>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ py: 6 }}
          >
            Tidak ada tugas aktif
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

export default MechanicTaskDialog;