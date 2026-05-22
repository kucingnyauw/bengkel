/**
 * MainLayoutLoader - Full layout skeleton untuk loading state
 * Digunakan saat data user sudah ready (auth) tapi data layout belum siap
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.isLoading - Status loading
 * @returns {JSX.Element|null} Layout skeleton atau null
 */
import { Box } from "@mui/material";
import { Skeleton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { useSelector } from "react-redux";
import { selectSidebarIsOpen } from "@store/sidebar/sidebarSelector.js";
import { useDevice } from "@hooks/useDevice";
import { HEADER, SIDEBAR } from "@shared/constant";
import MainContentStyled from "@layout/MainContentStyled.jsx";

/**
 * Skeleton untuk Header saat loading
 * @param {Object} props
 * @param {Object} props.theme - MUI theme
 * @param {boolean} props.isMobile - Apakah tampilan mobile
 * @param {boolean} props.isOpen - Apakah sidebar terbuka
 * @returns {JSX.Element}
 */
const HeaderSkeleton = ({ theme, isMobile, isOpen }) => {
  const sidebarWidth = isOpen
    ? SIDEBAR.EXPANDED_WIDTH
    : SIDEBAR.COLLAPSED_WIDTH;

  return (
    <Box
      sx={{
        width: "100%",
        height: isMobile ? HEADER.MOBILE_HEIGHT : HEADER.DESKTOP_HEIGHT,
        bgcolor: "background.paper",
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        display: "flex",
        alignItems: "center",
        px: 1,
        gap: 2,
        flexShrink: 0,
        position: "fixed",
        top: 0,
        zIndex: theme.zIndex.appBar,
      }}
    >
      {/* LEFT: Logo + Sidebar Toggle */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          width: { xs: "auto", md: `${sidebarWidth}px` },
          transition: "width 0.3s ease, padding 0.3s ease",
          justifyContent: {
            xs: "flex-start",
            md: isOpen ? "flex-start" : "center",
          },
          pl: { xs: 0, md: isOpen ? 3 : 0 },
          pr: { xs: 0, md: isOpen ? 2 : 0 },
        }}
      >
        {/* Logo skeleton */}
        <Skeleton
          variant="text"
          width={120}
          height={32}
          sx={{
            display: { xs: "none", md: isOpen ? "block" : "none" },
            flex: 1,
          }}
        />
        {/* Toggle button skeleton */}
        <Skeleton
          variant="rounded"
          width={34}
          height={34}
          sx={{
            borderRadius: 1,
            ml: { xs: 0, md: isOpen ? "auto" : 0 },
            flexShrink: 0,
          }}
        />
      </Box>

      {/* CENTER: Search Bar */}
      <Box
        sx={{
          flex: 1,
          display: { xs: "none", md: "flex" },
          justifyContent: "center",
        }}
      >
        <Skeleton
          variant="rounded"
          height={40}
          sx={{ width: "100%", maxWidth: 320, borderRadius: 2 }}
        />
      </Box>

      {/* RIGHT: Action Icons & Profile */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: { xs: 1, sm: 1.5 },
        }}
      >
        {/* Mobile search icon */}
        <Skeleton
          variant="rounded"
          width={34}
          height={34}
          sx={{ display: { xs: "inline-flex", md: "none" }, borderRadius: 1 }}
        />
        {/* Desktop notification icon */}
        <Skeleton
          variant="rounded"
          width={34}
          height={34}
          sx={{ display: { xs: "none", sm: "inline-flex" }, borderRadius: 1 }}
        />
        {/* Cart/Order icon */}
        <Skeleton
          variant="rounded"
          width={34}
          height={34}
          sx={{ borderRadius: 1 }}
        />
        {/* Settings icon */}
        <Skeleton
          variant="rounded"
          width={34}
          height={34}
          sx={{ display: { xs: "none", sm: "inline-flex" }, borderRadius: 1 }}
        />
        {/* Divider */}
        <Skeleton
          variant="rounded"
          height={24}
          width={1}
          sx={{ mx: { xs: 0, sm: 0.5 } }}
        />
        {/* User avatar */}
        <Skeleton
          variant="circular"
          sx={{
            width: { xs: 32, sm: 36 },
            height: { xs: 32, sm: 36 },
          }}
        />
      </Box>
    </Box>
  );
};

/**
 * Skeleton untuk Sidebar saat loading
 * @param {Object} props
 * @param {Object} props.theme - MUI theme
 * @param {boolean} props.isOpen - Apakah sidebar terbuka
 * @returns {JSX.Element}
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
      borderRight: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
      bgcolor: alpha(theme.palette.background.paper, 0.8),
      display: { xs: "none", md: "flex" },
      flexDirection: "column",
      px: isOpen ? 2 : 1,
      py: 2.5,
      gap: 0.5,
      transition: "width 0.3s ease",
      overflow: "hidden",
    }}
  >
    {/* Main Navigation Group */}
    <Box sx={{ mt: 2.5, mb: 0.5 }}>
      {isOpen && (
        <Skeleton
          variant="text"
          width={60}
          height={10}
          sx={{ mb: 1.5, ml: 2, borderRadius: 1 }}
        />
      )}
      {[1, 2, 3].map((i) => (
        <Skeleton
          key={`main-nav-${i}`}
          variant="rounded"
          height={44}
          sx={{ borderRadius: 1, mb: 0.5 }}
        />
      ))}
    </Box>

    {/* Divider */}
    <Skeleton
      variant="rounded"
      height={1}
      sx={{ mx: 2, my: 1.5, borderRadius: 0.5 }}
    />

    {/* Management Navigation Group */}
    <Box sx={{ mt: isOpen ? 2.5 : 0.5, mb: 0.5 }}>
      {isOpen && (
        <Skeleton
          variant="text"
          width={80}
          height={10}
          sx={{ mb: 1.5, ml: 2, borderRadius: 1 }}
        />
      )}
      {[1, 2, 3, 4].map((i) => (
        <Skeleton
          key={`management-nav-${i}`}
          variant="rounded"
          height={44}
          sx={{ borderRadius: 1, mb: 0.5 }}
        />
      ))}
    </Box>

    {/* Divider */}
    <Skeleton
      variant="rounded"
      height={1}
      sx={{ mx: 2, my: 1.5, borderRadius: 0.5 }}
    />

    {/* Other Navigation Group */}
    <Box sx={{ mt: isOpen ? 2.5 : 0.5, mb: 0.5 }}>
      {isOpen && (
        <Skeleton
          variant="text"
          width={50}
          height={10}
          sx={{ mb: 1.5, ml: 2, borderRadius: 1 }}
        />
      )}
      {[1, 2].map((i) => (
        <Skeleton
          key={`other-nav-${i}`}
          variant="rounded"
          height={44}
          sx={{ borderRadius: 1, mb: 0.5 }}
        />
      ))}
    </Box>
  </Box>
);

/**
 * Skeleton untuk Content Area saat loading
 * @param {Object} props
 * @param {Object} props.theme - MUI theme
 * @returns {JSX.Element}
 */
const ContentSkeleton = ({ theme }) => (
  <Box
    sx={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 3,
      overflow: "hidden",
    }}
  >
    {/* Page Header */}
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Box>
        <Skeleton variant="text" width={200} height={36} />
        <Skeleton variant="text" width={280} height={20} sx={{ mt: 0.5 }} />
      </Box>
      <Skeleton
        variant="rounded"
        width={140}
        height={40}
        sx={{ borderRadius: `${theme.shape.borderRadius}px` }}
      />
    </Box>

    {/* Stats Cards */}
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      {[1, 2, 3, 4].map((i) => (
        <Skeleton
          key={`stat-card-${i}`}
          variant="rounded"
          sx={{
            flex: "1 1 calc(25% - 16px)",
            minWidth: 200,
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
  </Box>
);

/**
 * MainLayoutLoader - Full layout skeleton untuk loading state
 * Menampilkan skeleton header, sidebar (desktop), dan content area
 * Digunakan saat initial load atau navigasi halaman
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.isLoading - Status loading
 * @returns {JSX.Element|null} Layout skeleton atau null
 */
const MainLayoutLoader = ({ isLoading }) => {
  const theme = useTheme();
  const isOpen = useSelector(selectSidebarIsOpen);
  const { isMobile } = useDevice();

  if (!isLoading) return null;

  return (

    <>
      <HeaderSkeleton /> {/* Fixed top */}
      {!isMobile && <SidebarSkeleton />} {/* Fixed left, below header */}
      <MainContentStyled>
        {" "}
        {/* Auto margin-top from styled component */}
        <ContentSkeleton />
      </MainContentStyled>
    </>
  );
};

export default MainLayoutLoader;
