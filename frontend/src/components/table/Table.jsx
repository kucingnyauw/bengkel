/**
 * AppTable - Komponen tabel reusable dengan fitur pencarian, pagination, tombol aksi, salin via klik kanan, visibilitas kolom, expandable rows, dan navigasi keyboard.
 * Kompatibel MUI v9 | Integrasi theme penuh | Clean architecture styling
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {string} [props.title] - Judul tabel yang ditampilkan di header
 * @param {string} [props.subtitle] - Subjudul tabel yang ditampilkan di bawah judul
 * @param {string[]} [props.headers=[]] - Array header kolom
 * @param {Object[]} [props.data=[]] - Array data baris
 * @param {Function} [props.renderRow] - Fungsi render baris kustom yang menerima objek baris dan mengembalikan array nilai sel
 * @param {Function} [props.renderExpandableRow] - Fungsi render konten detail yang dapat diekspansi, menerima objek baris
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
import {
  memo,
  useState,
  useCallback,
  Fragment,
  useRef,
  useEffect,
} from "react";
import PropTypes from "prop-types";
import {
  Copy,
  Search,
  Rows,
  Columns,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Alert,
  Box,
  Card,
  Checkbox,
  Collapse,
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
    renderExpandableRow,
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
    const tableContainerRef = useRef(null);

    // State Menu & Snackbar
    const [contextMenu, setContextMenu] = useState(null);
    const [highlightedCell, setHighlightedCell] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    // State UX Lanjutan
    const [hiddenColumns, setHiddenColumns] = useState(new Set());
    const [colToggleAnchor, setColToggleAnchor] = useState(null);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [focusedIndex, setFocusedIndex] = useState(-1);

    const hasHeader = title || subtitle || onSearchChange || actions.length > 0;
    const hasExpandable = Boolean(renderExpandableRow);
    const visibleColCount =
      headers.length - hiddenColumns.size + (hasExpandable ? 1 : 0);

    // --- Handlers: Keyboard Navigation ---
    const handleKeyDown = useCallback(
      (e) => {
        if (!data || data.length === 0) return;

        if (e.key === "ArrowDown") {
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, data.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Enter" && focusedIndex >= 0) {
          e.preventDefault();
          const selectedRow = data[focusedIndex];
          if (hasExpandable) {
            handleToggleExpand(selectedRow.id ?? focusedIndex);
          }
          if (onRowClick) {
            onRowClick(selectedRow);
          }
        }
      },
      [data, focusedIndex, hasExpandable, onRowClick]
    );

    // Reset focus saat data berubah
    useEffect(() => {
      setFocusedIndex(-1);
    }, [data, page]);

    // --- Handlers: Column Visibility ---
    const handleOpenColToggle = (e) => setColToggleAnchor(e.currentTarget);
    const handleCloseColToggle = () => setColToggleAnchor(null);
    const toggleColumnVisibility = (idx) => {
      setHiddenColumns((prev) => {
        const next = new Set(prev);
        if (next.has(idx)) next.delete(idx);
        else next.add(idx);
        return next;
      });
    };

    // --- Handlers: Expandable Rows ---
    const handleToggleExpand = (rowId) => {
      setExpandedRows((prev) => {
        const next = new Set(prev);
        if (next.has(rowId)) next.delete(rowId);
        else next.add(rowId);
        return next;
      });
    };

    // --- Handlers: Context Menu & Copy ---
    const handleContextMenu = useCallback(
      (e, cellValue, rowId, colIdx, rowText) => {
        e.preventDefault();
        const cellText = extractCellText(cellValue);
        if (cellText || rowText) {
          setHighlightedCell(`${rowId}-${colIdx}`);
          setContextMenu({
            mouseX: e.clientX,
            mouseY: e.clientY,
            cellText,
            rowText,
            cellKey: `${rowId}-${colIdx}`,
          });
        }
      },
      []
    );

    const handleCloseContextMenu = useCallback(() => {
      setContextMenu(null);
      setHighlightedCell(null);
    }, []);

    const copyToClipboard = useCallback(
      async (text) => {
        if (!text) return;
        try {
          await navigator.clipboard.writeText(text);
          setSnackbarOpen(true);
        } catch {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
          setSnackbarOpen(true);
        }
        handleCloseContextMenu();
      },
      [handleCloseContextMenu]
    );

    const handleCopyCell = () => copyToClipboard(contextMenu?.cellText);
    const handleCopyRow = () => copyToClipboard(contextMenu?.rowText);
    const handleCloseSnackbar = useCallback(() => setSnackbarOpen(false), []);

    // --- Renderers ---
    const renderedHeaders = (
      <TableRow>
        {hasExpandable && (
          <TableCell
            sx={{
              py: { xs: 1.75, sm: 2 },
              px: { xs: 2, sm: 2.5 },
              width: 48,
              backgroundColor: alpha(theme.palette.background.default, 0.6),
            }}
          />
        )}
        {headers.map((header, idx) => {
          if (hiddenColumns.has(idx)) return null;
          return (
            <TableCell
              align="left"
              key={idx}
              sx={{
                py: { xs: 1.75, sm: 2 },
                px: { xs: 2, sm: 2.5 },
                fontWeight: 600,
                backgroundColor: alpha(theme.palette.background.default, 0.6),
              }}
            >
              {isLoading ? (
                <Skeleton
                  animation="wave"
                  height={16}
                  variant="text"
                  width={80}
                />
              ) : (
                header
              )}
            </TableCell>
          );
        })}
      </TableRow>
    );

    const renderedSkeletons = Array.from({ length: rowsSkeletonCount }).map(
      (_, idx) => (
        <TableRow key={`skeleton-${idx}`}>
          {hasExpandable && (
            <TableCell sx={{ py: { xs: 1.75, sm: 2 }, px: { xs: 2, sm: 2.5 } }}>
              <Skeleton variant="circular" width={20} height={20} />
            </TableCell>
          )}
          {headers.map((_, i) => {
            if (hiddenColumns.has(i)) return null;
            return (
              <TableCell
                key={`cell-skeleton-${i}`}
                sx={{ py: { xs: 1.75, sm: 2 }, px: { xs: 2, sm: 2.5 } }}
              >
                <Skeleton
                  animation="wave"
                  height={20}
                  variant="text"
                  width={`${60 + Math.random() * 40}%`}
                />
              </TableCell>
            );
          })}
        </TableRow>
      )
    );

    let renderedRows;
    if (!isLoading && data.length === 0) {
      renderedRows = (
        <TableRow>
          <TableCell
            align="center"
            colSpan={visibleColCount}
            sx={{
              borderBottom: 0,
              py: { xs: 6, sm: 8 },
            }}
          >
            <Stack sx={{ gap: 1.5, alignItems: "center" }}>
              <Typography
                color="text.secondary"
                variant="body1"
                fontWeight={500}
              >
                {emptyStateMessage}
              </Typography>
              <Typography color="text.disabled" variant="caption">
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
        const isFocused = focusedIndex === idx;
        const isExpanded = expandedRows.has(rowId);

        const rawCells = renderRow ? renderRow(row) : Object.values(row);
        const rowText = rawCells
          .map((val) => extractCellText(val))
          .filter(Boolean)
          .join(" \t ");

        return (
          <Fragment key={rowId}>
            <TableRow
              hover
              onClick={() => {
                setFocusedIndex(idx);
                if (hasExpandable) handleToggleExpand(rowId);
                onRowClick?.(row);
              }}
              onDoubleClick={() => onRowDoubleClick?.(row)}
              selected={isSelected}
              sx={{
                cursor:
                  onRowClick || onRowDoubleClick || hasExpandable
                    ? "pointer"
                    : "default",
                "&.Mui-selected": {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.06),
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                  },
                },
                "&:hover": {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.03),
                },
                ...(isFocused && {
                  boxShadow: `inset 2px 0 0 0 ${theme.palette.primary.main}`,
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                }),
              }}
            >
              {hasExpandable && (
                <TableCell
                  sx={{
                    py: { xs: 1.75, sm: 2 },
                    px: { xs: 2, sm: 2.5 },
                    width: 48,
                    borderBottom: isExpanded ? "none" : undefined,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFocusedIndex(idx);
                      handleToggleExpand(rowId);
                    }}
                    sx={{
                      transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                      transition: theme.transitions.create("transform", {
                        duration: theme.transitions.duration.shortest,
                      }),
                    }}
                  >
                    <ChevronRight size={18} />
                  </IconButton>
                </TableCell>
              )}

              {rawCells.map((val, i) => {
                if (hiddenColumns.has(i)) return null;
                const cellKey = `${rowId}-${i}`;
                const isHighlighted = highlightedCell === cellKey;

                return (
                  <TableCell
                    key={i}
                    onContextMenu={(e) =>
                      handleContextMenu(e, val, rowId, i, rowText)
                    }
                    sx={{
                      py: { xs: 1.75, sm: 2 },
                      px: { xs: 2, sm: 2.5 },
                      userSelect: "none",
                      position: "relative",
                      borderBottom: isExpanded ? "none" : undefined,
                      transition: theme.transitions.create(
                        ["box-shadow", "border-color", "background-color"],
                        { duration: theme.transitions.duration.shorter }
                      ),
                      ...(isHighlighted && {
                        boxShadow: `inset 0 0 0 1.5px ${alpha(
                          theme.palette.secondary.main,
                          0.5
                        )}`,
                        borderColor: `${alpha(
                          theme.palette.secondary.main,
                          0.3
                        )} !important`,
                        backgroundColor: alpha(
                          theme.palette.secondary.main,
                          0.04
                        ),
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

            {hasExpandable && (
              <TableRow>
                <TableCell
                  colSpan={visibleColCount}
                  sx={{
                    py: 0,
                    px: { xs: 2, sm: 2.5 },
                    borderBottom: isExpanded ? undefined : "none",
                    backgroundColor: alpha(
                      theme.palette.background.default,
                      0.2
                    ),
                  }}
                >
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box sx={{ py: 2 }}>{renderExpandableRow(row)}</Box>
                  </Collapse>
                </TableCell>
              </TableRow>
            )}
          </Fragment>
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
        <Tooltip key={idx} arrow placement="top" title={label}>
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
                {
                  duration: theme.transitions.duration.shorter,
                }
              ),
              "&:hover":
                hasTransitions && !disabled
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
              sx={{ borderRadius: "inherit", p: { xs: 1, sm: 0.75 } }}
            >
              <Icon size={18} strokeWidth={1.5} />
            </IconButton>
          </Box>
        </Tooltip>
      );
    });

    return (
      <Card
        sx={{
          borderRadius: `${theme.shape.borderRadius}px`,
          boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.04)}`,
          backgroundImage: "none",
        }}
      >
        {hasHeader && (
          <>
            <Stack
              sx={{
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "stretch", sm: "center" },
                justifyContent: "space-between",
                gap: { xs: 2.5, sm: 2 },
                px: { xs: 2.5, sm: 3 },
                py: { xs: 2.5, sm: 2.5 },
              }}
            >
              <Box sx={{ minWidth: 0, width: "100%", flex: { sm: 1 } }}>
                {title && (
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {title}
                  </Typography>
                )}
                {subtitle && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {subtitle}
                  </Typography>
                )}
              </Box>

              <Stack
                sx={{
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "stretch", sm: "center" },
                  gap: { xs: 2, sm: 1.5 },
                  width: { xs: "100%", sm: "auto" },
                  flexShrink: 0,
                }}
              >
                <Stack
                  sx={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: "10px",
                    justifyContent: "flex-end",
                    order: { xs: 1, sm: 2 },
                  }}
                >
                  {/* Tombol Toggles Kolom Dinamis */}
                  {headers.length > 0 && (
                    <Tooltip arrow placement="top" title="Atur Kolom">
                      <Box
                        component="span"
                        sx={{
                          display: "inline-flex",
                          borderRadius: `${theme.shape.borderRadius}px`,
                          border: "1px solid",
                          borderColor: Boolean(colToggleAnchor)
                            ? alpha(theme.palette.secondary.main, 0.4)
                            : alpha(theme.palette.divider, 0.8),
                          color: Boolean(colToggleAnchor)
                            ? theme.palette.secondary.main
                            : theme.palette.text.secondary,
                          bgcolor: Boolean(colToggleAnchor)
                            ? alpha(theme.palette.secondary.main, 0.06)
                            : "transparent",
                          transition: theme.transitions.create([
                            "background-color",
                            "border-color",
                            "color",
                          ]),
                          "&:hover": {
                            bgcolor: alpha(theme.palette.secondary.main, 0.06),
                            borderColor: alpha(
                              theme.palette.secondary.main,
                              0.4
                            ),
                            color: theme.palette.secondary.main,
                          },
                        }}
                      >
                        <IconButton
                          onClick={handleOpenColToggle}
                          size="small"
                          aria-label="Toggle Columns"
                          sx={{
                            borderRadius: "inherit",
                            p: { xs: 1, sm: 0.75 },
                          }}
                        >
                          <Columns size={18} strokeWidth={1.5} />
                        </IconButton>
                      </Box>
                    </Tooltip>
                  )}
                  {actionButtons}
                </Stack>

                {onSearchChange && (
                  <Box
                    sx={{
                      order: { xs: 2, sm: 1 },
                      width: { xs: "100%", sm: "auto" },
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
                                width: 32,
                                height: 26,
                                borderRadius: `${theme.shape.borderRadius}px`,
                                bgcolor: alpha(
                                  theme.palette.secondary.main,
                                  0.08
                                ),
                                color: theme.palette.secondary.main,
                                mr: 1,
                              }}
                            >
                              <Search size={15} strokeWidth={1.5} />
                            </Box>
                          ),
                        },
                      }}
                      sx={{
                        minWidth: { sm: 240 },
                        width: "100%",
                        "& .MuiOutlinedInput-root": {
                          borderRadius: `${theme.shape.borderRadius}px`,
                        },
                      }}
                    />
                  </Box>
                )}
              </Stack>
            </Stack>
            <Divider />
          </>
        )}

        <TableContainer
          ref={tableContainerRef}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          sx={{
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            outline: "none", // Menghilangkan border biru bawaan browser saat tab index aktif
          }}
        >
          <Table sx={{ minWidth: { xs: "100%", sm: minWidth } }}>
            <TableHead>{renderedHeaders}</TableHead>
            <TableBody>
              {isLoading ? renderedSkeletons : renderedRows}
            </TableBody>
          </Table>
        </TableContainer>

        {(isLoading || count > 1) && (
          <>
            <Divider />
            <Stack
              sx={{
                flexDirection: { xs: "column", sm: "row" },
                alignItems: "center",
                justifyContent: "space-between",
                gap: { xs: 2, sm: 2 },
                px: { xs: 2.5, sm: 3 },
                py: { xs: 2.5, sm: 2 },
              }}
            >
              <Box
                sx={{
                  order: { xs: 2, sm: 1 },
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                {onRowsPerPageChange && (
                  <Stack
                    sx={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: { xs: "center", sm: "flex-start" },
                      gap: 2,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ whiteSpace: "nowrap", fontWeight: 500 }}
                    >
                      Baris per halaman
                    </Typography>
                    <TextField
                      select
                      size="small"
                      value={rowsPerPage}
                      onChange={(e) =>
                        onRowsPerPageChange(Number(e.target.value))
                      }
                      slotProps={{ select: { native: true } }}
                      sx={{
                        minWidth: 85,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: `${theme.shape.borderRadius}px`,
                        },
                        "& .MuiInputBase-root": {
                          fontSize: "0.875rem",
                          bgcolor: theme.palette.background.paper,
                        },
                        "& .MuiNativeSelect-select": {
                          py: { xs: 0.75, sm: 0.5 },
                          pl: 1.5,
                          pr: 3,
                        },
                      }}
                    >
                      {rowsPerPageOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </TextField>
                  </Stack>
                )}
              </Box>

              <Box
                sx={{
                  order: { xs: 1, sm: 2 },
                  width: { xs: "100%", sm: "auto" },
                  display: "flex",
                  justifyContent: { xs: "center", sm: "flex-end" },
                }}
              >
                {isLoading ? (
                  <Skeleton
                    height={36}
                    variant="rounded"
                    width={isMobile ? 240 : 300}
                    sx={{ borderRadius: `${theme.shape.borderRadius}px` }}
                  />
                ) : (
                  <Pagination
                    count={count}
                    page={page}
                    onChange={onChange}
                    showFirstButton={!isMobile}
                    showLastButton={!isMobile}
                    shape="rounded"
                    size={isMobile ? "medium" : "small"}
                    siblingCount={isMobile ? 0 : 1}
                    boundaryCount={1}
                    sx={{
                      "& .MuiPaginationItem-root": {
                        fontSize: "0.875rem",
                        minWidth: { xs: 36, sm: 32 },
                        height: { xs: 36, sm: 32 },
                        borderRadius: `${theme.shape.borderRadius}px`,
                        border: `1px solid ${theme.palette.divider}`,
                        bgcolor: theme.palette.background.paper,
                        color: theme.palette.text.secondary,
                        transition: theme.transitions.create(
                          [
                            "background-color",
                            "border-color",
                            "color",
                            "box-shadow",
                          ],
                          {
                            duration: theme.transitions.duration.shorter,
                          }
                        ),
                        "&:hover": {
                          bgcolor: alpha(theme.palette.secondary.main, 0.06),
                          borderColor: alpha(theme.palette.secondary.main, 0.4),
                          color: theme.palette.secondary.main,
                        },
                        "&.Mui-selected": {
                          bgcolor: theme.palette.secondary.main,
                          color: theme.palette.secondary.contrastText,
                          borderColor: theme.palette.secondary.main,
                          fontWeight: 600,
                          boxShadow: `0 2px 8px ${alpha(
                            theme.palette.secondary.main,
                            0.3
                          )}`,
                          "&:hover": {
                            bgcolor: theme.palette.secondary.dark,
                          },
                        },
                      },
                      "& .MuiPaginationItem-ellipsis": {
                        border: "none",
                        bgcolor: "transparent",
                        "&:hover": { bgcolor: "transparent" },
                      },
                      "& .MuiPagination-ul": { gap: { xs: 1, sm: 0.5 } },
                    }}
                  />
                )}
              </Box>
            </Stack>
          </>
        )}

        {/* Popover untuk Pengaturan Visibilitas Kolom */}
        <Popover
          open={Boolean(colToggleAnchor)}
          anchorEl={colToggleAnchor}
          onClose={handleCloseColToggle}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            paper: {
              sx: {
                mt: 1,
                borderRadius: `${theme.shape.borderRadius}px`,
                border: `1px solid ${alpha(
                  theme.palette.secondary.main,
                  0.15
                )}`,
                boxShadow: `0 4px 20px ${alpha(
                  theme.palette.secondary.main,
                  0.12
                )}`,
                minWidth: 180,
                py: 2,
              },
            },
          }}
        >
          <Box sx={{ px: 2, pb: 1 }}>
            <Typography variant="caption" fontWeight={600}>
              Tampilkan Kolom
            </Typography>
          </Box>
          <MenuList dense>
            {headers.map((header, idx) => (
              <MenuItem
                key={idx}
                onClick={() => toggleColumnVisibility(idx)}
                sx={{
                  borderRadius: `${theme.shape.borderRadius}px`,
                  mx: 1,
                  px: 1,
                }}
              >
                <Checkbox
                  size="small"
                  checked={!hiddenColumns.has(idx)}
                  disableRipple
                  sx={{ p: 0.5, mr: 1 }}
                />
                <ListItemText
                  slotProps={{
                    primary: { fontSize: "0.875rem" },
                  }}
                >
                  {header}
                </ListItemText>
              </MenuItem>
            ))}
          </MenuList>
        </Popover>

        {/* Popover Copy Menu */}
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
                border: `1px solid ${alpha(
                  theme.palette.secondary.main,
                  0.15
                )}`,
                boxShadow: `0 4px 20px ${alpha(
                  theme.palette.secondary.main,
                  0.12
                )}`,
                minWidth: 160,
                py: 0.5,
              },
            },
          }}
        >
          <MenuList dense>
            <MenuItem
              onClick={handleCopyCell}
              disabled={!contextMenu?.cellText}
              sx={{
                borderRadius: `${theme.shape.borderRadius}px`,
                mx: 0.5,
                "&:hover": {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.06),
                },
              }}
            >
              <ListItemIcon>
                <Copy size={16} strokeWidth={1.5} />
              </ListItemIcon>
              <ListItemText
                slotProps={{
                  primary: { fontSize: "0.875rem" },
                }}
              >
                Salin Sel
              </ListItemText>
            </MenuItem>

            <MenuItem
              onClick={handleCopyRow}
              disabled={!contextMenu?.rowText}
              sx={{
                borderRadius: `${theme.shape.borderRadius}px`,
                mx: 0.5,
                "&:hover": {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.06),
                },
              }}
            >
              <ListItemIcon>
                <Rows size={16} strokeWidth={1.5} />
              </ListItemIcon>
              <ListItemText
                slotProps={{
                  primary: { fontSize: "0.875rem" },
                }}
              >
                Salin Baris
              </ListItemText>
            </MenuItem>
          </MenuList>
        </Popover>

        {/* Popover Copy Menu */}
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
                border: `1px solid ${alpha(
                  theme.palette.secondary.main,
                  0.15
                )}`,
                boxShadow: `0 4px 20px ${alpha(
                  theme.palette.secondary.main,
                  0.12
                )}`,
                minWidth: 160,
                py: 0.5,
              },
            },
          }}
        >
          <MenuList dense>
            <MenuItem
              onClick={handleCopyCell}
              disabled={!contextMenu?.cellText}
              sx={{
                borderRadius: `${theme.shape.borderRadius}px`,
                mx: 0.5,
                "&:hover": {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.06),
                },
              }}
            >
              <ListItemIcon>
                <Copy size={16} strokeWidth={1.5} />
              </ListItemIcon>
              <ListItemText
                slotProps={{
                  primary: { fontSize: "0.875rem" },
                }}
              >
                Salin Sel
              </ListItemText>
            </MenuItem>

            <MenuItem
              onClick={handleCopyRow}
              disabled={!contextMenu?.rowText}
              sx={{
                borderRadius: `${theme.shape.borderRadius}px`,
                mx: 0.5,
                "&:hover": {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.06),
                },
              }}
            >
              <ListItemIcon>
                <Rows size={16} strokeWidth={1.5} />
              </ListItemIcon>
              <ListItemText
                slotProps={{
                  primary: { fontSize: "0.875rem" },
                }}
              >
                Salin Baris
              </ListItemText>
            </MenuItem>
          </MenuList>
        </Popover>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={2500}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity="success"
            variant="standard"
            sx={{
              minWidth: { xs: "auto", sm: 320 },
              borderRadius: `${theme.shape.borderRadius}px`,
              boxShadow: `0 8px 24px ${alpha(
                theme.palette.common.black,
                0.12
              )}`,
              border: "1px solid",
              borderColor: alpha(theme.palette.success.main, 0.15),
              bgcolor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              alignItems: "center",
              "& .MuiAlert-icon": {
                color: theme.palette.success.main,
                opacity: 0.9,
                alignItems: "center",
                pt: 0,
              },
              "& .MuiAlert-message": {
                flex: 1,
                fontWeight: 500,
                fontSize: "0.875rem",
              },
            }}
          >
            Teks berhasil disalin ke clipboard
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
  /** Fungsi render konten detail yang dapat diekspansi (Expandable Row) */
  renderExpandableRow: PropTypes.func,
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
