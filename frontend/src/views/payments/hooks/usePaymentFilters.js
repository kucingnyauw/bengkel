import { useState, useCallback } from "react";

/**
 * Nilai default untuk filter pembayaran.
 * @constant
 */
const initialFilters = {
  status: "",
  method: "",
  startDate: null,
  endDate: null,
};

/**
 * Custom hook untuk mengelola state filter pembayaran dengan mekanisme apply/temporary.
 *
 * Menyediakan sistem filter dua layer:
 * - `activeFilters`: Filter yang sedang aktif dan diterapkan ke query.
 * - `tempFilters`: Filter sementara yang sedang diedit di UI (belum diterapkan).
 *
 * Pola ini memungkinkan pengguna mengubah-ubah filter di UI tanpa langsung
 * memicu query, dan hanya menerapkan perubahan saat tombol "Apply" ditekan.
 *
 * Filter yang tersedia:
 * - `status`: Filter berdasarkan status pembayaran.
 * - `method`: Filter berdasarkan metode pembayaran (QRIS/Tunai/Transfer).
 * - `startDate` & `endDate`: Filter rentang tanggal.
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
 * } = usePaymentFilters();
 *
 * const { data } = usePaymentsQuery(activeFilters);
 *
 * return (
 *   <>
 *     <Button onClick={openFilter}>Filter</Button>
 *
 *     <FilterPanel open={filterOpen} onClose={closeFilter}>
 *       <Select
 *         value={tempFilters.status}
 *         onChange={(e) => setTempFilters(prev => ({ ...prev, status: e.target.value }))}
 *       >
 *         <option value="">Semua Status</option>
 *         <option value="PAID">Lunas</option>
 *         <option value="PENDING">Menunggu</option>
 *         <option value="REFUNDED">Direfund</option>
 *       </Select>
 *
 *       <Select
 *         value={tempFilters.method}
 *         onChange={(e) => setTempFilters(prev => ({ ...prev, method: e.target.value }))}
 *       >
 *         <option value="">Semua Metode</option>
 *         <option value="QRIS">QRIS</option>
 *         <option value="CASH">Tunai</option>
 *       </Select>
 *
 *       <DatePicker
 *         value={tempFilters.startDate}
 *         onChange={(val) => setTempFilters(prev => ({ ...prev, startDate: val }))}
 *       />
 *
 *       <Button onClick={applyFilter}>Terapkan</Button>
 *       <Button onClick={resetFilter}>Reset</Button>
 *     </FilterPanel>
 *   </>
 * );
 */
export const usePaymentFilters = () => {
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