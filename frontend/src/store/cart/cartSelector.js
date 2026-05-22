import { createSelector } from "@reduxjs/toolkit";

const selectCart = (state) => state.cart;

export const selectCartItems = createSelector(
  selectCart,
  (cart) => cart.items
);

export const selectCustomerId = createSelector(
  selectCart,
  (cart) => cart.customerId
);

export const selectVehicleId = createSelector(
  selectCart,
  (cart) => cart.vehicleId
);

export const selectCartItemCount = createSelector(
  selectCartItems,
  (items) =>
    items.reduce((total, item) => total + (item.quantity || 0), 0)
);

export const selectCartSubtotal = createSelector(
  selectCartItems,
  (items) =>
    items.reduce(
      (total, item) =>
        total + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0),
      0
    )
);

export const selectCartTax = createSelector(
  selectCartSubtotal,
  (subtotal) => subtotal * 0.11
);

export const selectCartTotal = createSelector(
  selectCartSubtotal,
  selectCartTax,
  (subtotal, tax) => subtotal + tax
);

export const selectIsCartEmpty = createSelector(
  selectCartItems,
  (items) => items.length === 0
);

export const selectItemByProductId = (productId) =>
  createSelector(selectCartItems, (items) =>
    items.find((item) => item.productId === productId)
  );

export const selectCartServiceItems = createSelector(
  selectCartItems,
  (items) => items.filter((item) => item.type === "SERVICE")
);

export const selectCartSparepartItems = createSelector(
  selectCartItems,
  (items) => items.filter((item) => item.type === "SPAREPART")
);

export const selectHasUnassignedMechanic = createSelector(
  selectCartServiceItems,
  (items) => items.some((item) => !item.mechanicId)
);

export const selectCartSummary = createSelector(
  selectCartItems,
  selectCartSubtotal,
  selectCartTax,
  selectCartTotal,
  selectCartItemCount,
  (items, subtotal, tax, total, itemCount) => ({
    items,
    subtotal,
    tax,
    total,
    itemCount,
  })
);