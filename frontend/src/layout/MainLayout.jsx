import { useSelector } from "react-redux";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useDevice } from "@hooks/useDevice";
import { selectSidebarIsOpen } from "@store/sidebar/sidebarSelector.js";
import { selectAuthStatus, selectAuthLoading } from "@store/auth/authSelector.js";
import Header from "@layout/header/Header.jsx";
import Sidebar from "@layout/sidebar/Sidebar.jsx";
import Footer from "@layout/Footer.jsx";
import MainContentStyled from "@layout/MainContentStyled.jsx";
import MainLayoutLoader from "@layout/MainLayoutLoader.jsx";

/**
 * MainLayout - Layout utama aplikasi yang menangani semua auth state
 * Menampilkan skeleton loader atau layout penuh berdasarkan status auth
 * @component
 * @returns {JSX.Element} Layout sesuai status auth
 */
const MainLayout = () => {
  const isOpen = useSelector(selectSidebarIsOpen);
  const status = useSelector(selectAuthStatus);
  const isLoading = useSelector(selectAuthLoading);
  const { isMobile } = useDevice();

  /**
   * Tampilkan skeleton loader saat:
   * - Bootstrap awal (unknown)
   * - Auth service error (degraded)
   * - Data masih loading
   */
  if (status === "unknown" || status === "degraded" || isLoading) {
    return <MainLayoutLoader isLoading={true} />;
  }

  /**
   * Auth valid - render layout penuh
   */
  return (
    <>
      <Header />
      <Sidebar />
      <MainContentStyled open={isOpen} isMobile={isMobile}>
        <Box className="content-container fade-in">
          <Outlet />
        </Box>
        <Footer />
      </MainContentStyled>
    </>
  );
};

export default MainLayout;