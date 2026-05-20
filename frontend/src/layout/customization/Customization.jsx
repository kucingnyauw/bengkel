import { Fab, Tooltip, Box, useTheme } from "@mui/material";
import { Settings, ShoppingCart } from "lucide-react";

const Customization = () => {
  const theme = useTheme();

  return (
    <Tooltip placement="bottom" title="Keranjang belanja">
      <Fab
        size="medium"
        color="secondary"
        sx={{
          position: "fixed",
          top: "40%",
          right: 10,
          zIndex: theme.zIndex.fab,
          borderRadius: 0,
          borderTopLeftRadius: "50%",
          borderBottomLeftRadius: "50%",
          borderTopRightRadius: "50%",
          borderBottomRightRadius: "4px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Settings size={20} />
        </Box>
      </Fab>
    </Tooltip>
  );
};

export default Customization;