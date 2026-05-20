import { useSelector } from "react-redux";
import { useDevice } from "@hooks/useDevice";
import { selectSidebarIsOpen } from "@store/sidebar/sidebarSelector.js";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import Header from "@layout/header/Header.jsx";
import Sidebar from "@layout/sidebar/Sidebar.jsx";
import Footer from "@layout/Footer.jsx";
import MainContentStyled from "@layout/MainContentStyled.jsx";
import Customization from "@layout/customization/Customization.jsx";


const MainLayout = () => {
  const isOpen = useSelector(selectSidebarIsOpen);

  const { isMobile } = useDevice();

  return (
    <>
      <Header />
      <Sidebar />
      <MainContentStyled open={isOpen} isMobile={isMobile}>
        <Box className="content-container fade-in">
          <Outlet />
        </Box>
        <Footer/>
      </MainContentStyled>

    </>
  );
};

export default MainLayout;