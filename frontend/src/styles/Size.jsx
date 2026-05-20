// Size.jsx - Ukuran & Tipografi
export const Size = {
  spacing: (factor) => `${0.25 * factor}rem`,

  shape: {
    borderRadius: 8,
  },

  typography: {
    fontFamily:
      '"Inter", "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontSize: "2.25rem",
      fontWeight: 700,
      lineHeight: 2.5,
      letterSpacing: "-0.025em",
    },
    h2: {
      fontSize: "1.875rem",
      fontWeight: 600,
      lineHeight: 2.25,
      letterSpacing: "-0.02em",
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 2,
      letterSpacing: "-0.015em",
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.75,
      letterSpacing: "-0.01em",
    },
    h5: {
      fontSize: "1.125rem",
      fontWeight: 600,
      lineHeight: 1.75,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: "0.9375rem",
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: "0.875rem",
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: "0.9375rem",
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "0.875rem",
      fontWeight: 400,
      lineHeight: 1.5,
    },
    button: {
      fontSize: "0.875rem",
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: "0",
      textTransform: "none",
    },
    caption: {
      fontSize: "0.75rem",
      lineHeight: 1,
      fontWeight: 400,
    },
    overline: {
      fontSize: "0.6875rem",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    lead: {
      fontSize: "1.125rem",
      fontWeight: 400,
      lineHeight: 1.75,
      color: "#64748B",
    },
    large: {
      fontSize: "1.125rem",
      fontWeight: 700,
      lineHeight: 1.75,
    },
    small: {
      fontSize: "0.8125rem",
      fontWeight: 500,
      lineHeight: 1.25,
    },
    muted: {
      fontSize: "0.875rem",
      fontWeight: 400,
      lineHeight: 1.5,
      color: "#64748B",
    },
  },

  breakpoints: {
    values: {
      xs: 0,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },

  zIndex: {
    mobileStepper: 1000,
    fab: 1050,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
};