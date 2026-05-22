import { createSlice } from "@reduxjs/toolkit";
import { MIN_ITEM_QUANTITY, MAX_ITEM_QUANTITY } from "@shared/constant";

const CART_STORAGE_KEY = "workshop_cart";

/**
 * Load cart state from localStorage
 */
const loadCartFromStorage = () => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        items: parsed.items || [],
        customerId: parsed.customerId || null,
        vehicleId: parsed.vehicleId || null,
      };
    }
  } catch {
    // Ignore parse errors
  }
  return {
    items: [],
    customerId: null,
    vehicleId: null,
  };
};

/**
 * Save cart state to localStorage
 */
const saveCartToStorage = (state) => {
  try {
    const toSave = {
      items: state.items,
      customerId: state.customerId,
      vehicleId: state.vehicleId,
    };
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Ignore storage errors
  }
};

/**
 * Helper untuk membuat objek item cart baru.
 */
const createCartItem = (payload) => {
  const isService = payload.type === "SERVICE";
  return {
    productId: payload.productId,
    productName: payload.productName,
    unitPrice: payload.unitPrice,
    type: payload.type,
    quantity: isService ? 1 : Math.min(payload.quantity || 1, payload.maxQuantity),
    maxQuantity: isService ? 1 : payload.maxQuantity,
    productStock: payload.productStock ?? 0,
    mechanicId: isService ? payload.mechanicId || null : null,
    image: payload.image || null,
    sku: payload.sku || null,
  };
};

const initialState = loadCartFromStorage();

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
          existingItem.quantity = Math.min(newQuantity, existingItem.maxQuantity);
        }
      } else {
        state.items.push(newItem);
      }
      saveCartToStorage(state);
    },

    updateItemQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find((i) => i.productId === productId);
      if (item && item.type !== "SERVICE") {
        item.quantity = Math.min(
          item.maxQuantity,
          Math.max(MIN_ITEM_QUANTITY, Math.min(quantity || 1, MAX_ITEM_QUANTITY))
        );
        saveCartToStorage(state);
      }
    },

    incrementQuantity: (state, action) => {
      const item = state.items.find((i) => i.productId === action.payload);
      if (item && item.type !== "SERVICE" && item.quantity < item.maxQuantity && item.quantity < MAX_ITEM_QUANTITY) {
        item.quantity += 1;
        saveCartToStorage(state);
      }
    },

    decrementQuantity: (state, action) => {
      const item = state.items.find((i) => i.productId === action.payload);
      if (item && item.type !== "SERVICE" && item.quantity > MIN_ITEM_QUANTITY) {
        item.quantity -= 1;
        saveCartToStorage(state);
      }
    },

    updateItemMechanic: (state, action) => {
      const { productId, mechanicId } = action.payload;
      const item = state.items.find((i) => i.productId === productId);
      if (item && item.type === "SERVICE") {
        item.mechanicId = mechanicId || null;
        saveCartToStorage(state);
      }
    },

    removeItem: (state, action) => {
      state.items = state.items.filter((item) => item.productId !== action.payload);
      saveCartToStorage(state);
    },

    setCustomer: (state, action) => {
      state.customerId = action.payload;
      saveCartToStorage(state);
    },

    setVehicle: (state, action) => {
      state.vehicleId = action.payload;
      saveCartToStorage(state);
    },

    clearCustomer: (state) => {
      state.customerId = null;
      saveCartToStorage(state);
    },

    clearVehicle: (state) => {
      state.vehicleId = null;
      saveCartToStorage(state);
    },

    clearCart: (state) => {
      state.items = [];
      state.customerId = null;
      state.vehicleId = null;
      saveCartToStorage(state);
    },
  },
});

export const {
  addItem,
  updateItemQuantity,
  incrementQuantity,
  decrementQuantity,
  updateItemMechanic,
  removeItem,
  setCustomer,
  setVehicle,
  clearCustomer,
  clearVehicle,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;