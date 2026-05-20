import { Suspense } from "react";
import { createPortal } from "react-dom";
import { Box, LinearProgress } from "@mui/material";

const Loader = () => {
  return createPortal(
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: (theme) => theme.zIndex.modal + 10,
      }}
    >
      <LinearProgress />
    </Box>,
    document.body
  );
};

const AppLoadable = (Component) => {
  const WrappedComponent = (props) => (
    <Suspense fallback={<Loader />}>
      <Component {...props} />
    </Suspense>
  );

  return WrappedComponent;
};

export default AppLoadable;