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
import { ProductType, productTypeColorMap } from "@shared/constant";
import { useDevice, useDebounce } from "@hooks";
import { AsyncAutocomplete } from "@components";
import { useHeaderCart } from "../hooks/useHeaderCart";

const QuantityControl = ({ quantity, maxLimit, onChange, disabled }) => (
  <Stack
    direction="row"
    sx={{
      alignItems: "center",
      gap: 0.5,
      border: 1,
      borderColor: "divider",
      borderRadius: 1,
    }}
  >
    <IconButton
      size="small"
      onClick={() => onChange(-1)}
      disabled={disabled || quantity <= 1}
    >
      <Minus size={14} />
    </IconButton>
    <Typography
      variant="body2"
      fontWeight={600}
      sx={{ minWidth: 24, textAlign: "center", userSelect: "none" }}
    >
      {quantity}
    </Typography>
    <IconButton
      size="small"
      onClick={() => onChange(1)}
      disabled={disabled || quantity >= maxLimit}
    >
      <Plus size={14} />
    </IconButton>
  </Stack>
);

const CartItemCard = ({ item, onRemove, onQuantityChange, disabled }) => {
  const theme = useTheme();
  const isSparepart = item.type === ProductType.SPAREPART;
  const maxLimit = item.maxQuantity || item.productStock || 999;

  return (
    <Card
      variant="outlined"
      sx={{
        opacity: disabled ? 0.5 : 1,
        transition: theme.transitions.create("opacity"),
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Stack direction="row" sx={{ alignItems: "flex-start", gap: 2 }}>
          <Avatar
            alt={item.productName}
            src={item.image?.url || ""}
            variant="rounded"
            sx={{
              width: 56,
              height: 56,
              flexShrink: 0,
              bgcolor: !item.image?.url
                ? alpha(theme.palette.text.primary, 0.06)
                : "transparent",
              color: !item.image?.url
                ? theme.palette.text.secondary
                : "transparent",
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            {!item.image?.url && item.productName?.charAt(0)?.toUpperCase()}
          </Avatar>

          <Stack sx={{ minWidth: 0, flex: 1, gap: 1 }}>
            <Stack
              direction="row"
              sx={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <Stack
                direction="row"
                sx={{ alignItems: "center", gap: 1, minWidth: 0 }}
              >
                <Chip
                  label={
                    item.type === ProductType.SERVICE ? "Jasa" : "Sparepart"
                  }
                  size="small"
                  variant="outlined"
                  color={productTypeColorMap[item.type] || "default"}
                />
                <Typography variant="body2" fontWeight={600} noWrap>
                  {item.productName}
                </Typography>
              </Stack>

              <IconButton
                size="small"
                onClick={() => onRemove(item.productId)}
                disabled={disabled}
                sx={{
                  ml: 1,
                  "&:hover": {
                    color: "error.main",
                    bgcolor: alpha(theme.palette.error.main, 0.08),
                  },
                }}
              >
                <Trash2 size={14} />
              </IconButton>
            </Stack>

            <Stack
              direction="row"
              sx={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <Typography variant="body2" color="text.secondary">
                {formatToIdr(item.unitPrice || 0)} × {item.quantity}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatToIdr((item.unitPrice || 0) * item.quantity)}
              </Typography>
            </Stack>

            {isSparepart && (
              <Stack
                direction="row"
                sx={{ alignItems: "center", justifyContent: "space-between" }}
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

const PriceRow = ({
  label,
  value,
  isPending,
  skeletonWidth = 80,
  bold,
  color,
}) => (
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
        fontWeight={bold ? 700 : 500}
        color={color}
      >
        {formatToIdr(value)}
      </Typography>
    )}
  </Stack>
);

const HeaderCart = ({ open, onClose }) => {
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
    handleQuantityChange,
    handleRemoveItem,
    onSubmit,
  } = useHeaderCart(open, onClose);

  const isProcessing = isSubmitting || isCalculatePending;

  return (
    <Dialog
      open={open}
      onClose={isProcessing ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
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
            px: 3,
            py: 2.5,
            borderBottom: `1px solid ${alpha(useTheme().palette.divider, 0.8)}`,
            flexShrink: 0,
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Keranjang
          </Typography>
          <IconButton onClick={onClose} disabled={isProcessing}>
            <X size={18} />
          </IconButton>
        </Stack>

        <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
          {items.length === 0 ? (
            <Stack
              sx={{
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
              }}
            >
              <Typography variant="body1" color="text.secondary">
                Keranjang masih kosong
              </Typography>
              <Typography variant="caption" color="text.disabled">
                Tambahkan item untuk memulai transaksi
              </Typography>
            </Stack>
          ) : (
            <Stack sx={{ gap: 4 }}>
              <Stack sx={{ gap: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={600}>
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
                              <Typography variant="body2" fontWeight={500}>
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
                  <Controller
                    name="vehicle"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        size="small"
                        options={customerVehicles}
                        getOptionLabel={(o) => o.plateNumber || o.brand || ""}
                        value={field.value}
                        onChange={(_, v) => field.onChange(v)}
                        disabled={!customerVehicles.length || isProcessing}
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
                              <Typography variant="body2" fontWeight={500}>
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
                )}
              </Stack>

              <Stack sx={{ gap: 2 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Item ({items.length})
                </Typography>

                <Stack sx={{ gap: 2 }}>
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
              </Stack>
            </Stack>
          )}
        </Box>

        {items.length > 0 && (
          <Stack
            sx={{
              p: 3,
              borderTop: 1,
              borderColor: "divider",
              gap: 2.5,
              flexShrink: 0,
            }}
          >
            <Stack sx={{ gap: 1.5 }}>
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
                color="primary.main"
              />
            </Stack>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={!items.length || isProcessing}
              sx={{ py: 1.5 }}
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
