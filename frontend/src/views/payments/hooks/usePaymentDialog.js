import { useState, useCallback } from "react";

/**
 * Custom hook untuk mengelola state berbagai dialog di modul pembayaran.
 *
 * Menyediakan state dan handler untuk dua jenis dialog:
 * - **Detail Dialog**: Menampilkan detail pembayaran.
 * - **Refund Dialog**: Form untuk merefund pembayaran dengan alasan.
 *
 * Hook ini memusatkan logika dialog agar tidak perlu mengelola banyak state
 * secara terpisah di komponen.
 *
 * @returns {Object} Objek yang berisi state dan fungsi untuk mengelola dialog.
 * @returns {Object} detailDialog - State detail dialog `{ open: boolean, paymentId: string|number|null }`.
 * @returns {Object} refundDialog - State refund dialog `{ open: boolean, payment: Object|null, reason: string }`.
 * @returns {function} openDetailDialog - Membuka dialog detail untuk pembayaran tertentu.
 * @returns {function} closeDetailDialog - Menutup dialog detail.
 * @returns {function} openRefundDialog - Membuka dialog refund dengan data pembayaran.
 * @returns {function} closeRefundDialog - Menutup dialog refund dan mereset alasan.
 * @returns {function} setRefundReason - Mengatur alasan refund.
 *
 * @example
 * const {
 *   detailDialog,
 *   refundDialog,
 *   openDetailDialog,
 *   closeDetailDialog,
 *   openRefundDialog,
 *   closeRefundDialog,
 *   setRefundReason,
 * } = usePaymentDialog();
 *
 * return (
 *   <>
 *     <Button onClick={() => openDetailDialog(paymentId)}>Detail</Button>
 *
 *     <PaymentDetailDialog
 *       open={detailDialog.open}
 *       paymentId={detailDialog.paymentId}
 *       onClose={closeDetailDialog}
 *     />
 *
 *     <RefundDialog
 *       open={refundDialog.open}
 *       payment={refundDialog.payment}
 *       reason={refundDialog.reason}
 *       onReasonChange={setRefundReason}
 *       onClose={closeRefundDialog}
 *     />
 *   </>
 * );
 */
export const usePaymentDialog = () => {
  const [detailDialog, setDetailDialog] = useState({
    open: false,
    paymentId: null,
  });

  const [refundDialog, setRefundDialog] = useState({
    open: false,
    payment: null,
    reason: "",
  });

  const openDetailDialog = useCallback((paymentId) => {
    setDetailDialog({ open: true, paymentId });
  }, []);

  const closeDetailDialog = useCallback(() => {
    setDetailDialog({ open: false, paymentId: null });
  }, []);

  const openRefundDialog = useCallback((payment) => {
    setRefundDialog({ open: true, payment, reason: "" });
  }, []);

  const closeRefundDialog = useCallback(() => {
    setRefundDialog({ open: false, payment: null, reason: "" });
  }, []);

  const setRefundReason = useCallback((reason) => {
    setRefundDialog((prev) => ({ ...prev, reason }));
  }, []);

  return {
    detailDialog,
    refundDialog,
    openDetailDialog,
    closeDetailDialog,
    openRefundDialog,
    closeRefundDialog,
    setRefundReason,
  };
};