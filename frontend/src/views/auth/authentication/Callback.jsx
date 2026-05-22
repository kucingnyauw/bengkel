import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Typography, CircularProgress, Box, Fade } from "@mui/material";
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
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          maxWidth={360}
        >
          <CircularProgress
            size={32}
            thickness={3}
            sx={{ mb: 2, color: theme.palette.secondary.main }}
          />
          <Typography variant="body1" sx={{ fontWeight: 400 }}>
            Memverifikasi...
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, fontWeight: 400 }}>
            Mohon tunggu sebentar
          </Typography>
        </Box>
      </Fade>
    </AuthWrapper>
  );
};

export default Callback;