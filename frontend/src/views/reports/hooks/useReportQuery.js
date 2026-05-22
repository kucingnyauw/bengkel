import { useQuery } from "@tanstack/react-query";
import {
  getTopProductsReport,
  getShiftReport,
  getSalesSummary,
  getProfitLossReport,
  getPaymentReport,
  getMechanicPerformanceReport,
  getInventoryReport,
  getExpenseReport,
} from "@api/reportApi.js";
import { STALE_TIME } from "@shared/constant/constant.js";

/**
 * Hook untuk laporan produk terlaris
 * @param {Object} [params] - Parameter filter
 * @returns {import("@tanstack/react-query").UseQueryResult}
 */
export const useTopProductsReport = (params) => {
  return useQuery({
    queryKey: ["reports", "top-products", params],
    queryFn: () => getTopProductsReport(params),
    staleTime: STALE_TIME,
  });
};

/**
 * Hook untuk laporan shift
 * @param {string} shiftId - ID shift
 * @returns {import("@tanstack/react-query").UseQueryResult}
 */
export const useShiftReport = (shiftId) => {
  return useQuery({
    queryKey: ["reports", "shift", shiftId],
    queryFn: () => getShiftReport(shiftId),
    staleTime: STALE_TIME,
    enabled: !!shiftId,
  });
};

/**
 * Hook untuk ringkasan penjualan
 * @param {Object} [params] - Parameter filter
 * @returns {import("@tanstack/react-query").UseQueryResult}
 */
export const useSalesSummaryReport = (params) => {
  return useQuery({
    queryKey: ["reports", "sales-summary", params],
    queryFn: () => getSalesSummary(params),
    staleTime: STALE_TIME,
  });
};

/**
 * Hook untuk laporan laba rugi
 * @param {Object} [params] - Parameter filter
 * @returns {import("@tanstack/react-query").UseQueryResult}
 */
export const useProfitLossReport = (params) => {
  return useQuery({
    queryKey: ["reports", "profit-loss", params],
    queryFn: () => getProfitLossReport(params),
    staleTime: STALE_TIME,
  });
};

/**
 * Hook untuk laporan pembayaran
 * @param {Object} [params] - Parameter filter
 * @returns {import("@tanstack/react-query").UseQueryResult}
 */
export const usePaymentReport = (params) => {
  return useQuery({
    queryKey: ["reports", "payments", params],
    queryFn: () => getPaymentReport(params),
    staleTime: STALE_TIME,
  });
};

/**
 * Hook untuk laporan performa mekanik
 * @param {Object} [params] - Parameter filter
 * @returns {import("@tanstack/react-query").UseQueryResult}
 */
export const useMechanicPerformanceReport = (params) => {
  return useQuery({
    queryKey: ["reports", "mechanic-performance", params],
    queryFn: () => getMechanicPerformanceReport(params),
    staleTime: STALE_TIME,
  });
};

/**
 * Hook untuk laporan inventaris
 * @returns {import("@tanstack/react-query").UseQueryResult}
 */
export const useInventoryReport = () => {
  return useQuery({
    queryKey: ["reports", "inventory"],
    queryFn: () => getInventoryReport(),
    staleTime: STALE_TIME,
  });
};

/**
 * Hook untuk laporan pengeluaran
 * @param {Object} [params] - Parameter filter
 * @returns {import("@tanstack/react-query").UseQueryResult}
 */
export const useExpenseReport = (params) => {
  return useQuery({
    queryKey: ["reports", "expenses", params],
    queryFn: () => getExpenseReport(params),
    staleTime: STALE_TIME,
  });
};