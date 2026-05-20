import {
  Stack,
  Typography,
  Button,
  TextField,
  Box,
  Divider,
} from "@mui/material";

import { Controller, useForm } from "react-hook-form";

const LoginForm = ({ onEmailSubmit, onGoogleSubmit, isLoading }) => {
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
            Welcome Back
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Enter your email to sign in to your account
          </Typography>
        </Stack>

        <Box sx={{ width: "100%" }}>
          <Controller
            name="email"
            control={control}
            rules={{
              required: "Email is required",
              pattern: {
                value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
                message: "Invalid email format",
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Email Address"
                type="email"
                disabled={isLoading}
                error={!!errors.email}
                helperText={errors.email?.message}
                placeholder="you@example.com"
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
          }}
        >
          {isLoading ? "Sending..." : "Continue with Email"}
        </Button>

        <Box
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Divider sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.secondary">
            OR
          </Typography>
          <Divider sx={{ flex: 1 }} />
        </Box>

        <Button
          variant="outlined"
          fullWidth
          onClick={onGoogleSubmit}
          disabled={isLoading}
          sx={{
            height: 48,
            textTransform: "none",
            gap: 1,
          }}
          startIcon={
            <img
              src="https://img.icons8.com/color/48/google-logo.png"
              alt="google"
              width={18}
              height={18}
            />
          }
        >
          Continue with Google
        </Button>
      </Stack>
    </Box>
  );
};

export default LoginForm;