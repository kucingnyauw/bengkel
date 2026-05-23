import {
  Stack,
  Typography,
  Button,
  TextField,
  Box,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { Controller, useForm } from "react-hook-form";

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
        justifyContent: "center",
      }}
    >
      <Stack
        spacing={6}
        sx={{
          width: "100%",
          maxWidth: 380,
          mx: "auto",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Stack spacing={1} sx={{ mb: 6 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            Selamat Datang
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Masukkan email Anda untuk masuk ke akun
          </Typography>
        </Stack>

        <Box sx={{ width: "100%" }}>
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
          sx={{
            height: 48,
            textTransform: "none",
            borderRadius: `${theme.shape.borderRadius}px`,
            "&:hover": {
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.secondary.main, 0.3)}`,
            },
          }}
        >
          {isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            "Lanjutkan dengan Email"
          )}
        </Button>
      </Stack>
    </Box>
  );
};

export default LoginForm;