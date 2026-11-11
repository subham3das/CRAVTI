/**
 * Safe String Utilities for Craviti
 * Guarantees that null, undefined, objects, numbers, and symbols never trigger
 * TypeError: s.trim is not a function or toLowerCase exceptions.
 */

export const safeString = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    // If an object with url property (e.g. image object), extract url
    if (value.url && typeof value.url === 'string') return value.url;
    return '';
  }
  return String(value);
};

export const safeTrim = (value) => {
  return safeString(value).trim();
};

export const safeLower = (value) => {
  return safeTrim(value).toLowerCase();
};

export const normalizeSearch = (value) => {
  return safeLower(value);
};

export default {
  safeString,
  safeTrim,
  safeLower,
  normalizeSearch,
};
