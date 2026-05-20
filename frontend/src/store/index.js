import { configureStore, combineReducers } from "@reduxjs/toolkit";

import authSlices from "@store/auth/authSlices.js";
import sidebarSlices from "@store/sidebar/sidebarSlices.js";
import themeSlices from "@store/theme/themeSlices.js";
import cartSlices from "@store/cart/cartSlices.js";
import notificationsSlice from "@store/notifications/notificationsSlice.js";

const rootReducer = combineReducers({
  auth: authSlices,
  sidebar: sidebarSlices,
  theme : themeSlices ,
  cart : cartSlices ,
  notification : notificationsSlice
});

const store = configureStore({
  reducer: rootReducer,
});

export default store;