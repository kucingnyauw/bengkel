/**
 * ErrorBoundary - Komponen pembatas error untuk React Router dengan fallback UI yang informatif.
 *
 * @component
 * @returns {JSX.Element} Rendered error boundary route
 */
import { useRouteError } from "react-router-dom";
import { AlertTriangle, RefreshCw } from "lucide-react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

const ErrorBoundary = () => {
  const theme = useTheme();
  const error = useRouteError();

  const isDev = import.meta.env.DEV;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 4,
        bgcolor: alpha(theme.palette.background.default, 0.98),
      }}
    >
      <Card
        sx={{
          maxWidth: 520,
          width: "100%",
          textAlign: "center",
          borderRadius: `${theme.shape.borderRadius}px`,
          border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          boxShadow: "none",
        }}
      >
        <CardContent sx={{ p: 5 }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.error.main, 0.08),
              color: "error.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 3,
            }}
          >
            <AlertTriangle size={32} strokeWidth={1.5} />
          </Box>

          <Typography variant="h5" sx={{ mb: 1, fontWeight: 400 }}>
            Terjadi Kesalahan
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 400 }}>
            Maaf, terjadi kesalahan yang tidak terduga. Silakan coba muat ulang halaman.
          </Typography>

          {isDev && error && (
            <Box
              sx={{
                mt: 2,
                mb: 3,
                p: 2,
                borderRadius: `${theme.shape.borderRadius}px`,
                bgcolor: alpha(theme.palette.error.main, 0.04),
                border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`,
                textAlign: "left",
                maxHeight: 200,
                overflow: "auto",
              }}
            >
              <Typography
                variant="caption"
                color="error"
                sx={{
                  fontFamily: "monospace",
                  fontWeight: 400,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {error?.statusText || error?.message || "Unknown error"}
                {error?.stack && `\n\n${error.stack.slice(0, 500)}`}
              </Typography>
            </Box>
          )}

          <Stack direction="row" sx={{ gap: 1.5, justifyContent: "center" }}>
            <Button
              variant="outlined"
              onClick={() => window.history.back()}
              startIcon={<RefreshCw size={16} strokeWidth={1.5} />}
              sx={{ fontWeight: 400 }}
            >
              Kembali
            </Button>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
              sx={{ fontWeight: 400 }}
            >
              Muat Ulang
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ErrorBoundary;