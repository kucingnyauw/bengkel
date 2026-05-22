// hooks/useHeaderCart.js
import { useMemo, useCallback, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { selectCartItems } from "@store/cart/cartSelector.js";
import {
  incrementQuantity,
  decrementQuantity,
  removeItem,
  clearCart,
} from "@store/cart/cartSlices.js";
import { createOrder, calculateTotal } from "@api/orderApi.js";
import { showNotification } from "@store/notifications/notificationsSlice.js";

/**
 * Hook untuk Header Cart dengan race condition handling
 * @param {boolean} open - Status drawer terbuka
 * @param {Function} onClose - Callback tutup drawer
 * @returns {Object} Cart state dan handlers
 */
export const useHeaderCart = (open, onClose) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const items = useSelector(selectCartItems);
  const requestIdRef = useRef(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const { control, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: { customer: null, vehicle: null },
  });

  const selectedCustomer = watch("customer");
  const customerVehicles = useMemo(
    () => selectedCustomer?.vehicles || [],
    [selectedCustomer]
  );

  const calculatePayload = useMemo(() => {
    if (!items.length) return [];
    return items.map(({ productId, quantity }) => ({ productId, quantity }));
  }, [items]);

  const {
    mutate: calculateTotalMutate,
    data: calculateTotalData,
    isPending: isCalculatePending,
  } = useMutation({ mutationFn: calculateTotal });

  useEffect(() => {
    if (!calculatePayload.length) return;
    const currentRequestId = ++requestIdRef.current;
    calculateTotalMutate(calculatePayload, {
      onSuccess: (data) => {
        if (currentRequestId !== requestIdRef.current) return;
      },
    });
  }, [calculatePayload, calculateTotalMutate]);

  useEffect(() => {
    if (!open) {
      requestIdRef.current = 0;
      reset();
    }
  }, [open, reset]);

  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders-active"] });
      dispatch(clearCart());
      dispatch(
        showNotification({
          message: `Pesanan #${data?.orderNumber || "baru"} berhasil dibuat`,
          type: "success",
          title: "Berhasil",
          variant: "snackbar",
          autoHide: 3000,
        })
      );
      onClose();
      reset();
    },
  
    onError: (error) => {
      dispatch(
        showNotification({
          message: error.message || "Gagal membuat pesanan",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const handleIncrement = useCallback(
    (productId) => dispatch(incrementQuantity(productId)),
    [dispatch]
  );
  const handleDecrement = useCallback(
    (productId) => dispatch(decrementQuantity(productId)),
    [dispatch]
  );
  const handleRemoveItem = useCallback(
    (productId) => dispatch(removeItem(productId)),
    [dispatch]
  );

  const onSubmit = (data) => {
    const currentItems = itemsRef.current;
    if (!currentItems.length) return;
    createOrderMutation.mutate({
      ...(data.customer?.id && { customerId: data.customer.id }),
      ...(data.vehicle?.id && { vehicleId: data.vehicle.id }),
      items: currentItems.map(({ productId, quantity }) => ({
        productId,
        quantity,
      })),
    });
  };

  return {
    control,
    handleSubmit,
    setValue,
    selectedCustomer,
    customerVehicles,
    items,
    isCalculatePending,
    isSubmitting: createOrderMutation.isPending,
    calcData: calculateTotalData || {},
    handleIncrement,
    handleDecrement,
    handleRemoveItem,
    onSubmit,
  };
};
