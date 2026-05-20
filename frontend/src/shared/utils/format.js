export const formatToIdr = (value, options = {}) => {
  const {
    fallback = "Rp 0",
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  } = options;

  if (value === null || value === undefined) return fallback;

  const number = Number(value);

  if (Number.isNaN(number)) return fallback;

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(number);
};

export const formatDateTime = (value, options = {}) => {
  const {
    fallback = "-",
    locale = "id-ID",
    dateStyle = "medium",
    timeStyle = "short",
  } = options;

  if (!value) return fallback;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeStyle,
  }).format(date);
};

export const formatDate = (value, options = {}) => {
  const {
    fallback = "-",
    locale = "id-ID",
    dateStyle = "long",
  } = options;

  if (!value) return fallback;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(locale, {
    dateStyle,
  }).format(date);
};

export const formatTime = (value, options = {}) => {
  const {
    fallback = "-",
    locale = "id-ID",
    timeStyle = "short",
  } = options;

  if (!value) return fallback;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(locale, {
    timeStyle,
  }).format(date);
};

export const formatDateShort = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${dd}/${mm}/${yyyy}`;
};

export const formatDateTimeFull = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

export const formatRelativeTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;

  return formatDateShort(value);
};

export const formatDuration = (startValue, endValue) => {
  if (!startValue || !endValue) return "-";

  const start = new Date(startValue);
  const end = new Date(endValue);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "-";

  const diff = end - start;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours} jam ${minutes} menit`;
  return `${minutes} menit`;
};

export const parseCurrencyInput = (value) => {
  const numeric = value.replace(/[^\d]/g, "");
  return Number(numeric || 0);
};