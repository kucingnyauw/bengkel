import { pdf } from "@react-pdf/renderer";

/**
 * Normalize enum text from UPPER_CASE to Title Case
 * @param {string} text - Enum text to normalize
 * @returns {string} Normalized text
 */
export const normalizeEnumText = (text) => {
  if (!text) return "";

  return text
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Download blob as file
 * @param {Blob} blob - Blob data
 * @param {string} filename - File name
 */
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Download file from URL
 * @param {string} url - File URL
 * @param {string} filename - File name
 */
export const downloadFromUrl = async (url, filename) => {
  const response = await fetch(url);
  const blob = await response.blob();
  downloadBlob(blob, filename);
};

/**
 * Download PDF from React component
 * @param {Object} options - Options
 * @param {JSX.Element} options.component - React component to render as PDF
 * @param {string} options.fileName - File name
 */
export const downloadPdf = async ({ component, fileName }) => {
  const blob = await pdf(component).toBlob();
  downloadBlob(blob, fileName);
};

/**
 * Export data to CSV file
 * @param {Object} options - Options
 * @param {Object[]} options.data - Array of data objects
 * @param {string[]} options.headers - CSV headers
 * @param {Function} options.mapRow - Function to map row data
 * @param {string} [options.fileName="export.csv"] - File name
 */
export const exportToCsv = ({
  data = [],
  headers = [],
  mapRow,
  fileName = "export.csv",
}) => {
  if (!Array.isArray(data) || data.length === 0) return;
  if (typeof mapRow !== "function") {
    throw new Error("mapRow function is required");
  }

  const escape = (val) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = data.map((row) => mapRow(row).map(escape).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });

  downloadBlob(blob, fileName);
};

/**
 * Get avatar URL from UI Avatars service
 * @param {string} name - Full name
 * @param {Object} [options] - Options
 * @param {number} [options.size=128] - Avatar size
 * @returns {string} Avatar URL
 */
export const getAvatarUrl = (name, options = {}) => {
  if (!name) return "";

  const { size = 128 } = options;

  const nameParts = name.trim().split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

  const background = "1A1A1A";
  const color = "FAFAFA";

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    firstName
  )}+${encodeURIComponent(
    lastName
  )}&background=${background}&color=${color}&size=${size}`;
};

/**
 * Format relative time (e.g., "2 mnt", "1 jam", "3 hr", "Kemarin")
 * @param {string|Date} value - Date value
 * @param {Object} [options] - Options
 * @param {string} [options.fallback="-"] - Fallback text
 * @returns {string} Formatted relative time
 */
export const formatRelativeTime = (value, options = {}) => {
  const { fallback = "-" } = options;

  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 10) return "Baru saja";
  if (seconds < 60) return `${seconds}d`;
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}j`;
  if (days === 1) return "Kemarin";
  if (days < 7) return `${days}hr`;
  if (weeks < 4) return `${weeks}mg`;
  if (months < 12) return `${months}bl`;
  return formatDateShort(value);
};

/**
 * Format duration between two dates
 * @param {string|Date} startValue - Start date
 * @param {string|Date} endValue - End date
 * @param {Object} [options] - Options
 * @param {string} [options.fallback="-"] - Fallback text
 * @returns {string} Formatted duration
 */
export const formatDuration = (startValue, endValue, options = {}) => {
  const { fallback = "-" } = options;

  if (!startValue || !endValue) return fallback;

  const start = new Date(startValue);
  const end = new Date(endValue);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return fallback;

  const diff = end - start;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0 && minutes > 0) return `${hours}j ${minutes}m`;
  if (hours > 0) return `${hours}j`;
  if (minutes > 0) return `${minutes}m`;
  return "<1m";
};