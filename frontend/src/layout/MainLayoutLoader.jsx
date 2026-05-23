import { Box, Skeleton, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useSelector } from "react-redux";
import { selectSidebarIsOpen } from "@store/sidebar/sidebarSelector.js";
import { useDevice } from "@hooks/useDevice";
import { HEADER, SIDEBAR } from "@shared/constant";
import MainContentStyled from "@layout/MainContentStyled.jsx";

/**
 * Skeleton untuk Header saat loading
 */
const HeaderSkeleton = ({ theme, isMobile, isOpen }) => {
  const sidebarWidth = isOpen ? SIDEBAR.EXPANDED_WIDTH : SIDEBAR.COLLAPSED_WIDTH;

  return (
    <Box
      sx={{
        width: "100%",
        height: isMobile ? HEADER.MOBILE_HEIGHT : HEADER.DESKTOP_HEIGHT,
        bgcolor: "background.paper",
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: "flex",
        alignItems: "center",
        px: { xs: 1.5, sm: 2, md: 2 },
        gap: { xs: 1, sm: 2 },
        flexShrink: 0,
        position: "fixed",
        top: 0,
        zIndex: theme.zIndex.appBar,
      }}
    >
      {/* LEFT BOX */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          width: { xs: "auto", md: `${sidebarWidth}px` },
          transition: "width 0.3s ease, padding 0.3s ease",
          justifyContent: {
            xs: "flex-start",
            md: isOpen ? "flex-start" : "center",
          },
          pl: { xs: 0, md: isOpen ? 3 : 0 },
          pr: { xs: 0, md: isOpen ? 2 : 0 },
          flexShrink: 0,
        }}
      >
        <Skeleton
          variant="rectangular"
          width={90}
          height={32}
          sx={{
            display: { xs: "none", md: isOpen ? "block" : "none" },
            flexShrink: 0,
            borderRadius: 1,
          }}
        />
        <Skeleton
          variant="rounded"
          width={34}
          height={34}
          sx={{
            borderRadius: `${theme.shape.borderRadius}px`,
            ml: { xs: 0, md: isOpen ? "auto" : 0 },
            flexShrink: 0,
          }}
        />
      </Box>

      {/* CENTER BOX (Search Bar) */}
      <Box
        sx={{
          flex: 1,
          display: { xs: "none", md: "flex" },
          justifyContent: { xs: "flex-start", md: "center" },
          minWidth: 0,
        }}
      >
        <Skeleton
          variant="rounded"
          height={40}
          sx={{
            width: "100%",
            maxWidth: { xs: "100%", md: 320 },
            borderRadius: 2,
          }}
        />
      </Box>

      {/* SPACER */}
      <Box
        sx={{
          flexGrow: 1,
          display: { xs: "block", md: "none" },
        }}
      />

      {/* RIGHT BOX (Action Icons) */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: { xs: 0.5, sm: 1.5 },
          flexShrink: 0,
        }}
      >
        <Skeleton
          variant="rounded"
          width={34}
          height={34}
          sx={{
            display: { xs: "inline-flex", md: "none" },
            borderRadius: `${theme.shape.borderRadius}px`,
          }}
        />
        <Skeleton
          variant="rounded"
          width={34}
          height={34}
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            borderRadius: `${theme.shape.borderRadius}px`,
          }}
        />
        <Skeleton
          variant="rounded"
          width={34}
          height={34}
          sx={{ borderRadius: `${theme.shape.borderRadius}px` }}
        />
        {/* Placeholder for Cart (assuming Cashier role visibility could apply here, default shown for layout sync) */}
        <Skeleton
          variant="rounded"
          width={34}
          height={34}
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            borderRadius: `${theme.shape.borderRadius}px`,
          }}
        />
        <Skeleton
          variant="rounded"
          height={24}
          width={1}
          sx={{ mx: { xs: 0.5, sm: 0.5 }, flexShrink: 0 }}
        />
        <Skeleton
          variant="circular"
          sx={{
            width: { xs: 30, sm: 36 },
            height: { xs: 30, sm: 36 },
            flexShrink: 0,
          }}
        />
      </Box>
    </Box>
  );
};

/**
 * Skeleton untuk Sidebar saat loading
 */
const SidebarSkeleton = ({ theme, isOpen }) => (
  <Box
    sx={{
      width: isOpen ? SIDEBAR.EXPANDED_WIDTH : SIDEBAR.COLLAPSED_WIDTH,
      flexShrink: 0,
      position: "fixed",
      top: HEADER.DESKTOP_HEIGHT,
      left: 0,
      height: `calc(100vh - ${HEADER.DESKTOP_HEIGHT}px)`,
      borderRight: `1px solid ${theme.palette.divider}`,
      backgroundColor: theme.palette.background.paper,
      display: { xs: "none", md: "flex" },
      flexDirection: "column",
      px: isOpen ? 2 : 1,
      py: 2,
      gap: 0.5,
      transition: "width 0.3s ease",
      overflow: "hidden",
      boxShadow: isOpen
        ? `4px 0 20px -8px ${alpha(theme.palette.common.black, 0.06)}`
        : "none",
    }}
  >
    {/* Group 1 */}
    <Box>
      {isOpen && (
        <Skeleton
          width={60}
          height={10}
          sx={{ mb: 1, mt: 0.5, ml: 1.5, borderRadius: 0.5 }}
        />
      )}
      {[1, 2, 3].map((i) => (
        <Skeleton
          key={i}
          variant="rounded"
          height={isOpen ? 44 : 36}
          sx={{
            borderRadius: `${theme.shape.borderRadius}px`,
            mb: 0.5,
            ...(isOpen ? {} : { mx: "auto", width: 36 }),
          }}
        />
      ))}
    </Box>

    {/* Divider */}
    <Skeleton height={1} sx={{ mx: 1, my: 1 }} />

    {/* Group 2 */}
    <Box>
      {isOpen && (
        <Skeleton
          width={80}
          height={10}
          sx={{ mb: 1, mt: 0.5, ml: 1.5, borderRadius: 0.5 }}
        />
      )}
      {[1, 2, 3, 4].map((i) => (
        <Skeleton
          key={i}
          variant="rounded"
          height={isOpen ? 44 : 36}
          sx={{
            borderRadius: `${theme.shape.borderRadius}px`,
            mb: 0.5,
            ...(isOpen ? {} : { mx: "auto", width: 36 }),
          }}
        />
      ))}
    </Box>

    {/* Divider */}
    <Skeleton height={1} sx={{ mx: 1, my: 1 }} />

    {/* Group 3 */}
    <Box>
      {isOpen && (
        <Skeleton
          width={50}
          height={10}
          sx={{ mb: 1, mt: 0.5, ml: 1.5, borderRadius: 0.5 }}
        />
      )}
      {[1, 2].map((i) => (
        <Skeleton
          key={i}
          variant="rounded"
          height={isOpen ? 44 : 36}
          sx={{
            borderRadius: `${theme.shape.borderRadius}px`,
            mb: 0.5,
            ...(isOpen ? {} : { mx: "auto", width: 36 }),
          }}
        />
      ))}
    </Box>
  </Box>
);

/**
 * Skeleton untuk Content Area saat loading
 */
const ContentSkeleton = ({ theme }) => (
  <Box
    sx={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(3),
      overflow: "hidden",
    }}
  >
    {/* Page Header */}
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: theme.spacing(2),
      }}
    >
      <Box>
        <Skeleton variant="text" width={200} height={36} />
        <Skeleton
          variant="text"
          width={280}
          height={20}
          sx={{ mt: 0.5 }}
        />
      </Box>
      <Skeleton
        variant="rounded"
        width={140}
        height={40}
        sx={{ borderRadius: `${theme.shape.borderRadius}px` }}
      />
    </Box>

    {/* Stats Cards */}
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "1fr 1fr",
          md: "repeat(4, 1fr)",
        },
        gap: theme.spacing(2),
      }}
    >
      {[1, 2, 3, 4].map((i) => (
        <Skeleton
          key={i}
          variant="rounded"
          sx={{
            width: "100%",
            height: 120,
            borderRadius: `${theme.shape.borderRadius}px`,
          }}
        />
      ))}
    </Box>

    {/* Table/Chart */}
    <Skeleton
      variant="rounded"
      sx={{
        flex: 1,
        borderRadius: `${theme.shape.borderRadius}px`,
        minHeight: 400,
      }}
    />

    {/* Additional Section */}
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gap: theme.spacing(2),
      }}
    >
      <Skeleton
        variant="rounded"
        sx={{
          height: 200,
          borderRadius: `${theme.shape.borderRadius}px`,
        }}
      />
      <Skeleton
        variant="rounded"
        sx={{
          height: 200,
          borderRadius: `${theme.shape.borderRadius}px`,
        }}
      />
    </Box>
  </Box>
);

/**
 * MainLayoutLoader - Full layout skeleton untuk loading state
 */
const MainLayoutLoader = ({ isLoading }) => {
  const theme = useTheme();
  const isOpen = useSelector(selectSidebarIsOpen);
  const { isMobile } = useDevice();

  if (!isLoading) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
      }}
    >
      {/* Header */}
      <HeaderSkeleton theme={theme} isMobile={isMobile} isOpen={isOpen} />

      {/* Body */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          pt: isMobile ? `${HEADER.MOBILE_HEIGHT}px` : `${HEADER.DESKTOP_HEIGHT}px`,
        }}
      >
        {/* Sidebar - only desktop */}
        {!isMobile && <SidebarSkeleton theme={theme} isOpen={isOpen} />}

        {/* Content */}
        <MainContentStyled open={isOpen} isMobile={isMobile}>
          <ContentSkeleton theme={theme} />
        </MainContentStyled>
      </Box>
    </Box>
  );
};

export default MainLayoutLoader;