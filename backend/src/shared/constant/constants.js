export const TAX = 0.12;
export const MAX_API_RETRY = 2;
export const MAX_CACHE_TIME = 60 * 60 * 1000;

export const FILE_MIME = {
  IMAGE: ["image/jpeg", "image/png", "image/webp"],
  VIDEO: ["video/mp4", "video/mpeg", "video/quicktime"],
  DOCUMENT: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

export const MAX_FILE_SIZE = {
  IMAGE: 5 * 1024 * 1024,
  VIDEO: 50 * 1024 * 1024,
  DOCUMENT: 10 * 1024 * 1024,
};
export const MAX_SERVICE_CAPACITY = 10;
export const MAX_ACTIVE_SERVICE_ORDER = 30;
export const MAX_QUEUE_PER_MECHANIC = 5;
export const MAX_ORDER_ITEMS = 50;
export const MIN_ORDER_ITEMS = 1;
export const MAX_ITEM_QUANTITY = 999;
export const MIN_ITEM_QUANTITY = 1;
export const MAX_MECHANIC_ASSIGNMENTS = 10;
export const SPAREPART_LOW_STOCK_THRESHOLD = 5;
export const MAX_PAGE = 999;
export const MAX_LIMIT = 100;
export const DEFAULT_STARTING_CASH = 300000;