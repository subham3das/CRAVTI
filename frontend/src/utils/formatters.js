/**
 * Safe Number Formatter (Standard 3)
 * Guarantees NaN never reaches the UI.
 */
export const safeNumber = (val, fallback = 0) => {
  if (val === null || val === undefined || val === '') return fallback;
  const num = Number(val);
  return Number.isNaN(num) ? fallback : num;
};

/**
 * Currency Formatter (INR)
 */
export const formatCurrency = (amount) => {
  const safeVal = safeNumber(amount, 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(safeVal);
};

/**
 * Percentage Formatter
 */
export const formatPercentage = (val) => {
  const safeVal = safeNumber(val, 0);
  return `${safeVal.toFixed(safeVal % 1 === 0 ? 0 : 1)}%`;
};

/**
 * Safe Date Validator (Standard 4)
 * Returns valid Date object or null if invalid
 */
const getValidDate = (dateVal) => {
  if (!dateVal) return null;
  const date = new Date(dateVal);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Safe Date Formatter (Standard 4)
 * Returns '--' when date is invalid or missing.
 */
export const formatDate = (dateStr) => {
  const date = getValidDate(dateStr);
  if (!date) return '--';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Safe Time Formatter (Standard 4)
 * Returns '--' when date is invalid or missing.
 */
export const formatTime = (dateStr) => {
  const date = getValidDate(dateStr);
  if (!date) return '--';
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Safe Full DateTime Formatter (Standard 4)
 * Returns '--' when date is invalid or missing.
 */
export const formatDateTime = (dateStr) => {
  const date = getValidDate(dateStr);
  if (!date) return '--';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
