import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  Button,
  CircularProgress,
  Skeleton,
  Divider,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { getSettings, bulkUpdateSettings } from "@api/settingApi.js";
import { STALE_TIME } from "@shared/constant";
import { formatToIdr } from "@shared/utils";

const labelMap = {
  tax_rate: "Tarif Pajak (%)",
  mechanic_max_tasks: "Maksimal Tugas Mekanik",
  shift_min_starting_cash: "Minimal Saldo Awal Shift",
  stock_low_threshold: "Batas Stok Rendah",
};

const helperMap = {
  tax_rate: "Persentase pajak yang diterapkan ke setiap pesanan",
  mechanic_max_tasks:
    "Jumlah maksimal tugas yang bisa dikerjakan satu mekanik secara bersamaan",
  shift_min_starting_cash:
    "Saldo minimal yang harus disiapkan kasir saat membuka shift",
  stock_low_threshold: "Batas minimum stok sebelum produk dianggap stok rendah",
};

const validationRules = {
  tax_rate: {
    required: "Wajib diisi",
    min: { value: 0, message: "Minimal 0" },
    max: { value: 100, message: "Maksimal 100" },
  },
  mechanic_max_tasks: {
    required: "Wajib diisi",
    min: { value: 1, message: "Minimal 1" },
  },
  shift_min_starting_cash: {
    required: "Wajib diisi",
    min: { value: 1000, message: "Minimal Rp 1.000" },
  },
  stock_low_threshold: {
    required: "Wajib diisi",
    min: { value: 1, message: "Minimal 1" },
  },
};

const currencyFields = ["shift_min_starting_cash"];

const SettingsSkeleton = () => (
  <Card>
    <CardContent>
      <Stack sx={{ gap: 1 }}>
        <Skeleton variant="rounded" height={36} width="40%" />
        <Skeleton variant="rounded" height={20} width="60%" />
      </Stack>
      <Stack sx={{ gap: 2, mt: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rounded" height={80} />
        ))}
      </Stack>
    </CardContent>
  </Card>
);

const Settings = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
    staleTime: STALE_TIME,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm();

  const bulkUpdate = useMutation({
    mutationFn: bulkUpdateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      window.location.reload();
    },
  });

  const isSubmitting = bulkUpdate.isPending;

  useEffect(() => {
    if (settings?.length) {
      const defaults = {};
      settings.forEach((s) => {
        defaults[s.key] = s.value;
      });
      reset(defaults);
    }
  }, [settings, reset]);

  const onSubmit = (formData) => {
    const payload = Object.entries(formData).map(([key, value]) => ({
      key,
      value,
    }));

    if (payload.length > 0) {
      bulkUpdate.mutate(payload);
    }
  };

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ maxWidth: 720, mx: "auto" }}
    >
      <Card>
        <CardContent>
          {/* Header */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            sx={{
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              gap: theme.spacing(2),
              mb: theme.spacing(3),
            }}
          >
            <Box>
              <Typography variant="h5">Pengaturan Sistem</Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Konfigurasi parameter operasional bengkel
              </Typography>
            </Box>

            <Button
              type="submit"
              variant="contained"
              disabled={!isDirty || isSubmitting}
              sx={{ minWidth: 140, flexShrink: 0 }}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={14} color="inherit" />
                ) : null
              }
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </Stack>

          <Divider />

          {/* Setting Items */}
          <Stack divider={<Divider />}>
            {settings?.map((setting) => (
              <Stack
                key={setting.id}
                direction={{ xs: "column", sm: "row" }}
                sx={{
                  justifyContent: "space-between",
                  alignItems: { xs: "stretch", sm: "center" },
                  gap: theme.spacing(2),
                  py: theme.spacing(2.5),
                }}
              >
                {/* Label & Helper */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1">
                    {labelMap[setting.key] || setting.key}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {helperMap[setting.key] || ""}
                  </Typography>
                </Box>

                {/* Input */}
                <Controller
                  name={setting.key}
                  control={control}
                  rules={validationRules[setting.key] || {}}
                  render={({ field, fieldState }) => (
                    <TextField
                      size="small"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      value={
                        currencyFields.includes(setting.key)
                          ? field.value
                            ? formatToIdr(field.value)
                            : ""
                          : field.value ?? ""
                      }
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        field.onChange(raw ? Number(raw) : "");
                      }}
                      sx={{
                        width: { xs: "100%", sm: 200 },
                        flexShrink: 0,
                      }}
                      slotProps={{
                        input: {
                          endAdornment:
                            setting.key === "tax_rate" ? (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                %
                              </Typography>
                            ) : null,
                        },
                      }}
                    />
                  )}
                />
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Settings;