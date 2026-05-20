import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isOpen: true,
  activeItem: null,
};

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isOpen = !state.isOpen;
    },

    openSidebar: (state) => {
      state.isOpen = true;
    },

    closeSidebar: (state) => {
      state.isOpen = false;
    },

    setActiveItem: (state, action) => {
      state.activeItem = action.payload;
    },

    resetSidebar: () => initialState,
  },
});

export const {
  toggleSidebar,
  openSidebar,
  closeSidebar,
  setActiveItem,
  resetSidebar,
} = sidebarSlice.actions;

export default sidebarSlice.reducer;