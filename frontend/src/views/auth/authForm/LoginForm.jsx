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

/**
 * Form component for email-based passwordless login.
 *
 * @param {Object} props
 * @param {function} props.onEmailSubmit - Callback fired with the submitted email.
 * @param {boolean} props.isLoading - Whether the form is in a loading/submitting state.
 */
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
    if (isLoading) return;
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
        pointerEvents: isLoading ? "none" : "auto",
        opacity: isLoading ? 0.7 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      <Box
        component="img"
        src={INFO.logoUrl}
        alt={INFO.name}
        sx={{
          height: 48,
          width: "auto",
          maxWidth: 140,
          objectFit: "contain",
          mb: 4,
        }}
      />

      <Stack sx={{ gap: 1, textAlign: "center", mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, letterSpacing: "-0.01em" }}>
          Selamat Datang
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Masukkan email Anda untuk masuk ke akun
        </Typography>
      </Stack>

      <Box sx={{ width: "100%", mb: 3 }}>
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

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={!isValid || isLoading}
        size="large"
        sx={{ mb: 4 }}
      >
        {isLoading ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          "Lanjutkan dengan Email"
        )}
      </Button>

      <Divider sx={{ width: "100%", mb: 4 }}>
        <Typography variant="caption" color="text.disabled" sx={{ px: 1.5 }}>
          INFO
        </Typography>
      </Divider>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textAlign: "center", mb: 6, lineHeight: 1.8 }}
      >
        Kami akan mengirimkan tautan login ke email Anda.
        <br />
        Tidak perlu password!
      </Typography>
    </Box>
  );
};

export default LoginForm;