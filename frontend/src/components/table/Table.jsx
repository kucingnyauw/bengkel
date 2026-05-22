/**
 * AppTable - Komponen tabel reusable dengan fitur pencarian, pagination, tombol aksi, dan salin via klik kanan.
 * Kompatibel MUI v9 | Integrasi theme penuh | Clean architecture styling
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {string} [props.title] - Judul tabel yang ditampilkan di header
 * @param {string} [props.subtitle] - Subjudul tabel yang ditampilkan di bawah judul
 * @param {string[]} [props.headers=[]] - Array header kolom
 * @param {Object[]} [props.data=[]] - Array data baris
 * @param {Function} [props.renderRow] - Fungsi render baris kustom yang menerima objek baris dan mengembalikan array nilai sel
 * @param {string|number} [props.selectedId] - ID baris yang sedang dipilih untuk highlight
 * @param {string} [props.searchVal] - Nilai input pencarian terkontrol
 * @param {string} [props.searchPlaceholder="Cari..."] - Teks placeholder untuk input pencarian
 * @param {Object[]} [props.actions=[]] - Array konfigurasi tombol aksi
 * @param {ElementType} props.actions[].icon - Komponen ikon Lucide untuk tombol aksi
 * @param {string} props.actions[].label - Label tooltip dan aria-label untuk tombol aksi
 * @param {Function} props.actions[].onClick - Handler klik untuk tombol aksi
 * @param {string} [props.actions[].color="primary"] - Varian warna MUI untuk tombol ikon
 * @param {boolean} [props.actions[].disabled] - Apakah tombol aksi dinonaktifkan
 * @param {boolean} [props.actions[].hasTransitions=true] - Apakah tombol aksi memiliki transisi hover
 * @param {Function} [props.onSearchChange] - Fungsi handler perubahan input pencarian
 * @param {Function} [props.onRowClick] - Fungsi handler klik baris, menerima objek baris
 * @param {Function} [props.onRowDoubleClick] - Fungsi handler klik ganda baris, menerima objek baris
 * @param {number} [props.minWidth=900] - Lebar minimum tabel dalam piksel
 * @param {boolean} [props.isLoading=false] - Status loading
 * @param {number} [props.rowsSkeletonCount=10] - Jumlah baris skeleton saat loading
 * @param {number} [props.count] - Total halaman untuk pagination
 * @param {number} [props.page=1] - Halaman saat ini
 * @param {Function} [props.onChange] - Fungsi handler perubahan halaman, menerima event dan nomor halaman
 * @param {number} [props.rowsPerPage=5] - Jumlah baris per halaman
 * @param {Function} [props.onRowsPerPageChange] - Fungsi handler perubahan jumlah baris per halaman
 * @param {number[]} [props.rowsPerPageOptions=[5,10,25,50]] - Opsi jumlah baris per halaman yang tersedia
 * @param {string} [props.emptyStateMessage="Tidak ada data ditemukan."] - Pesan saat data kosong
 *
 * @returns {JSX.Element} Komponen tabel
 */
import { memo, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Copy, Search } from "lucide-react";
import {
  Box,
  Card,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Pagination,
  Popover,
  Skeleton,
  Snackbar,
  Alert,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useDevice } from "@hooks/useDevice.js";

/**
 * Ekstrak teks biasa dari elemen React atau nilai primitif
 * @param {*} node - Node React atau nilai primitif
 * @returns {string} Teks yang diekstrak
 */
const extractCellText = (node) => {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractCellText).join("");
  if (node?.props?.children) return extractCellText(node.props.children);
  return "";
};

const AppTable = memo(
  ({
    actions = [],
    count,
    data = [],
    emptyStateMessage = "Tidak ada data ditemukan.",
    headers = [],
    isLoading = false,
    minWidth = 900,
    onChange,
    onRowClick,
    onRowDoubleClick,
    onRowsPerPageChange,
    onSearchChange,
    page = 1,
    renderRow,
    rowsPerPage = 5,
    rowsPerPageOptions = [5, 10, 25, 50],
    rowsSkeletonCount = 10,
    searchPlaceholder = "Cari...",
    searchVal,
    selectedId,
    subtitle,
    title,
  }) => {
    const theme = useTheme();
    const { isMobile } = useDevice();
    const hasHeader = title || subtitle || onSearchChange || actions.length > 0;

    const [contextMenu, setContextMenu] = useState(null);
    const [highlightedCell, setHighlightedCell] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    /**
     * Menangani klik kanan pada sel
     */
    const handleContextMenu = useCallback((e, cellValue, rowId, colIdx) => {
      e.preventDefault();
      const text = extractCellText(cellValue);
      if (text) {
        setHighlightedCell(`${rowId}-${colIdx}`);
        setContextMenu({
          mouseX: e.clientX,
          mouseY: e.clientY,
          text,
          cellKey: `${rowId}-${colIdx}`,
        });
      }
    }, []);

    /**
     * Menangani penutupan menu konteks
     */
    const handleCloseContextMenu = useCallback(() => {
      setContextMenu(null);
      setHighlightedCell(null);
    }, []);

    /**
     * Menangani salin teks sel ke clipboard
     */
    const handleCopyCell = useCallback(async () => {
      if (!contextMenu?.text) return;
      try {
        await navigator.clipboard.writeText(contextMenu.text);
        setSnackbarOpen(true);
      } catch {
        const textarea = document.createElement("textarea");
        textarea.value = contextMenu.text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setSnackbarOpen(true);
      }
      handleCloseContextMenu();
    }, [contextMenu, handleCloseContextMenu]);

    /**
     * Menangani penutupan snackbar
     */
    const handleCloseSnackbar = useCallback(() => {
      setSnackbarOpen(false);
    }, []);

    const renderedHeaders = (
      <TableRow>
        {headers.map((header, idx) => (
          <TableCell
            align="left"
            key={idx}
            sx={{
              py: 2.5,
              px: 3,
              fontWeight: 400,
              [theme.breakpoints.down("sm")]: { py: 2, px: 2 },
            }}
          >
            {isLoading ? (
              <Skeleton animation="wave" height={16} variant="text" width={80} />
            ) : (
              header
            )}
          </TableCell>
        ))}
      </TableRow>
    );

    const renderedSkeletons = Array.from({ length: rowsSkeletonCount }).map(
      (_, idx) => (
        <TableRow key={`skeleton-${idx}`}>
          {headers.map((_, i) => (
            <TableCell
              key={`cell-skeleton-${i}`}
              sx={{
                py: 2.5,
                px: 3,
                fontWeight: 400,
                [theme.breakpoints.down("sm")]: { py: 2, px: 2 },
              }}
            >
              <Skeleton
                animation="wave"
                height={20}
                variant="text"
                width={`${60 + Math.random() * 40}%`}
              />
            </TableCell>
          ))}
        </TableRow>
      )
    );

    let renderedRows;
    if (!isLoading && data.length === 0) {
      renderedRows = (
        <TableRow>
          <TableCell
            align="center"
            colSpan={headers.length}
            sx={{
              borderBottom: 0,
              py: 10,
              [theme.breakpoints.down("sm")]: { py: 6 },
            }}
          >
            <Stack sx={{ gap: 1.5, alignItems: "center" }}>
              <Typography color="text.primary" fontWeight={400} variant="subtitle1">
                {emptyStateMessage}
              </Typography>
              <Typography color="text.secondary" fontWeight={400} variant="body2">
                Silakan coba ubah filter atau tambahkan data baru
              </Typography>
            </Stack>
          </TableCell>
        </TableRow>
      );
    } else if (!isLoading && data.length > 0) {
      renderedRows = data.map((row, idx) => {
        const rowId = row.id ?? idx;
        const isSelected = selectedId === rowId;
        const cells = renderRow ? renderRow(row) : Object.values(row);

        return (
          <TableRow
            hover
            key={rowId}
            onClick={() => onRowClick?.(row)}
            onDoubleClick={() => onRowDoubleClick?.(row)}
            selected={isSelected}
            sx={{
              cursor: onRowClick || onRowDoubleClick ? "pointer" : "default",
              "&.Mui-selected": {
                backgroundColor: alpha(theme.palette.secondary.main, 0.06),
                "&:hover": {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                },
              },
              "&:hover": {
                backgroundColor: alpha(theme.palette.secondary.main, 0.03),
              },
            }}
          >
            {cells.map((val, i) => {
              const cellKey = `${rowId}-${i}`;
              const isHighlighted = highlightedCell === cellKey;

              return (
                <TableCell
                  key={i}
                  onContextMenu={(e) => handleContextMenu(e, val, rowId, i)}
                  sx={{
                    py: 2.5,
                    px: 3,
                    fontWeight: 400,
                    [theme.breakpoints.down("sm")]: { py: 2, px: 2 },
                    userSelect: "none",
                    position: "relative",
                    transition: theme.transitions.create(
                      ["box-shadow", "border-color", "background-color"],
                      { duration: theme.transitions.duration.shorter }
                    ),
                    ...(isHighlighted && {
                      boxShadow: `inset 0 0 0 1.5px ${alpha(theme.palette.secondary.main, 0.5)}`,
                      borderColor: `${alpha(theme.palette.secondary.main, 0.3)} !important`,
                      backgroundColor: alpha(theme.palette.secondary.main, 0.04),
                      borderRadius: `${theme.shape.borderRadius}px`,
                      zIndex: 1,
                    }),
                  }}
                >
                  {val}
                </TableCell>
              );
            })}
          </TableRow>
        );
      });
    }

    const actionButtons = actions.map((action, idx) => {
      const {
        color = "primary",
        disabled,
        icon: Icon,
        label,
        onClick,
        hasTransitions = true,
      } = action;

      return (
        <Box
          key={idx}
          component="span"
          sx={{ display: "inline-flex", alignItems: "center" }}
        >
          <Tooltip arrow placement="top" title={label}>
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                borderRadius: `${theme.shape.borderRadius}px`,
                border: "1px solid",
                borderColor: disabled
                  ? alpha(theme.palette.divider, 0.4)
                  : alpha(theme.palette.divider, 0.8),
                color: disabled
                  ? theme.palette.action.disabled
                  : theme.palette.text.secondary,
                transition: theme.transitions.create(
                  ["background-color", "border-color", "color"],
                  { duration: theme.transitions.duration.shorter }
                ),
                "&:hover": hasTransitions && !disabled
                  ? {
                      bgcolor: alpha(theme.palette.secondary.main, 0.06),
                      borderColor: alpha(theme.palette.secondary.main, 0.4),
                      color: theme.palette.secondary.main,
                    }
                  : {},
              }}
            >
              <IconButton
                color={color}
                disabled={disabled}
                onClick={onClick}
                size="small"
                aria-label={label}
                sx={{ borderRadius: "inherit" }}
              >
                <Icon size={17} strokeWidth={1.5} />
              </IconButton>
            </Box>
          </Tooltip>
        </Box>
      );
    });

    return (
      <Card>
        {hasHeader && (
          <>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: { xs: "stretch", sm: "center" },
                justifyContent: "space-between",
                gap: 2,
                px: 4,
                py: 3,
              }}
            >
              <Box
                sx={{
                  order: 1,
                  flex: { xs: "1 1 100%", sm: "0 1 auto" },
                  minWidth: 0,
                }}
              >
                {title && (
                  <Typography variant="h6" fontWeight={400}>
                    {title}
                  </Typography>
                )}
                {subtitle && (
                  <Typography variant="body2" color="text.secondary" fontWeight={400} sx={{ mt: 0.5 }}>
                    {subtitle}
                  </Typography>
                )}
              </Box>

              {onSearchChange && (
                <Box
                  sx={{
                    order: { xs: 3, sm: 2 },
                    flex: { xs: "1 1 100%", sm: "0 1 auto" },
                    ml: { sm: "auto" },
                  }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    value={searchVal || ""}
                    onChange={onSearchChange}
                    placeholder={searchPlaceholder}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <Box
                            sx={{
                              display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 40,
                        height: 28,
                        borderRadius: `${theme.shape.borderRadius}px`,
                        bgcolor: alpha(theme.palette.secondary.main, 0.08),
                        color: theme.palette.secondary.main,
                        mr: 1,
                            }}
                          >
                            <Search size={15} strokeWidth={1.5} />
                          </Box>
                        ),
                      },
                    }}
                    sx={{ minWidth: { sm: 220 } }}
                  />
                </Box>
              )}

              {actions.length > 0 && (
                <Box
                  sx={{
                    order: { xs: 2, sm: 3 },
                    flex: { xs: "1 1 auto", sm: "0 0 auto" },
                    display: "flex",
                    justifyContent: { xs: "flex-end", sm: "flex-start" },
                  }}
                >
                  <Box sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
                    {actionButtons}
                  </Box>
                </Box>
              )}
            </Box>
            <Divider />
          </>
        )}

        <TableContainer sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <Table sx={{ minWidth: { xs: "100%", sm: minWidth } }}>
            <TableHead>{renderedHeaders}</TableHead>
            <TableBody>{isLoading ? renderedSkeletons : renderedRows}</TableBody>
          </Table>
        </TableContainer>

        {(isLoading || count > 1) && (
          <>
            <Divider />
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                px: 4,
                py: 3,
              }}
            >
              {onRowsPerPageChange && (
              <Box
              sx={{
                order: { xs: 2, sm: 1 },
                display: "flex",
                alignItems: "center",
                gap: 4,
                width: { xs: "100%", sm: "auto" },
                justifyContent: { xs: "center", sm: "flex-start" },
              }}
            >
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ fontWeight: 500, whiteSpace: "nowrap" }}
              >
                Tampilkan
              </Typography>
              <TextField
                select
                size="small"
                value={rowsPerPage}
                onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
                slotProps={{ select: { native: true } }}
                sx={(theme) => ({
                  minWidth: 68,
                  "& .MuiInputBase-root": {
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "text.primary",
                    borderRadius: `${theme.shape.borderRadius}px`,
                    bgcolor: "background.paper",
                    transition: "all 0.2s ease-in-out",
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: alpha(theme.palette.primary.main, 0.4),
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.palette.primary.main,
                      borderWidth: "1px",
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
                    },
                  },
                  "& .MuiNativeSelect-select": {
                    py: 0.5,
                    pl: 1.25,
                    pr: 3,
                  },
                })}
              >
                {rowsPerPageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </TextField>
            </Box>
              )}

              <Box
                sx={{
                  order: { xs: 1, sm: 2 },
                  display: "flex",
                  justifyContent: { xs: "center", sm: "flex-end" },
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                {isLoading ? (
                  <Skeleton height={40} variant="rounded" width={isMobile ? 250 : 350} />
                ) : (
                  <Pagination
                  count={count}
                  page={page}
                  onChange={onChange}
                  showFirstButton
                  showLastButton
                  shape="rounded"
                  size={isMobile ? "small" : "medium"}
                  siblingCount={isMobile ? 0 : 1}
                  boundaryCount={isMobile ? 1 : 2}
                  sx={(theme) => ({
                    display: "flex",
                    justifyContent: "center",
                    "& .MuiPaginationItem-root": {
                      fontWeight: 500,
                      fontSize: "0.875rem",
                      borderRadius: `${theme.shape.borderRadius}px`,
                      border: `1px solid ${theme.palette.divider}`,
                      bgcolor: "background.paper",
                      color: "text.secondary",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.06),
                        borderColor: alpha(theme.palette.primary.main, 0.4),
                        color: theme.palette.primary.main,
                      },
                    },
                    "& .MuiPaginationItem-root.Mui-selected": {
                      bgcolor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      borderColor: theme.palette.primary.main,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.24)}`,
                      "&:hover": {
                        bgcolor: theme.palette.primary.dark,
                      },
                    },
                    "& .MuiPaginationItem-ellipsis": {
                      border: "none",
                      bgcolor: "transparent",
                      "&:hover": {
                        bgcolor: "transparent",
                      },
                    },
                    "& .MuiPagination-ul": {
                      gap: { xs: 0.5, sm: 1 },
                    },
                  })}
                />
                )}
              </Box>
            </Box>
          </>
        )}

        <Popover
          open={Boolean(contextMenu)}
          onClose={handleCloseContextMenu}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu
              ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
              : undefined
          }
          slotProps={{
            paper: {
              sx: {
                borderRadius: `${theme.shape.borderRadius}px`,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                boxShadow: `0 4px 20px ${alpha(theme.palette.secondary.main, 0.12)}`,
                minWidth: 140,
                py: 0.5,
              },
            },
          }}
        >
          <MenuList dense>
            <MenuItem
              onClick={handleCopyCell}
              sx={{
                borderRadius: `${theme.shape.borderRadius}px`,
                mx: 0.5,
                "&:hover": {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.06),
                },
              }}
            >
              <ListItemIcon>
                <Copy size={15} strokeWidth={1.5} />
              </ListItemIcon>
              <ListItemText sx={{ fontWeight: 400 }}>Salin</ListItemText>
            </MenuItem>
          </MenuList>
        </Popover>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={2000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity="success"
            variant="outlined"
            onClose={handleCloseSnackbar}
            sx={{
              borderRadius: `${theme.shape.borderRadius}px`,
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              bgcolor: alpha(theme.palette.background.paper, 0.95),
              backdropFilter: "blur(8px)",
              boxShadow: `0 4px 20px ${alpha(theme.palette.secondary.main, 0.1)}`,
              alignItems: "center",
            }}
          >
            Berhasil disalin
          </Alert>
        </Snackbar>
      </Card>
    );
  }
);

AppTable.propTypes = {
  /** Array konfigurasi tombol aksi */
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      /** Varian warna MUI untuk tombol ikon */
      color: PropTypes.string,
      /** Apakah tombol aksi dinonaktifkan */
      disabled: PropTypes.bool,
      /** Apakah tombol aksi memiliki transisi hover */
      hasTransitions: PropTypes.bool,
      /** Komponen ikon Lucide */
      icon: PropTypes.elementType.isRequired,
      /** Label tooltip dan aria-label */
      label: PropTypes.string.isRequired,
      /** Fungsi handler klik */
      onClick: PropTypes.func.isRequired,
    })
  ),
  /** Total halaman untuk pagination */
  count: PropTypes.number,
  /** Array objek data untuk baris tabel */
  data: PropTypes.arrayOf(PropTypes.object),
  /** Pesan saat data kosong */
  emptyStateMessage: PropTypes.string,
  /** Array string header kolom */
  headers: PropTypes.arrayOf(PropTypes.string),
  /** Status loading */
  isLoading: PropTypes.bool,
  /** Lebar minimum tabel dalam piksel */
  minWidth: PropTypes.number,
  /** Fungsi handler perubahan halaman */
  onChange: PropTypes.func,
  /** Fungsi handler klik baris */
  onRowClick: PropTypes.func,
  /** Fungsi handler klik ganda baris */
  onRowDoubleClick: PropTypes.func,
  /** Fungsi handler perubahan jumlah baris per halaman */
  onRowsPerPageChange: PropTypes.func,
  /** Fungsi handler perubahan input pencarian */
  onSearchChange: PropTypes.func,
  /** Halaman saat ini */
  page: PropTypes.number,
  /** Fungsi render baris kustom */
  renderRow: PropTypes.func,
  /** Jumlah baris per halaman */
  rowsPerPage: PropTypes.number,
  /** Opsi jumlah baris per halaman yang tersedia */
  rowsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
  /** Jumlah baris skeleton saat loading */
  rowsSkeletonCount: PropTypes.number,
  /** Teks placeholder untuk input pencarian */
  searchPlaceholder: PropTypes.string,
  /** Nilai input pencarian terkontrol */
  searchVal: PropTypes.string,
  /** ID baris yang sedang dipilih */
  selectedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Subjudul tabel */
  subtitle: PropTypes.string,
  /** Judul tabel */
  title: PropTypes.string,
};

export default AppTable;