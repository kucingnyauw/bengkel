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
    <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2 }} />
    <Skeleton variant="rounded" height={100} sx={{ borderRadius: 2 }} />
    <Skeleton variant="rounded" height={240} sx={{ borderRadius: 2 }} />
    <Skeleton variant="rounded" height={200} sx={{ borderRadius: 2 }} />
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
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      open={open}
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
        Detail Shift
        <IconButton onClick={onClose} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {isLoading ? (
          <DetailSkeleton />
        ) : detailData ? (
          <Stack sx={{ gap: 3 }}>
            {/* Header Info */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                bgcolor: alpha(theme.palette.secondary.main, 0.02),
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ py: 2.5, px: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Kasir
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 400, mt: 0.3 }}>
                      {detailData.cashier?.fullName || "—"}
                    </Typography>
                  </Box>
                  <Chip
                    color={isOpen ? "success" : "default"}
                    label={isOpen ? "Aktif" : "Tutup"}
                    size="small"
                    variant="soft"
                    sx={{ fontWeight: 400 }}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Waktu */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
              }}
            >
              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  boxShadow: "none",
                }}
              >
                <CardContent sx={{ py: 2.5, px: 2.5, "&:last-child": { pb: 2.5 } }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                    Waktu Buka
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 400, mt: 0.5 }}>
                    {formatDateTime(detailData.openedAt)}
                  </Typography>
                </CardContent>
              </Card>

              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  boxShadow: "none",
                }}
              >
                <CardContent sx={{ py: 2.5, px: 2.5, "&:last-child": { pb: 2.5 } }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                    Waktu Tutup
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 400, mt: 0.5 }}>
                    {detailData.closedAt ? formatDateTime(detailData.closedAt) : "—"}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Keuangan */}
            <Card
              sx={{
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                bgcolor: alpha(theme.palette.secondary.main, 0.02),
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ py: 2.5, px: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Typography variant="subtitle2" sx={{ mb: 2.5, fontWeight: 400 }}>
                  Ringkasan Keuangan
                </Typography>

                <Stack sx={{ gap: 1.5 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Saldo Awal
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {formatToIdr(detailData.startingCash)}
                    </Typography>
                  </Stack>

                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Penjualan Tunai
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {formatToIdr(detailData.cashSales || 0)}
                    </Typography>
                  </Stack>

                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Kas Masuk
                    </Typography>
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 400 }}>
                      +{formatToIdr(detailData.cashIn || 0)}
                    </Typography>
                  </Stack>

                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Kas Keluar
                    </Typography>
                    <Typography variant="body2" color="error.main" sx={{ fontWeight: 400 }}>
                      -{formatToIdr(detailData.cashOut || 0)}
                    </Typography>
                  </Stack>

                  {showExpectedCash && (
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                        Saldo Harapan
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 400 }}>
                        {formatToIdr(detailData.expectedCash || 0)}
                      </Typography>
                    </Stack>
                  )}

                  <Divider />

                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      Saldo Akhir
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {detailData.endingCash !== null && detailData.endingCash !== undefined
                        ? formatToIdr(detailData.endingCash)
                        : "—"}
                    </Typography>
                  </Stack>

                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      Selisih
                    </Typography>
                    <Typography
                      variant="body2"
                      color={detailData.discrepancy !== 0 ? "error.main" : "text.primary"}
                      sx={{ fontWeight: 400 }}
                    >
                      {formatToIdr(detailData.discrepancy || 0)}
                    </Typography>
                  </Stack>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack sx={{ gap: 1 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Total Order
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {detailData.totalOrders || 0}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Total Pengeluaran
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400 }}>
                      {formatToIdr(detailData.totalExpenses || 0)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Pesanan */}
            {hasOrders && (
              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  boxShadow: "none",
                  overflow: "hidden",
                }}
              >
                <Box
                  onClick={() => setOrdersExpanded(!ordersExpanded)}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    px: 2,
                    py: 2,
                    cursor: "pointer",
                    userSelect: "none",
                    transition: "background-color 0.15s ease",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.secondary.main, 0.04),
                    },
                  }}
                >
                  <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 400 }}>
                      Pesanan
                    </Typography>
                    <Chip
                      label={detailData.orders.length}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 400 }}
                    />
                  </Stack>
                  <ChevronDown
                    size={16}
                    strokeWidth={1.5}
                    style={{
                      flexShrink: 0,
                      transition: "transform 0.2s ease",
                      transform: ordersExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      opacity: 0.5,
                    }}
                  />
                </Box>

                <Collapse in={ordersExpanded} timeout="auto" unmountOnExit>
                  <Divider />
                  <CardContent sx={{ pt: 2 }}>
                    <Stack spacing={0}>
                      {detailData.orders.map((order, index) => (
                        <Box key={order.id}>
                          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                            <Stack sx={{ minWidth: 0, flex: 1 }}>
                              <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
                                <Typography variant="body2" sx={{ fontWeight: 400 }}>
                                  {order.orderNumber}
                                </Typography>
                                <Chip
                                  color={statusColorMap[order.status] || "default"}
                                  label={normalizeEnumText(OrderStatus[order.status] || order.status)}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontWeight: 400 }}
                                />
                              </Stack>
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.3, fontWeight: 400 }}>
                                {order.customer?.name || "—"}
                                {order.paymentStatus === "PAID" && " • Lunas"}
                                {order.paymentStatus === "REFUNDED" && " • Direfund"}
                                {" • "}{order.totalItems} item
                              </Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ fontWeight: 400 }} noWrap>
                              {formatToIdr(order.total)}
                            </Typography>
                          </Stack>
                          {index < detailData.orders.length - 1 && <Divider sx={{ my: 1.5 }} />}
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Collapse>
              </Card>
            )}

            {/* Pengeluaran */}
            {hasExpenses && (
              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  boxShadow: "none",
                  overflow: "hidden",
                }}
              >
                <Box
                  onClick={() => setExpensesExpanded(!expensesExpanded)}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    px: 2,
                    py: 2,
                    cursor: "pointer",
                    userSelect: "none",
                    transition: "background-color 0.15s ease",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.secondary.main, 0.04),
                    },
                  }}
                >
                  <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 400 }}>
                      Pengeluaran
                    </Typography>
                    <Chip
                      label={detailData.expenses.length}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 400 }}
                    />
                  </Stack>
                  <ChevronDown
                    size={16}
                    strokeWidth={1.5}
                    style={{
                      flexShrink: 0,
                      transition: "transform 0.2s ease",
                      transform: expensesExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      opacity: 0.5,
                    }}
                  />
                </Box>

                <Collapse in={expensesExpanded} timeout="auto" unmountOnExit>
                  <Divider />
                  <CardContent sx={{ pt: 2 }}>
                    <Stack spacing={0}>
                      {detailData.expenses.map((expense, index) => (
                        <Box key={expense.id}>
                          <Stack direction="row" sx={{ gap: 2, alignItems: "flex-start" }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: `${theme.shape.borderRadius}px`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: alpha(theme.palette.secondary.main, 0.08),
                                color: theme.palette.text.secondary,
                                flexShrink: 0,
                                fontSize: "0.875rem",
                                fontWeight: 400,
                                overflow: "hidden",
                              }}
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
                              <Typography variant="body2" sx={{ fontWeight: 400 }}>
                                {expense.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                                {normalizeEnumText(expense.category)} • {formatDateTime(expense.date)}
                              </Typography>
                            </Stack>
                            <Typography variant="body2" color="error.main" sx={{ fontWeight: 400 }} noWrap>
                              -{formatToIdr(expense.amount)}
                            </Typography>
                          </Stack>
                          {index < detailData.expenses.length - 1 && <Divider sx={{ my: 1.5 }} />}
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
        <Button variant="outlined" onClick={onClose} sx={{ fontWeight: 400 }}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShiftDetailDialog;