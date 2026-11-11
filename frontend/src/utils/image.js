/**
 * Safe Image Utility for Craviti Frontend
 * Safely extracts image URL from string, object { url, public_id }, or nested properties
 * and protects against TypeError on .trim() or missing URLs.
 */
import { safeString } from './string';

export const getImageUrl = (image, placeholder = '') => {
  if (!image) return placeholder;
  if (typeof image === 'string') {
    const trimmed = image.trim();
    return trimmed || placeholder;
  }
  if (typeof image === 'object') {
    if (image.url && typeof image.url === 'string') {
      const trimmed = image.url.trim();
      return trimmed || placeholder;
    }
  }
  const str = safeString(image).trim();
  return str || placeholder;
};

export default {
  getImageUrl,
};
