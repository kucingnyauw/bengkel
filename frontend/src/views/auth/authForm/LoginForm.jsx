import {
  Stack,
  Typography,
  Button,
  TextField,
  Box,
  CircularProgress,
  Divider,
  useTheme,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";

import INFO from "@data/Info.js";

const LoginForm = ({ onEmailSubmit, isLoading }) => {
  const theme = useTheme();

  const {
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
    defaultValues: { email: "" },
  });

  const submit = (data) => {
    onEmailSubmit?.(data.email);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(submit)}
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Logo */}
      <Box
        component="img"
        src={INFO.logoUrl}
        alt={INFO.name}
        sx={{
          height: 48,
          width: "auto",
          maxWidth: 140,
          objectFit: "contain",
          mb: theme.spacing(4),
        }}
      />

      {/* Title & Subtitle */}
      <Stack sx={{ gap: 1, textAlign: "center", mb: theme.spacing(4) }}>
        <Typography variant="h5" sx={{ fontWeight: 600, letterSpacing: "-0.01em" }}>
          Selamat Datang
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
          Masukkan email Anda untuk masuk ke akun
        </Typography>
      </Stack>

      {/* Input */}
      <Box sx={{ width: "100%", mb: theme.spacing(3) }}>
        <Controller
          name="email"
          control={control}
          rules={{
            required: "Email wajib diisi",
            pattern: {
              value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
              message: "Format email tidak valid",
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              autoFocus
              label="Alamat Email"
              type="email"
              disabled={isLoading}
              error={!!errors.email}
              helperText={errors.email?.message}
              placeholder="anda@example.com"
            />
          )}
        />
      </Box>

      {/* Action */}
      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={!isValid || isLoading}
        size="large"
        sx={{ mb: theme.spacing(4) }}
      >
        {isLoading ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          "Lanjutkan dengan Email"
        )}
      </Button>

      {/* Divider */}
      <Divider sx={{ width: "100%", mb: theme.spacing(4) }}>
        <Typography variant="caption" color="text.disabled" sx={{ px: 1.5 }}>
          INFO
        </Typography>
      </Divider>

      {/* Instruksi */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textAlign: "center", fontWeight: 400, mb: theme.spacing(6), lineHeight: 1.8 }}
      >
        Kami akan mengirimkan{" "}
        <Box component="span" sx={{ color: "secondary.main", fontWeight: 500 }}>
          tautan login
        </Box>{" "}
        ke email Anda.
        <br />
        <Box component="span" sx={{ color: "success.main", fontWeight: 500 }}>
          Tidak perlu password!
        </Box>
      </Typography>
    </Box>
  );
};

export default LoginForm;