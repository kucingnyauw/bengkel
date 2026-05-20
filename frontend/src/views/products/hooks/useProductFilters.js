import { useState, useCallback } from "react";

/**
 * Nilai default untuk filter produk.
 * @constant
 */
const initialFilters = {
  type: "",
  isActive: "",
  lowStockThreshold: "",
  minPrice: "",
  maxPrice: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

/**
 * Custom hook untuk mengelola state filter produk dengan mekanisme apply/temporary.
 *
 * Menyediakan sistem filter dua layer:
 * - `activeFilters`: Filter yang sedang aktif dan diterapkan ke query.
 * - `tempFilters`: Filter sementara yang sedang diedit di UI (belum diterapkan).
 *
 * Pola ini memungkinkan pengguna mengubah-ubah filter di UI tanpa langsung
 * memicu query, dan hanya menerapkan perubahan saat tombol "Apply" ditekan.
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
 * // Basic usage dengan panel filter
 * const ProductFilters = () => {
 *   const {
 *     activeFilters,
 *     tempFilters,
 *     filterOpen,
 *     setTempFilters,
 *     openFilter,
 *     closeFilter,
 *     applyFilter,
 *     resetFilter,
 *   } = useProductFilters();
 *
 *   const { data } = useProductsQuery(activeFilters);
 *
 *   return (
 *     <>
 *       <Button onClick={openFilter}>Filter</Button>
 *
 *       <FilterPanel open={filterOpen} onClose={closeFilter}>
 *         <Select
 *           value={tempFilters.type}
 *           onChange={(e) => setTempFilters(prev => ({ ...prev, type: e.target.value }))}
 *         >
 *           <option value="">Semua Tipe</option>
 *           <option value="SPAREPART">Sparepart</option>
 *           <option value="OLI">Oli</option>
 *         </Select>
 *
 *         <Select
 *           value={tempFilters.isActive}
 *           onChange={(e) => setTempFilters(prev => ({ ...prev, isActive: e.target.value }))}
 *         >
 *           <option value="">Semua Status</option>
 *           <option value="true">Aktif</option>
 *           <option value="false">Nonaktif</option>
 *         </Select>
 *
 *         <TextField
 *           type="number"
 *           label="Min Harga"
 *           value={tempFilters.minPrice}
 *           onChange={(e) => setTempFilters(prev => ({ ...prev, minPrice: e.target.value }))}
 *         />
 *
 *         <TextField
 *           type="number"
 *           label="Max Harga"
 *           value={tempFilters.maxPrice}
 *           onChange={(e) => setTempFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
 *         />
 *
 *         <Button onClick={applyFilter}>Terapkan</Button>
 *         <Button onClick={resetFilter}>Reset</Button>
 *       </FilterPanel>
 *     </>
 *   );
 * };
 *
 * @example
 * // Menampilkan badge jumlah filter aktif
 * const activeFilterCount = Object.entries(activeFilters).filter(
 *   ([key, value]) => key !== "sortBy" && key !== "sortOrder" && value !== "" && value !== initialFilters[key]
 * ).length;
 *
 * return <Badge>{activeFilterCount}</Badge>;
 */
export const useProductFilters = () => {
  const [activeFilters, setActiveFilters] = useState(initialFilters);
  const [tempFilters, setTempFilters] = useState(activeFilters);
  const [filterOpen, setFilterOpen] = useState(false);

  /**
   * Membuka panel filter dan menginisialisasi tempFilters dengan activeFilters saat ini.
   */
  const openFilter = useCallback(() => {
    setTempFilters(activeFilters);
    setFilterOpen(true);
  }, [activeFilters]);

  /**
   * Menutup panel filter tanpa menyimpan perubahan tempFilters.
   */
  const closeFilter = useCallback(() => {
    setFilterOpen(false);
  }, []);

  /**
   * Menerapkan tempFilters ke activeFilters dan menutup panel.
   */
  const applyFilter = useCallback(() => {
    setActiveFilters(tempFilters);
    setFilterOpen(false);
  }, [tempFilters]);

  /**
   * Mereset semua filter ke nilai default.
   */
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