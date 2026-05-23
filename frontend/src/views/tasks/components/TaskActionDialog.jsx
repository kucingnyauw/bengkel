/**
 * TaskActionDialog - Dialog konfirmasi untuk memulai atau menyelesaikan tugas.
 *
 * @component
 * @param {Object} props - Props komponen
 * @param {Object} props.dialog - State dialog
 * @param {string} props.dialog.type - Tipe dialog ("start" atau "end")
 * @param {boolean} props.dialog.open - Status dialog terbuka
 * @param {Object} [props.dialog.task] - Data tugas
 * @param {boolean} props.isLoading - Status loading
 * @param {Function} props.onClose - Handler tutup dialog
 * @param {Function} props.onConfirm - Handler konfirmasi aksi
 *
 * @returns {JSX.Element} Dialog aksi tugas
 */
import { X } from "lucide-react";

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";

const TaskActionDialog = ({ dialog, isLoading, onClose, onConfirm }) => {
  const isStart = dialog.type === "start";

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      onClose={isLoading ? undefined : onClose}
      open={dialog.open}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {isStart ? "Mulai Tugas" : "Selesaikan Tugas"}
        <IconButton
          onClick={onClose}
          disabled={isLoading}
          size="small"
          sx={{ mr: -0.5 }}
        >
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {isStart
            ? "Apakah Anda yakin ingin memulai tugas ini?"
            : "Apakah Anda yakin ingin menyelesaikan tugas ini?"}
        </Typography>
      </DialogContent>

      <Divider />

      <DialogActions>
        <Button
          color="inherit"
          variant="outlined"
          disabled={isLoading}
          onClick={onClose}
        >
          Batal
        </Button>
        <Button
          variant="contained"
          disabled={isLoading}
          onClick={() => onConfirm(dialog.task)}
          startIcon={
            isLoading ? (
              <CircularProgress size={14} color="inherit" />
            ) : null
          }
        >
          {isLoading ? "Memproses..." : isStart ? "Mulai" : "Selesaikan"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskActionDialog;