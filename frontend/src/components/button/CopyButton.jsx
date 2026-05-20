/**
 * CopyButton - Button component that copies text to clipboard with snackbar notification.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.text - Text to copy to clipboard
 * @param {string} [props.successMessage="Berhasil disalin"] - Success snackbar message
 * @param {string} [props.size="small"] - Button size
 * @param {Object} [props.sx] - Additional styles
 *
 * @returns {JSX.Element} Rendered copy button
 *
 * @example
 * // Basic usage
 * <CopyButton text="ORD-20260509-2AD3" />
 *
 * // With custom message
 * <CopyButton text="08123456789" successMessage="Nomor telepon berhasil disalin" />
 */
import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { IconButton, Tooltip, Snackbar, Alert, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

const CopyButton = ({ 
  text, 
  successMessage = "Berhasil disalin", 
  size = "small",
  sx = {} 
}) => {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  /**
   * Handle copy to clipboard
   * @type {Function}
   */
  const handleCopy = useCallback(async () => {
    if (!text) return;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setSnackbarOpen(true);
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      
      setCopied(true);
      setSnackbarOpen(true);
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }, [text]);

  /**
   * Handle close snackbar
   * @type {Function}
   */
  const handleCloseSnackbar = useCallback(() => {
    setSnackbarOpen(false);
  }, []);

  return (
    <>
      <Tooltip title={copied ? "Tersalin!" : "Salin"}>
        <IconButton
          onClick={handleCopy}
          size={size}
          sx={{
            border: "1px solid",
            borderColor: copied 
              ? alpha(theme.palette.success.main, 0.4) 
              : alpha(theme.palette.divider, 0.8),
            color: copied 
              ? theme.palette.success.main 
              : theme.palette.text.secondary,
            bgcolor: copied 
              ? alpha(theme.palette.success.main, 0.06) 
              : "transparent",
            transition: theme.transitions.create(["all"], {
              duration: theme.transitions.duration.shorter,
            }),
            "&:hover": {
              bgcolor: copied 
                ? alpha(theme.palette.success.main, 0.12) 
                : alpha(theme.palette.text.primary, 0.06),
              borderColor: copied 
                ? theme.palette.success.main 
                : theme.palette.text.primary,
              color: copied 
                ? theme.palette.success.main 
                : theme.palette.text.primary,
            },
            ...sx,
          }}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </IconButton>
      </Tooltip>

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
            border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: "blur(8px)",
            boxShadow: theme.shadows[3],
            alignItems: "center",
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CopyButton;