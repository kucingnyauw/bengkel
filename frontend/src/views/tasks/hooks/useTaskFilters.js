import { useState, useCallback } from "react";

/**
 * Nilai default untuk filter tugas.
 * @constant
 */
const initialFilters = {
  orderId: "",
  orderStatus : ""
};

/**
 * Custom hook untuk mengelola state filter tugas dengan mekanisme apply/temporary.
 *
 * Menyediakan sistem filter dua layer:
 * - `activeFilters`: Filter yang sedang aktif dan diterapkan ke query.
 * - `tempFilters`: Filter sementara yang sedang diedit di UI (belum diterapkan).
 *
 * Pola ini memungkinkan pengguna mengubah-ubah filter di UI tanpa langsung
 * memicu query, dan hanya menerapkan perubahan saat tombol "Apply" ditekan.
 *
 * Filter yang tersedia:
 * - `orderId`: Filter berdasarkan ID order.
 *
 * @returns {Object} Objek yang berisi state dan fungsi untuk mengelola filter.
 * @returns {Object} activeFilters - Filter yang sedang aktif/diterapkan.
 * @returns {Object} tempFilters - Filter sementara yang sedang diedit.
 * @returns {boolean} filterOpen - Status apakah panel filter sedang terbuka.
 * @returns {function} setTempFilters - Setter untuk mengubah tempFilters.
 * @returns {function} openFilter - Membuka panel filter dan menginisialisasi tempFilters.
 * @returns {function} closeFilter - Menutup panel filter tanpa menyimpan perubahan.
 * @returns {function} applyFilter - Menerapkan tempFilters ke activeFilters dan menutup panel.
 * @returns {function} resetFilter - Mereset semua filter ke nilai default.
 *
 * @example
 * const {
 *   activeFilters,
 *   tempFilters,
 *   filterOpen,
 *   setTempFilters,
 *   openFilter,
 *   closeFilter,
 *   applyFilter,
 *   resetFilter,
 * } = useTaskFilter();
 *
 * const { data } = useTasksQuery(activeFilters);
 */
export const useTaskFilters = () => {
  const [activeFilters, setActiveFilters] = useState(initialFilters);
  const [tempFilters, setTempFilters] = useState(activeFilters);
  const [filterOpen, setFilterOpen] = useState(false);

  const openFilter = useCallback(() => {
    setTempFilters(activeFilters);
    setFilterOpen(true);
  }, [activeFilters]);

  const closeFilter = useCallback(() => {
    setFilterOpen(false);
  }, []);

  const applyFilter = useCallback(() => {
    setActiveFilters(tempFilters);
    setFilterOpen(false);
  }, [tempFilters]);

  const resetFilter = useCallback(() => {
    setTempFilters(initialFilters);
    setActiveFilters(initialFilters);
    setFilterOpen(false);
  }, []);

  return {
    activeFilters,
    tempFilters,
    filterOpen,
    setTempFilters,
    openFilter,
    closeFilter,
    applyFilter,
    resetFilter,
  };
};