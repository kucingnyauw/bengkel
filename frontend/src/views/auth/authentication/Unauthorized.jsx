/**
 * Unauthorized - Halaman untuk pengguna yang tidak memiliki akses.
 *
 * @component
 * @returns {JSX.Element} Rendered unauthorized page
 */
import { ShieldOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

const Unauthorized = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 4,
        bgcolor: theme.palette.background.default,
      }}
    >
      <Card
        sx={{
          maxWidth: 480,
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
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.warning.main, 0.08),
              color: "warning.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 3,
            }}
          >
            <ShieldOff size={36} strokeWidth={1.5} />
          </Box>

          <Typography variant="h5" sx={{ mb: 1, fontWeight: 400 }}>
            Akses Dibatasi
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontWeight: 400 }}>
            Maaf, Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.
          </Typography>

          <Stack direction="row" sx={{ gap: 1.5, justifyContent: "center" }}>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              sx={{ fontWeight: 400 }}
            >
              Kembali
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate("/dashboard")}
              sx={{ fontWeight: 400 }}
            >
              Ke Dashboard
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Unauthorized;