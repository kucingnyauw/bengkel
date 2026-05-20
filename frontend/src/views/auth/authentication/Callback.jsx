import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Typography, CircularProgress, Box, Fade } from "@mui/material";
import supabase from "@lib/supabase.js";
import AuthWrapper from "@views/auth/authWrapper/AuthWrapper.jsx";

const Callback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState({ loading: true, error: null });
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const currentHash = window.location.hash;
      const params = new URLSearchParams(currentHash.replace(/^#/, ""));
      const errorDesc = params.get("error_description");
      const accessToken = params.get("access_token");

      const handleError = (message) => {
        setStatus({ loading: false, error: message });
        setTimeout(() => navigate("/login", { replace: true }), 3000);
      };

      if (errorDesc) {
        return handleError(decodeURIComponent(errorDesc.replace(/\+/g, " ")));
      }

      if (!accessToken) {
        return navigate("/login", { replace: true });
      }

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        return handleError("Sesi tidak valid atau telah kedaluwarsa.");
      }

      navigate("/dashboard", { replace: true });
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
          {status.loading ? (
            <>
              <CircularProgress 
                size={32} 
                thickness={3} 
                sx={{ mb: 2, color: "text.primary" }} 
              />
              <Typography variant="body1" fontWeight={500} color="text.primary">
                Memverifikasi...
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="body1" fontWeight={600} color="error.main" gutterBottom>
                Verifikasi Gagal
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {status.error}
              </Typography>
              <Typography variant="caption" color="text.disabled" letterSpacing={0.5}>
                MENGALIHKAN...
              </Typography>
            </>
          )}
        </Box>
      </Fade>
    </AuthWrapper>
  );
};

export default Callback;