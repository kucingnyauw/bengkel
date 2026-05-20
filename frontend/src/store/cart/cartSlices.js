import { createSlice } from "@reduxjs/toolkit";

/**
 * Helper untuk membuat objek item cart baru.
 * Memusatkan logika penentuan quantity & maxQuantity berdasarkan tipe produk.
 *
 * @param {Object} payload - Data item dari action.
 * @returns {Object} Objek item cart yang sudah dinormalisasi.
 */
const createCartItem = (payload) => {
  const isService = payload.type === "SERVICE";
  return {
    productId: payload.productId,
    productName: payload.productName,
    unitPrice: payload.unitPrice,
    type: payload.type,
    quantity: isService
      ? 1
      : Math.min(payload.quantity || 1, payload.maxQuantity),
    maxQuantity: isService ? 1 : payload.maxQuantity,
    productStock: payload.productStock ?? 0,
    mechanicId: isService ? payload.mechanicId || null : null,
    image: payload.image || null,
    sku: payload.sku || null,
  };
};

const initialState = {
  items: [],
  customerId: null,
  vehicleId: null,
  isItemAdded: false,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem: (state, action) => {
      const newItem = createCartItem(action.payload);
      const existingIndex = state.items.findIndex(
        (item) => item.productId === newItem.productId
      );

      if (existingIndex !== -1) {
        const existingItem = state.items[existingIndex];
        if (existingItem.type === "SPAREPART") {
          const newQuantity = existingItem.quantity + newItem.quantity;
          existingItem.quantity = Math.min(
            newQuantity,
            existingItem.maxQuantity
          );
        }
      } else {
        state.items.push(newItem);
      }
      state.isItemAdded = true;
    },

    updateItemQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find((i) => i.productId === productId);
      if (item && item.type !== "SERVICE") {
        item.quantity = Math.min(item.maxQuantity, Math.max(1, quantity || 1));
      }
    },

    updateItemMechanic: (state, action) => {
      const { productId, mechanicId } = action.payload;
      const item = state.items.find((i) => i.productId === productId);
      if (item && item.type === "SERVICE") {
        item.mechanicId = mechanicId || null;
      }
    },

    removeItem: (state, action) => {
      state.items = state.items.filter(
        (item) => item.productId !== action.payload
      );
    },

    resetItemAdded: (state) => {
      state.isItemAdded = false;
    },

    setCustomer: (state, action) => {
      state.customerId = action.payload;
    },

    setVehicle: (state, action) => {
      state.vehicleId = action.payload;
    },

    clearCustomer: (state) => {
      state.customerId = null;
    },

    clearVehicle: (state) => {
      state.vehicleId = null;
    },

    clearCart: () => initialState,
  },
});

export const {
  addItem,
  updateItemQuantity,
  updateItemMechanic,
  removeItem,
  resetItemAdded,
  setCustomer,
  setVehicle,
  clearCustomer,
  clearVehicle,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
