/**
 * HeaderCart - Cart dialog for managing order items, customer selection, and checkout.
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.open - Dialog open state
 * @param {Function} props.onClose - Close handler
 *
 * @returns {JSX.Element} Rendered header cart dialog
 */
import { useState } from "react";
import { Controller } from "react-hook-form";
import { Minus, Plus, Trash2, X } from "lucide-react";

import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { getCustomers } from "@api/customerApi.js";
import { formatToIdr } from "@shared/utils";
import { ProductType } from "@shared/constant";
import { useDevice, useDebounce } from "@hooks";
import { AsyncAutocomplete } from "@components";
import { useHeaderCart } from "../hooks/useHeaderCart";

const EmptyCartSvg = ({ opacity = 0.15 }) => (
  <Box
    component="svg"
    viewBox="0 0 120 120"
    sx={{
      width: 100,
      height: 100,
      opacity,
    }}
  >
    {/* Shopping Bag Body */}
    <path
      d="M35 40 L35 30 C35 16.2 46.2 5 60 5 C73.8 5 85 16.2 85 30 L85 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Shopping Bag */}
    <rect
      x="25"
      y="40"
      width="70"
      height="65"
      rx="8"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    />
    {/* Handle */}
    <path
      d="M40 40 L40 25 C40 17.8 37 12 30 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M80 40 L80 25 C80 17.8 83 12 90 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Smiley Face */}
    <circle cx="60" cy="68" r="16" fill="none" stroke="currentColor" strokeWidth="2.5" />
    <circle cx="54" cy="65" r="2" fill="currentColor" />
    <circle cx="66" cy="65" r="2" fill="currentColor" />
    <path
      d="M54 73 Q60 78 66 73"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Box>
);

const QuantityControl = ({ quantity, maxLimit, onChange, disabled }) => {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "center",
        gap: 0.5,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: `${theme.shape.borderRadius}px`,
        bgcolor: "background.paper",
      }}
    >
      <IconButton
        size="small"
        onClick={() => onChange(-1)}
        disabled={disabled || quantity <= 1}
      >
        <Minus size={14} strokeWidth={1.5} />
      </IconButton>
      <Typography
        variant="body2"
        sx={{
          minWidth: 28,
          textAlign: "center",
          userSelect: "none",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {quantity}
      </Typography>
      <IconButton
        size="small"
        onClick={() => onChange(1)}
        disabled={disabled || quantity >= maxLimit}
      >
        <Plus size={14} strokeWidth={1.5} />
      </IconButton>
    </Stack>
  );
};

const CartItemCard = ({ item, onRemove, onQuantityChange, disabled }) => {
  const theme = useTheme();
  const isSparepart = item.type === ProductType.SPAREPART;
  const maxLimit = item.maxQuantity || item.productStock || 999;
  const itemTotal = (item.unitPrice || 0) * item.quantity;

  return (
    <Card
      sx={{
        opacity: disabled ? 0.5 : 1,
        transition: theme.transitions.create("opacity"),
      }}
    >
      <CardContent>
        <Stack direction="row" sx={{ alignItems: "flex-start", gap: 2 }}>
          <Avatar
            alt={item.productName}
            src={item.image?.url || ""}
            variant="rounded"
            sx={(theme) => ({
              width: 48,
              height: 48,
              flexShrink: 0,
              borderRadius: `${theme.shape.borderRadius}px`,
              bgcolor: !item.image?.url
                ? alpha(theme.palette.secondary.main, 0.08)
                : "transparent",
              color: !item.image?.url
                ? theme.palette.secondary.main
                : "transparent",
              fontSize: "0.9375rem",
            })}
          >
            {!item.image?.url && item.productName?.charAt(0)?.toUpperCase()}
          </Avatar>

          <Stack sx={{ minWidth: 0, flex: 1, gap: 1 }}>
            <Stack
              direction="row"
              sx={{
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <Stack sx={{ minWidth: 0, gap: 0.5 }}>
                <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
                  <Chip
                    label={
                      item.type === ProductType.SERVICE
                        ? "Servis"
                        : "Sparepart"
                    }
                    size="small"
                    variant="outlined"
                    color={
                      item.type === ProductType.SERVICE
                        ? "secondary"
                        : "warning"
                    }
                    sx={{ height: 22 }}
                  />
                  <Typography variant="body2" noWrap>
                    {item.productName}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {formatToIdr(item.unitPrice || 0)} × {item.quantity}
                </Typography>
              </Stack>

              <Stack
                sx={{
                  alignItems: "flex-end",
                  gap: 1,
                  flexShrink: 0,
                  ml: 1,
                }}
              >
                {/* Delete Button dengan background & border */}
                <Box
                  component="span"
                  sx={(theme) => ({
                    display: "inline-flex",
                    borderRadius: `${theme.shape.borderRadius}px`,
                    border: "1px solid",
                    borderColor: alpha(theme.palette.divider, 0.8),
                    bgcolor: alpha(theme.palette.background.paper, 0.6),
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
                  <IconButton
                    size="small"
                    onClick={() => onRemove(item.productId)}
                    disabled={disabled}
                    sx={{
                      borderRadius: "inherit",
                      color: "inherit",
                    }}
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </IconButton>
                </Box>
                <Typography variant="body2">
                  {formatToIdr(itemTotal)}
                </Typography>
              </Stack>
            </Stack>

            {isSparepart && (
              <Stack
                direction="row"
                sx={{
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <QuantityControl
                  quantity={item.quantity}
                  maxLimit={maxLimit}
                  onChange={(inc) =>
                    onQuantityChange(item.productId, item.quantity, inc)
                  }
                  disabled={disabled}
                />
                <Typography variant="caption" color="text.disabled">
                  Stok: {maxLimit}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

const PriceRow = ({ label, value, isPending, skeletonWidth = 80, bold, color }) => (
  <Stack
    direction="row"
    sx={{ justifyContent: "space-between", alignItems: "center" }}
  >
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    {isPending ? (
      <Skeleton width={skeletonWidth} height={20} />
    ) : (
      <Typography
        variant={bold ? "subtitle1" : "body2"}
        sx={{ fontVariantNumeric: "tabular-nums" }}
        color={color}
      >
        {formatToIdr(value)}
      </Typography>
    )}
  </Stack>
);

const HeaderCart = ({ open, onClose }) => {
  const theme = useTheme();
  const { isMobile } = useDevice();
  const [customerSearch, setCustomerSearch] = useState("");
  const debouncedCustomerSearch = useDebounce(customerSearch);

  const {
    control,
    handleSubmit,
    setValue,
    selectedCustomer,
    customerVehicles,
    items,
    isCalculatePending,
    isSubmitting,
    calcData,
    handleIncrement,
    handleDecrement,
    handleRemoveItem,
    onSubmit,
  } = useHeaderCart(open, onClose);

  const isProcessing = isSubmitting || isCalculatePending;

  const handleQuantityChange = (productId, currentQty, inc) => {
    if (inc > 0) {
      handleIncrement(productId);
    } else {
      handleDecrement(productId);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isProcessing ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: {
            borderRadius: isMobile ? 0 : `${theme.shape.borderRadius}px`,
            border: isMobile
              ? "none"
              : `1px solid ${theme.palette.divider}`,
          },
        },
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          display: "flex",
          flexDirection: "column",
          height: isMobile ? "100%" : "85vh",
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            px: theme.spacing(3),
            py: theme.spacing(2),
            borderBottom: `1px solid ${theme.palette.divider}`,
            flexShrink: 0,
          }}
        >
          <Typography variant="h6">Keranjang</Typography>
          <IconButton onClick={onClose} disabled={isProcessing}>
            <X size={18} strokeWidth={1.5} />
          </IconButton>
        </Stack>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: "auto", p: theme.spacing(3) }}>
          {items.length === 0 ? (
            <Stack
              sx={{
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                gap: theme.spacing(2),
              }}
            >
              <EmptyCartSvg />
              <Stack sx={{ gap: theme.spacing(1), alignItems: "center" }}>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  Keranjang masih kosong
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Tambahkan item untuk memulai transaksi
                </Typography>
              </Stack>
            </Stack>
          ) : (
            <Stack sx={{ gap: theme.spacing(3) }}>
              {/* Customer Section */}
              <Card>
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: theme.spacing(2) }}
                  >
                    Pelanggan
                  </Typography>

                  <Controller
                    name="customer"
                    control={control}
                    render={({ field }) => (
                      <AsyncAutocomplete
                        value={field.value}
                        onChange={(val) => {
                          field.onChange(val);
                          setValue("vehicle", null);
                        }}
                        onInputChange={setCustomerSearch}
                        queryKey={["customers-list"]}
                        fetchOptions={async (search) => {
                          const res = await getCustomers({
                            page: 1,
                            limit: 10,
                            search,
                          });
                          return res?.data || [];
                        }}
                        getOptionLabel={(o) => o?.name || ""}
                        placeholder="Cari pelanggan..."
                        disabled={isProcessing}
                        renderOption={(props, option) => {
                          const { key, ...rest } = props;
                          return (
                            <Box key={key} component="li" {...rest}>
                              <Stack>
                                <Typography variant="body2">
                                  {option.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {option.phone || "—"}
                                </Typography>
                              </Stack>
                            </Box>
                          );
                        }}
                      />
                    )}
                  />

                  {selectedCustomer && (
                    <Box sx={{ mt: theme.spacing(2) }}>
                      <Controller
                        name="vehicle"
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            size="small"
                            options={customerVehicles}
                            getOptionLabel={(o) =>
                              o.plateNumber || o.brand || ""
                            }
                            value={field.value}
                            onChange={(_, v) => field.onChange(v)}
                            disabled={
                              !customerVehicles.length || isProcessing
                            }
                            isOptionEqualToValue={(a, b) => a.id === b.id}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder="Pilih kendaraan"
                              />
                            )}
                            renderOption={(props, option) => (
                              <li {...props}>
                                <Stack>
                                  <Typography variant="body2">
                                    {option.plateNumber || option.brand}
                                  </Typography>
                                  {option.brand && option.model && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {option.brand} {option.model}
                                    </Typography>
                                  )}
                                </Stack>
                              </li>
                            )}
                          />
                        )}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Items Section */}
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: theme.spacing(2) }}
                >
                  Item ({items.length})
                </Typography>
                <Stack sx={{ gap: theme.spacing(1.5) }}>
                  {items.map((item, i) => (
                    <CartItemCard
                      key={item.productId || i}
                      item={item}
                      onRemove={handleRemoveItem}
                      onQuantityChange={handleQuantityChange}
                      disabled={isProcessing}
                    />
                  ))}
                </Stack>
              </Box>
            </Stack>
          )}
        </Box>

        {/* Footer */}
        {items.length > 0 && (
          <Stack
            sx={(theme) => ({
              p: theme.spacing(3),
              borderTop: `1px solid ${theme.palette.divider}`,
              gap: theme.spacing(2.5),
              flexShrink: 0,
              bgcolor: alpha(theme.palette.secondary.main, 0.02),
            })}
          >
            <Stack sx={{ gap: theme.spacing(1.5) }}>
              <PriceRow
                label="Subtotal"
                value={calcData.subtotal || 0}
                isPending={isCalculatePending}
              />
              <PriceRow
                label="Pajak"
                value={calcData.tax || 0}
                isPending={isCalculatePending}
              />
              <Divider />
              <PriceRow
                label="Total"
                value={calcData.total || 0}
                isPending={isCalculatePending}
                skeletonWidth={120}
                bold
                color="secondary.main"
              />
            </Stack>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={!items.length || isProcessing}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={14} color="inherit" sx={{ mr: 1 }} />
                  Memproses...
                </>
              ) : (
                "Proses Pemesanan"
              )}
            </Button>
          </Stack>
        )}
      </Box>
    </Dialog>
  );
};

export default HeaderCart;