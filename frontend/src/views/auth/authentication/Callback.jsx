/**
 * Callback - Authentication callback page for verifying Supabase session.
 *
 * @component
 * @returns {JSX.Element} Rendered callback page
 */
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Typography, CircularProgress, Box, Fade, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { verifyCallbackSession } from "@api/supabaseApi.js";
import AuthWrapper from "@views/auth/authWrapper/AuthWrapper.jsx";

const Callback = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        await verifyCallbackSession();
        navigate("/dashboard", { replace: true });
      } catch {
        setTimeout(() => navigate("/login", { replace: true }), 3000);
      }
    };

    processAuth();
  }, [navigate]);

  return (
    <AuthWrapper>
      <Fade in timeout={600}>
        <Stack
          spacing={2}
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          sx={{ maxWidth: 360, px: 2 }}
        >
          <CircularProgress
            size={36}
            thickness={3}
            sx={{ color: theme.palette.secondary.main }}
          />
          <Stack spacing={0.5} alignItems="center">
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              Memverifikasi...
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Mohon tunggu sebentar
            </Typography>
          </Stack>
        </Stack>
      </Fade>
    </AuthWrapper>
  );
};

export default Callback;