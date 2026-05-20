/**
 * OrderPaymentDialog - Dialog pembayaran untuk memproses pembayaran order via QRIS atau Tunai.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {Object} props.data - Data order untuk pembayaran
 * @param {string|number} [props.data.id] - ID Order
 * @param {number} [props.data.total] - Total jumlah order
 * @param {string} [props.data.orderNumber] - Nomor order
 * @param {Object} [props.data.customer] - Informasi customer
 * @param {string} [props.data.customer.name] - Nama customer
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {boolean} props.open - Status dialog terbuka
 *
 * @returns {JSX.Element} Dialog pembayaran order
 */
import { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { Controller } from "react-hook-form";
import { Banknote, Download, QrCode, X } from "lucide-react";
import LottieModule from "lottie-react";

import {
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
  IconButton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { PaymentMethod } from "@shared/constant";
import { formatToIdr, downloadFromUrl } from "@shared/utils";
import { useCreatePaymentMutation, usePaymentForm } from "@views/orders/hooks";
import { useSocket } from "@/hooks/useSocket.js";
import { showNotification } from "@store/notifications/notificationsSlice.js";
import successAnimation from "@assets/lottie/success.json";
import errorAnimation from "@assets/lottie/error.json";

const Lottie = LottieModule.default || LottieModule;

const OrderPaymentDialog = ({ data, onClose, open }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [step, setStep] = useState("payment");
  const [qrisData, setQrisData] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);

  const createPayment = useCreatePaymentMutation({
    onFailed: (error) => {
      dispatch(
        showNotification({
          message: error.message || "Gagal memproses pembayaran",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });
  const socketRef = useSocket();

  const {
    control,
    formState: { errors },
    handleSubmit,
    setValue,
    watch,
  } = usePaymentForm();

  const isSubmitting = createPayment.isPending;
  const selectedMethod = watch("method");
  const amountPaidValue = watch("amountPaid");
  const changeAmount = amountPaidValue - (data?.total || 0);

  useEffect(() => {
    if (open) {
      setStep("payment");
      setQrisData(null);
      setPaymentSuccess(false);
      setPaymentFailed(false);
      setValue("method", "QRIS");
      setValue("amountPaid", 0);
    }
  }, [open, setValue]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !data?.id || step !== "qris") return;

    const handler = (payload) => {
      if (payload.orderId === data.id) {
        if (payload.status === "PAID") {
          setPaymentSuccess(true);
        } else if (payload.status === "FAILED") {
          setPaymentFailed(true);
        }
      }
    };

    socket.on("payment:status", handler);

    return () => {
      socket.off("payment:status", handler);
    };
  }, [socketRef, data?.id, step]);

  /**
   * Handle perubahan metode pembayaran
   */
  const handleMethodChange = (method) => {
    setValue("method", method);
    setValue("amountPaid", 0);
  };

  /**
   * Handle tutup dialog dan reset state
   */
  const handleClose = () => {
    setStep("payment");
    setQrisData(null);
    setPaymentSuccess(false);
    setPaymentFailed(false);
    onClose?.();
  };

  /**
   * Handle submit pembayaran
   */
  const onSubmit = (formData) => {
    if (!data) return;

    const payload = {
      method: formData.method,
      orderId: data.id,
    };

    if (formData.method === PaymentMethod.CASH) {
      payload.amountPaid = Number(formData.amountPaid);
    }

    createPayment.mutate(payload, {
      onSuccess: (response) => {
        if (formData.method === PaymentMethod.QRIS) {
          setQrisData(response.data || response);
          setStep("qris");
        } else {
          dispatch(
            showNotification({
              message: "Pembayaran tunai berhasil!",
              type: "success",
              title: "Berhasil",
              variant: "snackbar",
              autoHide: 3000,
            })
          );
          handleClose();
        }
      },
      onError: () => {
        setPaymentFailed(true);
      },
    });
  };

  /**
   * Handle download QR code
   */
  const handleDownloadQr = useCallback(() => {
    if (!qrisData?.qrCodeUrl) return;
    downloadFromUrl(
      qrisData.qrCodeUrl,
      `QRIS-${data?.orderNumber || "payment"}.png`
    );
  }, [qrisData, data]);

  const renderPaymentStep = () => (
    <>
      <DialogContent>
        <Stack sx={{ gap: 3 }}>
          <Card
            sx={{
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
              bgcolor: alpha(theme.palette.secondary.main, 0.02),
              boxShadow: "none",
            }}
          >
            <CardContent sx={{ py: 2.5, "&:last-child": { pb: 2.5 } }}>
              <Stack sx={{ gap: 0.5, mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                  Total Tagihan
                </Typography>
                <Typography variant="h5" color="secondary" sx={{ fontWeight: 400 }}>
                  {formatToIdr(data?.total || 0)}
                </Typography>
              </Stack>
              <Divider sx={{ my: 1.5 }} />
              <Stack sx={{ gap: 1 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                    No. Order
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 400 }}>
                    {data?.orderNumber || "—"}
                  </Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
                    Pelanggan
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 400 }}>
                    {data?.customer?.name || "—"}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 400 }}>
              Metode Pembayaran
            </Typography>
            <Controller
              control={control}
              name="method"
              render={({ field }) => (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                  }}
                >
                  <Card
                    onClick={() => handleMethodChange(PaymentMethod.QRIS)}
                    sx={{
                      cursor: "pointer",
                      border: "1px solid",
                      borderColor:
                        field.value === PaymentMethod.QRIS
                          ? theme.palette.secondary.main
                          : alpha(theme.palette.divider, 0.6),
                      bgcolor:
                        field.value === PaymentMethod.QRIS
                          ? alpha(theme.palette.secondary.main, 0.06)
                          : "transparent",
                      boxShadow:
                        field.value === PaymentMethod.QRIS
                          ? `0 0 0 1px ${alpha(theme.palette.secondary.main, 0.3)}`
                          : "none",
                      transition: theme.transitions.create(["border-color", "background-color", "box-shadow"]),
                      "&:hover": {
                        borderColor:
                          field.value === PaymentMethod.QRIS
                            ? theme.palette.secondary.main
                            : alpha(theme.palette.secondary.main, 0.4),
                        bgcolor:
                          field.value === PaymentMethod.QRIS
                            ? alpha(theme.palette.secondary.main, 0.08)
                            : alpha(theme.palette.secondary.main, 0.03),
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        py: 3,
                        gap: 1.5,
                        "&:last-child": { pb: 3 },
                      }}
                    >
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: `${theme.shape.borderRadius}px`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor:
                            field.value === PaymentMethod.QRIS
                              ? alpha(theme.palette.secondary.main, 0.12)
                              : alpha(theme.palette.secondary.main, 0.05),
                          color:
                            field.value === PaymentMethod.QRIS
                              ? theme.palette.secondary.main
                              : theme.palette.text.secondary,
                          transition: theme.transitions.create(["background-color", "color"]),
                        }}
                      >
                        <QrCode size={24} strokeWidth={1.5} />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 400 }}>
                          QRIS
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                          Scan kode QR
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>

                  <Card
                    onClick={() => handleMethodChange(PaymentMethod.CASH)}
                    sx={{
                      cursor: "pointer",
                      border: "1px solid",
                      borderColor:
                        field.value === PaymentMethod.CASH
                          ? theme.palette.secondary.main
                          : alpha(theme.palette.divider, 0.6),
                      bgcolor:
                        field.value === PaymentMethod.CASH
                          ? alpha(theme.palette.secondary.main, 0.06)
                          : "transparent",
                      boxShadow:
                        field.value === PaymentMethod.CASH
                          ? `0 0 0 1px ${alpha(theme.palette.secondary.main, 0.3)}`
                          : "none",
                      transition: theme.transitions.create(["border-color", "background-color", "box-shadow"]),
                      "&:hover": {
                        borderColor:
                          field.value === PaymentMethod.CASH
                            ? theme.palette.secondary.main
                            : alpha(theme.palette.secondary.main, 0.4),
                        bgcolor:
                          field.value === PaymentMethod.CASH
                            ? alpha(theme.palette.secondary.main, 0.08)
                            : alpha(theme.palette.secondary.main, 0.03),
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        py: 3,
                        gap: 1.5,
                        "&:last-child": { pb: 3 },
                      }}
                    >
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: `${theme.shape.borderRadius}px`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor:
                            field.value === PaymentMethod.CASH
                              ? alpha(theme.palette.secondary.main, 0.12)
                              : alpha(theme.palette.secondary.main, 0.05),
                          color:
                            field.value === PaymentMethod.CASH
                              ? theme.palette.secondary.main
                              : theme.palette.text.secondary,
                          transition: theme.transitions.create(["background-color", "color"]),
                        }}
                      >
                        <Banknote size={24} strokeWidth={1.5} />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 400 }}>
                          Tunai
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                          Uang tunai
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              )}
            />
          </Box>

          {selectedMethod === PaymentMethod.CASH && (
            <Stack sx={{ gap: 2 }}>
              <Controller
                control={control}
                name="amountPaid"
                rules={{
                  required: "Jumlah dibayar wajib diisi",
                  min: { value: 1, message: "Minimal Rp 1" },
                  validate: (value) => {
                    if (!value || isNaN(value)) return "Masukkan angka yang valid";
                    if (Number(value) < (data?.total || 0)) return "Jumlah kurang dari total tagihan";
                    return true;
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    autoFocus
                    fullWidth
                    label="Jumlah Dibayar"
                    placeholder="Rp 0"
                    error={!!errors.amountPaid}
                    helperText={errors.amountPaid?.message}
                    value={field.value ? formatToIdr(field.value) : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      field.onChange(raw ? Number(raw) : "");
                    }}
                    slotProps={{
                      input: {
                        sx: { fontWeight: 400 },
                      },
                      inputLabel: {
                        sx: { fontWeight: 400 },
                      },
                      formHelperText: {
                        sx: { fontWeight: 400 },
                      },
                    }}
                  />
                )}
              />

              {amountPaidValue > 0 && (
                <Card
                  sx={{
                    border: "1px solid",
                    borderColor:
                      changeAmount >= 0
                        ? alpha(theme.palette.success.main, 0.3)
                        : alpha(theme.palette.error.main, 0.3),
                    bgcolor:
                      changeAmount >= 0
                        ? alpha(theme.palette.success.main, 0.04)
                        : alpha(theme.palette.error.main, 0.04),
                    boxShadow: "none",
                  }}
                >
                  <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" sx={{ fontWeight: 400 }}>
                        Kembalian
                      </Typography>
                      <Typography
                        variant="body2"
                        color={changeAmount >= 0 ? "success.main" : "error.main"}
                        sx={{ fontWeight: 400 }}
                      >
                        {formatToIdr(changeAmount)}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          color="inherit"
          variant="outlined"
          onClick={handleClose}
          sx={{ fontWeight: 400 }}
        >
          Batal
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={14} color="inherit" /> : null}
          sx={{
            fontWeight: 400,
            "&:hover": {
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.secondary.main, 0.3)}`,
            },
          }}
        >
          {isSubmitting ? "Memproses..." : "Bayar"}
        </Button>
      </DialogActions>
    </>
  );

  const renderQrisStep = () => (
    <>
      <DialogContent>
        <Stack sx={{ alignItems: "center", gap: 4 }}>
          {paymentSuccess ? (
            <>
              <Box sx={{ width: 160, height: 160 }}>
                <Lottie animationData={successAnimation} loop={false} autoplay />
              </Box>
              <Stack sx={{ alignItems: "center", gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 400 }}>
                  Pembayaran Berhasil
                </Typography>
                <Typography color="text.secondary" textAlign="center" variant="body2" sx={{ fontWeight: 400 }}>
                  Pembayaran untuk pesanan ini telah diterima
                </Typography>
              </Stack>
            </>
          ) : paymentFailed ? (
            <>
              <Box sx={{ width: 160, height: 160 }}>
                <Lottie animationData={errorAnimation} loop={false} autoplay />
              </Box>
              <Stack sx={{ alignItems: "center", gap: 1 }}>
                <Typography variant="h6" color="error" sx={{ fontWeight: 400 }}>
                  Pembayaran Gagal
                </Typography>
                <Typography color="text.secondary" textAlign="center" variant="body2" sx={{ fontWeight: 400 }}>
                  Silakan coba lagi atau gunakan metode pembayaran lain
                </Typography>
              </Stack>
            </>
          ) : (
            <>
              <Stack sx={{ alignItems: "center", gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 400 }}>
                  Scan QR Code
                </Typography>
                <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 400 }}>
                  Gunakan aplikasi pembayaran yang mendukung QRIS
                </Typography>
              </Stack>

              {qrisData?.qrCodeUrl ? (
                <Box
                  component="img"
                  src={qrisData.qrCodeUrl}
                  alt="QR Code Pembayaran"
                  sx={{
                    width: "100%",
                    maxWidth: 280,
                    aspectRatio: "1/1",
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: `${theme.shape.borderRadius}px`,
                    p: 2,
                  }}
                />
              ) : (
                <Typography color="error" variant="body2" sx={{ fontWeight: 400 }}>
                  Gagal memuat QR code
                </Typography>
              )}

              <Chip
                label={`Total: ${formatToIdr(qrisData?.amount || data?.total || 0)}`}
                variant="outlined"
                sx={{ fontWeight: 400 }}
              />
            </>
          )}
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        {!paymentSuccess && !paymentFailed && qrisData?.qrCodeUrl && (
          <Button
            color="inherit"
            variant="outlined"
            onClick={handleDownloadQr}
            sx={{ fontWeight: 400 }}
          >
            <Download size={14} strokeWidth={1.5} />
            <Box component="span" sx={{ ml: 1 }}>
              Download QR
            </Box>
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          onClick={handleClose}
          sx={{
            fontWeight: 400,
            "&:hover": {
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.secondary.main, 0.3)}`,
            },
          }}
        >
          {paymentSuccess ? "Selesai" : paymentFailed ? "Kembali" : "Tutup"}
        </Button>
      </DialogActions>
    </>
  );

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={handleClose}
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
        {step === "qris" ? "Pembayaran QRIS" : "Pembayaran"}
        <IconButton onClick={handleClose} size="small">
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      {step === "qris" ? renderQrisStep() : renderPaymentStep()}
    </Dialog>
  );
};

export default OrderPaymentDialog;