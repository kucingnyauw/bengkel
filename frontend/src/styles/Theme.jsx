// theme.jsx - Tema Utama
import { createTheme, alpha } from "@mui/material/styles";
import { Color } from "@styles/Colors.jsx";
import { Size } from "@styles/Size.jsx";

/**
 * @param {import("@mui/material/styles").Theme} theme
 * @returns {import("@mui/material/styles").Components}
 */
const componentsOverride = (theme) => ({
  MuiCssBaseline: {
    styleOverrides: {
      "@keyframes shimmerLoop": {
        "0%": { left: "-100%" },
        "100%": { left: "100%" },
      },
      body: {
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        transition: "background-color 0.2s ease, color 0.2s ease",
        fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11", "ss03", "ss04"',
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        textRendering: "optimizeLegibility",
        scrollBehavior: "smooth",
        fontVariantNumeric: "tabular-nums",
      },
      "::-webkit-scrollbar": {
        width: "8px",
        height: "8px",
      },
      "::-webkit-scrollbar-track": {
        background: "transparent",
      },
      "::-webkit-scrollbar-thumb": {
        background: alpha(theme.palette.secondary.main, 0.3),
        borderRadius: theme.shape.borderRadius,
        border: "2px solid transparent",
        backgroundClip: "padding-box",
      },
      "::-webkit-scrollbar-thumb:hover": {
        background: alpha(theme.palette.secondary.main, 0.5),
        border: "2px solid transparent",
        backgroundClip: "padding-box",
      },
      "::-webkit-scrollbar-corner": {
        background: "transparent",
      },
      "::selection": {
        backgroundColor: alpha(theme.palette.secondary.main, 0.2),
        color: theme.palette.text.primary,
      },
    },
  },

  // ==================== BUTTON ====================
  MuiButton: {
    defaultProps: {
      disableElevation: true,
      disableRipple: false,
    },
    styleOverrides: {
      root: {
        borderRadius: `${theme.shape.borderRadius}px`,
        padding: "8px 16px",
        fontWeight: 400,
        fontSize: "0.875rem",
        textTransform: "none",
        letterSpacing: "0",
        transition: "all 0.3s ease",
        position: "relative",
        overflow: "hidden",
        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          left: "-100%",
          width: "100%",
          height: "100%",
          background: `linear-gradient(90deg, transparent, ${alpha(
            theme.palette.common.white,
            0.15
          )}, transparent)`,
          opacity: 0,
          transition: "opacity 0.5s ease",
        },
        "&:hover::after": {
          opacity: 1,
          animation: "shimmerLoop 2.2s ease-in-out infinite",
        },
        "&:active": {
          transform: "scale(0.98)",
        },
        "&:focus-visible": {
          outline: "none",
          boxShadow: `0 0 0 2px ${theme.palette.background.default}, 0 0 0 4px ${theme.palette.secondary.main}`,
        },
      },
      contained: {
        backgroundColor: theme.palette.text.primary,
        color: theme.palette.background.paper,
        boxShadow: "none",
        backgroundImage: "none",
        border: "1px solid transparent",
        "&:hover": {
          backgroundColor: alpha(theme.palette.text.primary, 0.88),
          boxShadow: `0 4px 14px 0 ${alpha(theme.palette.secondary.main, 0.3)}`,
          backgroundImage: "none",
        },
        "&:disabled": {
          backgroundColor: theme.palette.action.disabledBackground,
          color: theme.palette.action.disabled,
          borderColor: "transparent",
        },
      },
      outlined: {
        borderWidth: "1px",
        borderColor: theme.palette.divider,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        "&:hover": {
          backgroundColor: theme.palette.action.hover,
          borderColor: theme.palette.secondary.main,
          boxShadow: `0 0 0 1px ${alpha(theme.palette.secondary.main, 0.2)}`,
        },
      },
      text: {
        color: theme.palette.text.secondary,
        "&:hover": {
          backgroundColor: theme.palette.action.hover,
          color: theme.palette.text.primary,
        },
      },
      sizeSmall: {
        padding: "6px 12px",
        fontSize: "0.8125rem",
      },
      sizeLarge: {
        padding: "12px 24px",
        fontSize: "0.9375rem",
      },
      containedSecondary: {
        background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
        color: theme.palette.secondary.contrastText,
        "&:hover": {
          background: `linear-gradient(135deg, ${theme.palette.secondary.light}, ${theme.palette.secondary.main})`,
          boxShadow: `0 4px 14px 0 ${alpha(theme.palette.secondary.main, 0.4)}`,
        },
      },
    },
    variants: [
      {
        props: { variant: "ghost" },
        style: {
          backgroundColor: "transparent",
          color: theme.palette.text.primary,
          "&:hover": { backgroundColor: theme.palette.action.hover },
        },
      },
      {
        props: { variant: "link" },
        style: {
          backgroundColor: "transparent",
          color: theme.palette.secondary.main,
          textDecoration: "underline",
          textUnderlineOffset: "4px",
          "&:hover": { textDecorationColor: theme.palette.secondary.dark },
        },
      },
    ],
  },

  // ==================== ICON BUTTON ====================
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: `${theme.shape.borderRadius}px`,
        transition: "all 0.15s ease",
        border: "1px solid transparent",
        color: theme.palette.text.primary,
        "&:hover": {
          backgroundColor: theme.palette.action.hover,
          borderColor: theme.palette.divider,
        },
        "&:active": { transform: "scale(0.95)" },
        "&:focus-visible": {
          outline: "none",
          boxShadow: `0 0 0 2px ${theme.palette.background.default}, 0 0 0 4px ${theme.palette.secondary.main}`,
        },
      },
      sizeSmall: { padding: 6 },
    },
  },

  // ==================== PAPER ====================
  MuiPaper: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: {
        backgroundImage: "none",
        borderRadius: `${theme.shape.borderRadius}px`,
        border: `1px solid ${theme.palette.divider}`,
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
      },
      elevation1: { boxShadow: theme.shadows[1] },
      elevation2: { boxShadow: theme.shadows[2] },
      elevation3: { boxShadow: theme.shadows[3] },
      elevation4: { boxShadow: theme.shadows[4] },
      outlined: { borderWidth: "1px", borderColor: theme.palette.divider },
    },
  },

  // ==================== CARD ====================
  MuiCard: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: {
        borderRadius: `${theme.shape.borderRadius}px`,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[1],
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        "&:hover": {
          borderColor: alpha(theme.palette.secondary.main, 0.4),
          boxShadow: `0 4px 20px -2px ${alpha(
            theme.palette.secondary.main,
            0.15
          )}, 0 0 0 1px ${alpha(theme.palette.secondary.main, 0.15)}`,
        },
      },
    },
  },

  MuiCardHeader: {
    styleOverrides: {
      root: { padding: "24px 24px 16px" },
      title: {
        fontSize: "1.125rem",
        fontWeight: 400,
        letterSpacing: "-0.01em",
        lineHeight: 1.75,
      },
      subheader: {
        fontSize: "0.875rem",
        marginTop: 4,
        lineHeight: 1.5,
        color: theme.palette.text.secondary,
        fontWeight: 400,
      },
      action: { marginTop: 0, marginRight: -4 },
    },
  },

  MuiCardContent: {
    styleOverrides: {
      root: { padding: "24px", "&:last-child": { paddingBottom: "24px" } },
    },
  },

  MuiCardActions: {
    styleOverrides: {
      root: { padding: "12px 24px 20px", gap: 12 },
    },
  },

  // ==================== APP BAR ====================
  MuiAppBar: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: {
        borderRadius: 0,
        boxShadow: "none",
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: alpha(theme.palette.background.paper, 0.7),
        color: theme.palette.text.primary,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      },
    },
  },

  MuiToolbar: {
    styleOverrides: {
      root: {
        minHeight: 64,
        paddingLeft: 24,
        paddingRight: 24,
        "@media (min-width: 600px)": { minHeight: 64 },
      },
    },
  },

  // ==================== DRAWER ====================
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRadius: 0,
        borderRight: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        transition: "width 0.2s ease",
        boxShadow: "none",
      },
    },
  },

  // ==================== LIST ====================
  MuiList: {
    styleOverrides: { root: { padding: 8 } },
  },

  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: `${theme.shape.borderRadius}px`,
        padding: "8px 12px",
        margin: "2px 4px",
        transition: "all 0.15s ease",
        "&.Mui-selected": {
          backgroundColor: alpha(theme.palette.secondary.main, 0.12),
          color: theme.palette.secondary.main,
          "& .MuiListItemIcon-root": { color: theme.palette.secondary.main },
        },
        "&:hover": { backgroundColor: theme.palette.action.hover },
        "&:focus-visible": {
          outline: "none",
          boxShadow: `0 0 0 2px ${theme.palette.background.default}, 0 0 0 4px ${theme.palette.secondary.main}`,
        },
      },
    },
  },

  MuiListItemIcon: {
    styleOverrides: {
      root: { minWidth: 40, color: theme.palette.text.secondary },
    },
  },

  MuiListItemText: {
    styleOverrides: {
      primary: { fontSize: "0.875rem", fontWeight: 400, lineHeight: 1.5 },
      secondary: { fontSize: "0.8125rem", fontWeight: 400, lineHeight: 1.25 },
    },
  },

  // ==================== INPUT ====================
  MuiOutlinedInput: {
    defaultProps: { size: "small" },
    styleOverrides: {
      root: {
        borderRadius: `${theme.shape.borderRadius}px`,
        transition: "all 0.15s ease",
        backgroundColor: theme.palette.background.paper,
        "& fieldset": {
          borderWidth: "1px",
          borderColor: theme.palette.divider,
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        },
        "&:hover fieldset": { borderColor: theme.palette.secondary.main },
        "&.Mui-focused fieldset": {
          borderColor: theme.palette.secondary.main,
          borderWidth: "1px",
          boxShadow: `0 0 0 1px ${theme.palette.secondary.main}`,
        },
        "&.Mui-error fieldset": {
          borderColor: theme.palette.error.main,
          borderWidth: "1px",
        },
        "&.Mui-error.Mui-focused fieldset": {
          boxShadow: `0 0 0 1px ${theme.palette.error.main}`,
        },
      },
      input: {
        padding: "8px 12px",
        fontSize: "0.875rem",
        lineHeight: 1.5,
        fontWeight: 400,
        "&::placeholder": { color: theme.palette.text.disabled, opacity: 1 },
      },
      inputSizeSmall: { padding: "6px 10px", fontSize: "0.8125rem" },
      multiline: { padding: "8px 12px" },
    },
  },

  MuiInputLabel: {
    styleOverrides: {
      root: {
        fontSize: "0.875rem",
        fontWeight: 400,
        color: theme.palette.text.secondary,
        "&.Mui-focused": { color: theme.palette.secondary.main },
        "&.Mui-error": { color: theme.palette.error.main },
      },
    },
  },

  MuiSelect: {
    styleOverrides: {
      select: {
        minHeight: 35,
        padding: "8px 12px",
        fontSize: "0.875rem",
        borderRadius: `${theme.shape.borderRadius}px`,
        fontWeight: 400,
      },
      icon: { color: theme.palette.text.secondary, right: 12 },
    },
  },

  MuiTextField: {
    defaultProps: { size: "small", variant: "outlined", fullWidth: true },
    styleOverrides: {
      root: {
        "& .MuiOutlinedInput-root": {
          minHeight: 48,
          borderRadius: `${theme.shape.borderRadius}px`,
        },
        "& .MuiInputLabel-root": {
          transform: "translate(14px, 12px) scale(1)",
        },
        "& .MuiInputLabel-shrink": {
          transform: "translate(14px, -6px) scale(0.75)",
        },
      },
    },
  },

  MuiFormHelperText: {
    styleOverrides: {
      root: {
        fontSize: "0.75rem",
        marginTop: 6,
        marginLeft: 0,
        letterSpacing: "0",
        fontWeight: 400,
      },
    },
  },

  // ==================== MENU ====================
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: `${theme.shape.borderRadius}px`,
        boxShadow: theme.shadows[3],
        border: `1px solid ${theme.palette.divider}`,
        marginTop: 4,
        padding: 4,
        backgroundColor: theme.palette.background.paper,
        backdropFilter: "blur(12px)",
      },
    },
  },

  MuiMenuItem: {
    styleOverrides: {
      root: {
        borderRadius: `${theme.shape.borderRadius}px`,
        padding: "8px 12px",
        fontSize: "0.875rem",
        fontWeight: 400,
        margin: "1px 0",
        transition: "all 0.15s ease",
        minHeight: 36,
        "&:hover": { backgroundColor: theme.palette.action.hover },
        "&.Mui-selected": {
          backgroundColor: alpha(theme.palette.secondary.main, 0.12),
          color: theme.palette.secondary.main,
        },
      },
    },
  },

  // ==================== TABLE ====================
  MuiTableContainer: {
    styleOverrides: {
      root: {
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: `${theme.shape.borderRadius}px`,
        overflow: "hidden",
      },
    },
  },

  MuiTableHead: {
    styleOverrides: {
      root: {
        "& .MuiTableCell-root": {
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: "transparent",
        },
      },
    },
  },

  MuiTableRow: {
    styleOverrides: {
      root: {
        transition: "background-color 0.15s ease",
        "&:hover": {
          backgroundColor: alpha(theme.palette.secondary.main, 0.04),
        },
        "&:last-child td": { borderBottom: 0 },
      },
    },
  },

  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottom: `1px solid ${theme.palette.divider}`,
        padding: "12px 16px",
        fontSize: "0.875rem",
        fontWeight: 400,
      },
      head: {
        fontWeight: 400,
        fontSize: "0.75rem",
        color: theme.palette.text.secondary,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      },
    },
  },

  // ==================== DIVIDER ====================
  MuiDivider: {
    styleOverrides: {
      root: {
        borderColor: theme.palette.divider,
        borderBottomWidth: "1px",
        margin: "16px 0",
      },
    },
  },

  // ==================== CHIP ====================
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: `${theme.shape.borderRadius}px`,
        fontWeight: 400,
        fontSize: "0.75rem",
        height: 28,
        letterSpacing: "0",
        transition: "all 0.15s ease",
      },
      sizeSmall: { height: 22, fontSize: "0.6875rem" },
      outlined: {
        borderWidth: "1px",
        borderColor: theme.palette.divider,
        backgroundColor: "transparent",
      },
      filled: {
        backgroundColor: alpha(theme.palette.secondary.main, 0.1),
        color: theme.palette.secondary.main,
        boxShadow: "none",
      },
      deleteIcon: {
        color: "inherit",
        opacity: 0.5,
        "&:hover": { opacity: 0.8 },
      },
    },
  },

  // ==================== BADGE ====================
  MuiBadge: {
    styleOverrides: {
      badge: {
        fontWeight: 400,
        fontSize: "0.625rem",
        height: 18,
        minWidth: 18,
        padding: "0 4px",
        border: `2px solid ${theme.palette.background.paper}`,
        borderRadius: `${theme.shape.borderRadius}px`,
        boxShadow: "none",
        backgroundColor: theme.palette.secondary.main,
      },
    },
  },

  // ==================== TOOLTIP ====================
  MuiTooltip: {
    defaultProps: {
      arrow: false,
      placement: "top",
      enterDelay: 500,
      leaveDelay: 100,
    },
    styleOverrides: {
      tooltip: {
        borderRadius: `${theme.shape.borderRadius}px`,
        fontSize: "0.75rem",
        fontWeight: 400,
        padding: "6px 12px",
        backgroundColor: theme.palette.text.primary,
        boxShadow: theme.shadows[2],
        color: theme.palette.background.paper,
        letterSpacing: "0",
      },
      arrow: { color: theme.palette.text.primary },
    },
  },

  // ==================== DIALOG ====================
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: `${theme.shape.borderRadius}px`,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[4],
        overflow: "hidden",
        backgroundColor: theme.palette.background.paper,
      },
    },
  },

  MuiDialogTitle: {
    styleOverrides: {
      root: {
        fontSize: "1rem",
        fontWeight: 400,
        padding: "16px 20px",
        letterSpacing: "-0.01em",
      },
    },
  },

  MuiDialogContent: {
    styleOverrides: {
      root: { padding: "4px 20px 16px" },
      dividers: {
        borderTop: `1px solid ${theme.palette.divider}`,
        borderBottom: `1px solid ${theme.palette.divider}`,
      },
    },
  },

  MuiDialogActions: {
    styleOverrides: { root: { padding: "12px 20px 16px", gap: 10 } },
  },

  // ==================== ALERT ====================
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: `${theme.shape.borderRadius}px`,
        padding: "12px 16px",
        fontSize: "0.875rem",
        alignItems: "center",
        border: "1px solid",
        backdropFilter: "none",
        backgroundColor: theme.palette.background.paper,
        fontWeight: 400,
      },
      standardSuccess: {
        color: theme.palette.success.dark,
        borderColor: alpha(theme.palette.success.main, 0.3),
        backgroundColor: alpha(theme.palette.success.main, 0.05),
      },
      standardInfo: {
        color: theme.palette.info.dark,
        borderColor: alpha(theme.palette.info.main, 0.3),
        backgroundColor: alpha(theme.palette.info.main, 0.05),
      },
      standardWarning: {
        color: theme.palette.warning.dark,
        borderColor: alpha(theme.palette.warning.main, 0.3),
        backgroundColor: alpha(theme.palette.warning.main, 0.05),
      },
      standardError: {
        color: theme.palette.error.dark,
        borderColor: alpha(theme.palette.error.main, 0.3),
        backgroundColor: alpha(theme.palette.error.main, 0.05),
      },
      message: { padding: 0, fontWeight: 400 },
      icon: { opacity: 1 },
    },
  },

  // ==================== SWITCH ====================
  MuiSwitch: {
    styleOverrides: {
      root: { width: 44, height: 24, padding: 0, margin: 8 },
      switchBase: {
        padding: 2,
        "&.Mui-checked": {
          transform: "translateX(20px)",
          color: theme.palette.background.paper,
          "& + .MuiSwitch-track": {
            backgroundColor: theme.palette.secondary.main,
            opacity: 1,
            boxShadow: "none",
          },
        },
      },
      thumb: {
        width: 20,
        height: 20,
        boxShadow: theme.shadows[1],
        borderRadius: `${theme.shape.borderRadius}px`,
      },
      track: {
        borderRadius: `${theme.shape.borderRadius}px`,
        backgroundColor: theme.palette.divider,
        opacity: 1,
        border: "none",
      },
    },
  },

  // ==================== PROGRESS ====================
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: `${theme.shape.borderRadius}px`,
        height: 4,
        backgroundColor: theme.palette.divider,
        overflow: "hidden",
      },
      bar: {
        borderRadius: `${theme.shape.borderRadius}px`,
        backgroundImage: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.light})`,
        backgroundColor: "transparent",
      },
    },
  },

  // ==================== TABS ====================
  MuiTabs: {
    styleOverrides: {
      root: {
        minHeight: 44,
        borderBottom: `1px solid ${theme.palette.divider}`,
      },
      indicator: {
        height: 2,
        borderRadius: 0,
        backgroundColor: theme.palette.secondary.main,
      },
    },
  },

  MuiTab: {
    styleOverrides: {
      root: {
        minHeight: 44,
        textTransform: "none",
        fontWeight: 400,
        fontSize: "0.875rem",
        padding: "10px 16px",
        transition: "all 0.15s ease",
        "&.Mui-selected": {
          color: theme.palette.secondary.main,
          fontWeight: 400,
        },
        "&:hover": { backgroundColor: theme.palette.action.hover },
      },
    },
  },

  // ==================== BREADCRUMBS ====================
  MuiBreadcrumbs: {
    styleOverrides: {
      root: { fontSize: "0.875rem", color: theme.palette.text.secondary },
      separator: {
        marginLeft: 8,
        marginRight: 8,
        color: theme.palette.text.disabled,
      },
    },
  },

  // ==================== LINK ====================
  MuiLink: {
    styleOverrides: {
      root: {
        textDecoration: "underline",
        fontWeight: 400,
        fontSize: "0.875rem",
        textUnderlineOffset: "4px",
        textDecorationThickness: "1px",
        textDecorationColor: alpha(theme.palette.secondary.main, 0.3),
        transition: "all 0.15s ease",
        color: theme.palette.secondary.main,
        "&:hover": { textDecorationColor: theme.palette.secondary.main },
        "&:focus-visible": {
          outline: "none",
          boxShadow: `0 0 0 2px ${theme.palette.background.default}, 0 0 0 4px ${theme.palette.secondary.main}`,
          borderRadius: `${theme.shape.borderRadius}px`,
        },
      },
    },
  },

  // ==================== SKELETON ====================
  MuiSkeleton: {
    styleOverrides: {
      root: {
        borderRadius: `${theme.shape.borderRadius}px`,
        transform: "none",
        backgroundColor: theme.palette.divider,
      },
    },
  },

  // ==================== BACKDROP ====================
  MuiBackdrop: {
    styleOverrides: {
      root: {
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        backgroundColor: alpha(theme.palette.common.black, 0.5),
      },
    },
  },

  // ==================== CHECKBOX ====================
  MuiCheckbox: {
    styleOverrides: {
      root: {
        borderRadius: `${theme.shape.borderRadius}px`,
        padding: 9,
        color: theme.palette.text.secondary,
        "&:hover": { backgroundColor: theme.palette.action.hover },
        "&.Mui-checked": { color: theme.palette.secondary.main },
        "&:focus-visible": {
          outline: "none",
          boxShadow: `0 0 0 2px ${theme.palette.background.default}, 0 0 0 4px ${theme.palette.secondary.main}`,
        },
      },
    },
  },

  // ==================== RADIO ====================
  MuiRadio: {
    styleOverrides: {
      root: {
        padding: 9,
        color: theme.palette.text.secondary,
        "&:hover": { backgroundColor: theme.palette.action.hover },
        "&.Mui-checked": { color: theme.palette.secondary.main },
        "&:focus-visible": {
          outline: "none",
          boxShadow: `0 0 0 2px ${theme.palette.background.default}, 0 0 0 4px ${theme.palette.secondary.main}`,
        },
      },
    },
  },

  // ==================== POPOVER ====================
  MuiPopover: {
    styleOverrides: {
      paper: {
        borderRadius: `${theme.shape.borderRadius}px`,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[3],
      },
    },
  },

  // ==================== SNACKBAR ====================
  MuiSnackbar: {
    styleOverrides: {
      root: {
        "& .MuiAlert-root": {
          borderRadius: `${theme.shape.borderRadius}px`,
          boxShadow: theme.shadows[3],
          border: `1px solid ${theme.palette.divider}`,
        },
      },
    },
  },

  // ==================== ACCORDION ====================
  MuiAccordion: {
    styleOverrides: {
      root: {
        borderRadius: `${theme.shape.borderRadius}px`,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: "none",
        transition: "all 0.2s ease",
        "&:before": { display: "none" },
        "&.Mui-expanded": { margin: "8px 0", boxShadow: theme.shadows[1] },
      },
    },
  },

  MuiAccordionSummary: {
    styleOverrides: {
      root: {
        padding: "0 16px",
        minHeight: 48,
        borderRadius: `${theme.shape.borderRadius}px`,
        fontWeight: 400,
        "&.Mui-expanded": {
          minHeight: 48,
          borderBottom: `1px solid ${theme.palette.divider}`,
        },
      },
      content: { "&.Mui-expanded": { margin: "12px 0" } },
    },
  },

  MuiAccordionDetails: {
    styleOverrides: { root: { padding: "0 16px 16px" } },
  },

  // ==================== BOTTOM NAVIGATION ====================
  MuiBottomNavigation: {
    styleOverrides: {
      root: {
        borderRadius: 0,
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        borderTop: `1px solid ${theme.palette.divider}`,
        height: 64,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      },
    },
  },

  MuiBottomNavigationAction: {
    styleOverrides: {
      root: {
        transition: "all 0.15s ease",
        "&.Mui-selected": {
          color: theme.palette.secondary.main,
          fontWeight: 400,
        },
      },
    },
  },

  // ==================== TOGGLE BUTTON ====================
  MuiToggleButtonGroup: {
    styleOverrides: {
      root: {
        borderRadius: `${theme.shape.borderRadius}px`,
        border: `1px solid ${theme.palette.divider}`,
        padding: 4,
        backgroundColor: theme.palette.background.paper,
        gap: 3,
      },
    },
  },

  MuiToggleButton: {
    styleOverrides: {
      root: {
        borderRadius: `${theme.shape.borderRadius}px`,
        border: "none",
        padding: "6px 12px",
        textTransform: "none",
        fontWeight: 400,
        fontSize: "0.8125rem",
        color: theme.palette.text.secondary,
        transition: "all 0.15s ease",
        "&.Mui-selected": {
          backgroundColor: alpha(theme.palette.secondary.main, 0.12),
          boxShadow: "none",
          color: theme.palette.secondary.main,
        },
        "&:hover": { backgroundColor: theme.palette.action.hover },
      },
    },
  },

  // ==================== PAGINATION ====================
  MuiPagination: {
    styleOverrides: { ul: { gap: 4 } },
  },

  MuiPaginationItem: {
    styleOverrides: {
      root: {
        borderRadius: `${theme.shape.borderRadius}px`,
        fontWeight: 400,
        transition: "all 0.15s ease",
        "&.Mui-selected": {
          backgroundColor: alpha(theme.palette.secondary.main, 0.12),
          color: theme.palette.secondary.main,
          boxShadow: "none",
          border: `1px solid ${theme.palette.divider}`,
          "&:hover": {
            backgroundColor: alpha(theme.palette.secondary.main, 0.2),
          },
        },
      },
    },
  },

  // ==================== RATING ====================
  MuiRating: {
    styleOverrides: {
      iconFilled: { color: theme.palette.warning.main },
      iconHover: { color: theme.palette.warning.dark },
      iconEmpty: { color: theme.palette.divider },
    },
  },

  // ==================== SLIDER ====================
  MuiSlider: {
    styleOverrides: {
      root: { height: 4, padding: "13px 0" },
      thumb: {
        width: 16,
        height: 16,
        borderRadius: `${theme.shape.borderRadius}px`,
        boxShadow: theme.shadows[1],
        border: `2px solid ${theme.palette.secondary.main}`,
        backgroundColor: theme.palette.background.paper,
        "&:hover, &.Mui-focusVisible": { boxShadow: theme.shadows[2] },
      },
      track: {
        height: 4,
        borderRadius: `${theme.shape.borderRadius}px`,
        border: "none",
        backgroundColor: theme.palette.secondary.main,
      },
      rail: {
        height: 4,
        borderRadius: `${theme.shape.borderRadius}px`,
        backgroundColor: theme.palette.divider,
      },
      mark: {
        backgroundColor: theme.palette.text.disabled,
        height: 4,
        width: 4,
        borderRadius: `${theme.shape.borderRadius}px`,
      },
    },
  },

  // ==================== AUTOCOMPLETE ====================
  MuiAutocomplete: {
    styleOverrides: {
      paper: {
        borderRadius: `${theme.shape.borderRadius}px`,
        boxShadow: theme.shadows[3],
        border: `1px solid ${theme.palette.divider}`,
        marginTop: 4,
      },
      listbox: { padding: 4 },
      option: {
        borderRadius: `${theme.shape.borderRadius}px`,
        margin: "1px 0",
        fontSize: "0.875rem",
        fontWeight: 400,
        padding: "8px 12px",
        "&.Mui-focused": { backgroundColor: theme.palette.action.hover },
        '&[aria-selected="true"]': {
          backgroundColor: alpha(theme.palette.secondary.main, 0.12),
          color: theme.palette.secondary.main,
        },
      },
    },
  },

  // ==================== DATA GRID ====================
  MuiDataGrid: {
    styleOverrides: {
      root: {
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: `${theme.shape.borderRadius}px`,
        overflow: "hidden",
      },
      columnHeaders: {
        backgroundColor: alpha(theme.palette.action.hover, 0.5),
        borderBottom: `1px solid ${theme.palette.divider}`,
      },
      columnHeader: {
        fontWeight: 400,
        fontSize: "0.8125rem",
        color: theme.palette.text.secondary,
        textTransform: "none",
        letterSpacing: "0",
      },
      row: {
        transition: "background-color 0.15s ease",
        "&:hover": {
          backgroundColor: alpha(theme.palette.secondary.main, 0.04),
        },
      },
      cell: {
        borderBottom: `1px solid ${theme.palette.divider}`,
        fontSize: "0.875rem",
        fontWeight: 400,
      },
      footerContainer: {
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
      },
    },
  },

  // ==================== STEPPER ====================
  MuiStepper: {
    styleOverrides: { root: { padding: "16px 0" } },
  },

  MuiStepLabel: {
    styleOverrides: {
      label: {
        fontSize: "0.875rem",
        fontWeight: 400,
        "&.Mui-active": {
          fontWeight: 400,
          color: theme.palette.secondary.main,
        },
        "&.Mui-completed": {
          fontWeight: 400,
          color: theme.palette.text.secondary,
        },
      },
    },
  },

  // ==================== TIMELINE ====================
  MuiTimeline: {
    styleOverrides: { root: { padding: 0 } },
  },

  MuiTimelineDot: {
    styleOverrides: {
      root: {
        borderRadius: `${theme.shape.borderRadius}px`,
        boxShadow: "none",
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
      },
    },
  },

  MuiTimelineConnector: {
    styleOverrides: {
      root: { backgroundColor: theme.palette.divider, width: 1 },
    },
  },

  // ==================== MODAL ====================
  MuiModal: {
    styleOverrides: { root: { "& .MuiBox-root": { outline: "none" } } },
  },

  // ==================== SPEED DIAL ====================
  MuiSpeedDial: {
    styleOverrides: {
      fab: {
        borderRadius: `${theme.shape.borderRadius}px`,
        boxShadow: theme.shadows[2],
      },
    },
  },

  MuiSpeedDialAction: {
    styleOverrides: {
      fab: {
        borderRadius: `${theme.shape.borderRadius}px`,
        boxShadow: theme.shadows[1],
      },
    },
  },

  // ==================== AVATAR ====================
  MuiAvatar: {
    styleOverrides: {
      root: {
        fontSize: "0.875rem",
        fontWeight: 400,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: "none",
        borderRadius: `${theme.shape.borderRadius}px`,
      },
    },
  },
});

/**
 * @param {"light" | "dark"} mode
 * @returns {import("@mui/material/styles").Theme}
 */
const createAppTheme = (mode = "dark") => {
  const palette = Color[mode];
  const baseShadows = Color.shadows?.[mode];
  const shadows =
    Array.isArray(baseShadows) && baseShadows.length >= 9
      ? [...baseShadows, ...Array(16).fill("none")]
      : Array(25).fill("none");

  const theme = createTheme({
    palette: { mode, ...palette },
    shadows,
    spacing: Size.spacing,
    shape: { borderRadius: Size.shape.borderRadius },
    typography: Size.typography,
    breakpoints: Size.breakpoints,
    zIndex: Size.zIndex,
  });

  theme.components = componentsOverride(theme);
  return theme;
};

/**
 * @param {"light" | "dark"} mode
 * @returns {import("@mui/material/styles").Theme}
 */
export const getTheme = (mode = "dark") => createAppTheme(mode);
