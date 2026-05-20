// hooks/useHeaderCart.js
import { useMemo, useCallback, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { selectCartItems } from "@store/cart/cartSelector.js";
import {
  updateItemQuantity,
  removeItem,
  clearCart,
} from "@store/cart/cartSlices.js";
import { createOrder, calculateTotal } from "@api/orderApi.js";
import { DEBOUNCE_DELAY, MIN_ITEM_QUANTITY } from "@shared/constant";

export const useHeaderCart = (open, onClose) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const items = useSelector(selectCartItems);
  const calculateRequestIdRef = useRef(0);

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
  } = useMutation({
    mutationFn: calculateTotal,
  });

  useEffect(() => {
    if (!calculatePayload.length) return;
    const requestId = ++calculateRequestIdRef.current;
    const timer = setTimeout(() => {
      if (requestId === calculateRequestIdRef.current)
        calculateTotalMutate(calculatePayload);
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [calculatePayload, calculateTotalMutate]);

  useEffect(() => {
    if (!open) calculateRequestIdRef.current = 0;
  }, [open]);

  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders-active"] });
      dispatch(clearCart());
      onClose();
      reset();
    },
  });

  const handleQuantityChange = useCallback(
    (productId, quantity, increment) => {
      dispatch(
        updateItemQuantity({
          productId,
          quantity: Math.max(MIN_ITEM_QUANTITY, quantity + increment),
        })
      );
    },
    [dispatch]
  );

  const handleRemoveItem = useCallback(
    (productId) => dispatch(removeItem(productId)),
    [dispatch]
  );

  const onSubmit = (data) => {
    if (!items.length) return;
    createOrderMutation.mutate({
      ...(data.customer?.id && { customerId: data.customer.id }),
      ...(data.vehicle?.id && { vehicleId: data.vehicle.id }),
      items: items.map(({ productId, quantity }) => ({ productId, quantity })),
    });
  };

  const calcData = calculateTotalData || {};

  return {
    control,
    handleSubmit,
    setValue,
    selectedCustomer,
    customerVehicles,
    items,
    isCalculatePending,
    isSubmitting: createOrderMutation.isPending,
    calcData,
    handleQuantityChange,
    handleRemoveItem,
    onSubmit,
  };
};
