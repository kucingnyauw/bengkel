/**
 * ShiftDetailDialog - Dialog detail untuk menampilkan informasi lengkap shift termasuk pesanan, pengeluaran, dan ringkasan keuangan.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {string|number} props.shiftId - ID Shift untuk mengambil detail
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 * @param {boolean} [props.showExpectedCash=false] - Tampilkan perhitungan saldo diharapkan
 *
 * @returns {JSX.Element} Dialog detail shift
 */
import { useState } from "react";
import { ChevronDown, X } from "lucide-react";

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
  DialogTitle,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { OrderStatus, statusColorMap } from "@shared/constant";
import { formatDateTime, formatToIdr, normalizeEnumText } from "@shared/utils";
import { useShiftDetailQuery } from "@views/shifts/hooks";

const DetailSkeleton = () => (
  <Stack sx={{ gap: 3 }}>
    <Skeleton variant="rounded" height={80} />
    <Skeleton variant="rounded" height={100} />
    <Skeleton variant="rounded" height={240} />
    <Skeleton variant="rounded" height={200} />
  </Stack>
);

const SectionHeader = ({ title, count, expanded, onToggle }) => (
  <Box
    onClick={onToggle}
    sx={(theme) => ({
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      px: theme.spacing(2),
      py: theme.spacing(2),
      cursor: "pointer",
      userSelect: "none",
      transition: theme.transitions.create("background-color", {
        duration: theme.transitions.duration.shorter,
      }),
      "&:hover": {
        bgcolor: alpha(theme.palette.secondary.main, 0.04),
      },
    })}
  >
    <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
      <Typography variant="subtitle2">{title}</Typography>
      <Chip label={count} size="small" variant="outlined" />
    </Stack>
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
  </Box>
);

const CashRow = ({ label, value, valueColor, bold }) => (
  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
    <Typography variant="body2" color={bold ? "text.primary" : "text.secondary"} sx={{ fontWeight: bold ? 500 : undefined }}>
      {label}
    </Typography>
    <Typography variant="body2" color={valueColor} sx={{ fontWeight: bold ? 500 : undefined }}>
      {value}
    </Typography>
  </Stack>
);

const ShiftDetailDialog = ({
  onClose,
  open,
  shiftId,
  showExpectedCash = false,
}) => {
  const theme = useTheme();
  const [ordersExpanded, setOrdersExpanded] = useState(true);
  const [expensesExpanded, setExpensesExpanded] = useState(true);

  const { data: detailData, isLoading } = useShiftDetailQuery(shiftId, open);

  const hasOrders = detailData?.orders?.length > 0;
  const hasExpenses = detailData?.expenses?.length > 0;
  const isOpen = detailData?.status === "OPEN";

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Detail Shift
        <IconButton onClick={onClose} size="small" sx={{ mr: -0.5 }}>
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {isLoading ? (
          <DetailSkeleton />
        ) : detailData ? (
          <Stack sx={{ gap: theme.spacing(3) }}>
            {/* Header Info */}
            <Card
              sx={(theme) => ({
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                bgcolor: alpha(theme.palette.secondary.main, 0.02),
                boxShadow: "none",
              })}
            >
              <CardContent>
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Kasir
                    </Typography>
                    <Typography variant="subtitle1" sx={{ mt: 0.3 }}>
                      {detailData.cashier?.fullName || "—"}
                    </Typography>
                  </Box>
                  <Chip
                    color={isOpen ? "success" : "default"}
                    label={isOpen ? "Aktif" : "Tutup"}
                    size="small"
                    variant="soft"
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Waktu */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: theme.spacing(2),
              }}
            >
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Waktu Buka
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {formatDateTime(detailData.openedAt)}
                  </Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Waktu Tutup
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {detailData.closedAt
                      ? formatDateTime(detailData.closedAt)
                      : "—"}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Ringkasan Keuangan */}
            <Card
              sx={(theme) => ({
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                bgcolor: alpha(theme.palette.secondary.main, 0.02),
                boxShadow: "none",
              })}
            >
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: theme.spacing(2.5) }}>
                  Ringkasan Keuangan
                </Typography>

                <Stack sx={{ gap: theme.spacing(1.5) }}>
                  <CashRow
                    label="Saldo Awal"
                    value={formatToIdr(detailData.startingCash)}
                  />
                  <CashRow
                    label="Penjualan Tunai"
                    value={formatToIdr(detailData.cashSales || 0)}
                  />
                  <CashRow
                    label="Kas Masuk"
                    value={`+${formatToIdr(detailData.cashIn || 0)}`}
                    valueColor="success.main"
                  />
                  <CashRow
                    label="Kas Keluar"
                    value={`-${formatToIdr(detailData.cashOut || 0)}`}
                    valueColor="error.main"
                  />

                  {showExpectedCash && (
                    <CashRow
                      label="Saldo Harapan"
                      value={formatToIdr(detailData.expectedCash || 0)}
                    />
                  )}

                  <Divider />

                  <CashRow
                    label="Saldo Akhir"
                    value={
                      detailData.endingCash !== null &&
                      detailData.endingCash !== undefined
                        ? formatToIdr(detailData.endingCash)
                        : "—"
                    }
                    bold
                  />
                  <CashRow
                    label="Selisih"
                    value={formatToIdr(detailData.discrepancy || 0)}
                    valueColor={
                      detailData.discrepancy !== 0
                        ? "error.main"
                        : "text.primary"
                    }
                    bold
                  />
                </Stack>

                <Divider sx={{ my: theme.spacing(2) }} />

                <Stack sx={{ gap: theme.spacing(1) }}>
                  <CashRow
                    label="Total Order"
                    value={detailData.totalOrders || 0}
                  />
                  <CashRow
                    label="Total Pengeluaran"
                    value={formatToIdr(detailData.totalExpenses || 0)}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Pesanan */}
            {hasOrders && (
              <Card>
                <SectionHeader
                  title="Pesanan"
                  count={detailData.orders.length}
                  expanded={ordersExpanded}
                  onToggle={() => setOrdersExpanded(!ordersExpanded)}
                />

                <Collapse in={ordersExpanded} timeout="auto" unmountOnExit>
                  <Divider />
                  <CardContent sx={{ pt: theme.spacing(2) }}>
                    <Stack spacing={0}>
                      {detailData.orders.map((order, index) => (
                        <Box key={order.id}>
                          <Stack
                            direction="row"
                            sx={{
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}
                          >
                            <Stack sx={{ minWidth: 0, flex: 1 }}>
                              <Stack
                                direction="row"
                                sx={{ gap: 1, alignItems: "center" }}
                              >
                                <Typography variant="body2">
                                  {order.orderNumber}
                                </Typography>
                                <Chip
                                  color={
                                    statusColorMap[order.status] || "default"
                                  }
                                  label={normalizeEnumText(
                                    OrderStatus[order.status] || order.status
                                  )}
                                  size="small"
                                  variant="outlined"
                                />
                              </Stack>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mt: 0.3 }}
                              >
                                {order.customer?.name || "—"}
                                {order.paymentStatus === "PAID" && " • Lunas"}
                                {order.paymentStatus === "REFUNDED" &&
                                  " • Direfund"}
                                {" • "}{order.totalItems} item
                              </Typography>
                            </Stack>
                            <Typography variant="body2" noWrap>
                              {formatToIdr(order.total)}
                            </Typography>
                          </Stack>
                          {index < detailData.orders.length - 1 && (
                            <Divider sx={{ my: theme.spacing(1.5) }} />
                          )}
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Collapse>
              </Card>
            )}

            {/* Pengeluaran */}
            {hasExpenses && (
              <Card>
                <SectionHeader
                  title="Pengeluaran"
                  count={detailData.expenses.length}
                  expanded={expensesExpanded}
                  onToggle={() => setExpensesExpanded(!expensesExpanded)}
                />

                <Collapse in={expensesExpanded} timeout="auto" unmountOnExit>
                  <Divider />
                  <CardContent sx={{ pt: theme.spacing(2) }}>
                    <Stack spacing={0}>
                      {detailData.expenses.map((expense, index) => (
                        <Box key={expense.id}>
                          <Stack
                            direction="row"
                            sx={{ gap: 2, alignItems: "flex-start" }}
                          >
                            <Box
                              sx={(theme) => ({
                                width: 40,
                                height: 40,
                                borderRadius: `${theme.shape.borderRadius}px`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: alpha(
                                  theme.palette.secondary.main,
                                  0.08
                                ),
                                color: theme.palette.text.secondary,
                                flexShrink: 0,
                                fontSize: "0.875rem",
                                overflow: "hidden",
                              })}
                            >
                              {expense.receipt?.url ? (
                                <Box
                                  component="img"
                                  alt="Bukti"
                                  src={expense.receipt.url}
                                  sx={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                expense.category?.charAt(0) || "?"
                              )}
                            </Box>
                            <Stack sx={{ minWidth: 0, flex: 1 }}>
                              <Typography variant="body2">
                                {expense.title}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {normalizeEnumText(expense.category)} •{" "}
                                {formatDateTime(expense.date)}
                              </Typography>
                            </Stack>
                            <Typography
                              variant="body2"
                              color="error.main"
                              noWrap
                            >
                              -{formatToIdr(expense.amount)}
                            </Typography>
                          </Stack>
                          {index < detailData.expenses.length - 1 && (
                            <Divider sx={{ my: theme.spacing(1.5) }} />
                          )}
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Collapse>
              </Card>
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

export default ShiftDetailDialog;