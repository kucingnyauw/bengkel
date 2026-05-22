import { Box, Backdrop } from "@mui/material";
import { keyframes } from "@mui/system";

const pulse = keyframes`
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
`;

/**
 * AppLoading - Simple loading indicator dengan animasi 3 dots
 * Digunakan saat initial bootstrap atau auth check berlangsung
 * @component
 * @returns {JSX.Element} Full-screen backdrop dengan animasi loading
 */
const AppLoading = () => {
  const dotStyle = {
    display: "inline-block",
    width: 10,
    height: 10,
    borderRadius: "50%",
    backgroundColor: "primary.main",
    animation: `${pulse} 1.4s ease-in-out infinite`,
    mx: 0.5,
  };

  return (
    <Backdrop
      open={true}
      sx={{
        zIndex: 9999,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Box component="span" sx={dotStyle} />
        <Box
          component="span"
          sx={{
            ...dotStyle,
            animationDelay: "0.2s",
          }}
        />
        <Box
          component="span"
          sx={{
            ...dotStyle,
            animationDelay: "0.4s",
          }}
        />
      </Box>
    </Backdrop>
  );
};

export default AppLoading;