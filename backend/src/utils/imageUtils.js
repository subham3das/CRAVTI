/**
 * Shared Image Utilities for Craviti Backend
 * Ensures standard format { url: String, public_id: String } across models
 * and backward compatibility with legacy string URLs.
 */

/**
 * Normalizes any image representation (string, object, null, undefined)
 * into a standard subdocument: { url: String, public_id: String }
 */
export const normalizeImage = (image) => {
  if (!image) {
    return { url: '', public_id: '' };
  }
  if (typeof image === 'string') {
    return { url: image.trim(), public_id: '' };
  }
  if (typeof image === 'object') {
    const rawUrl = image.url !== undefined && image.url !== null ? image.url : '';
    const rawPid = image.public_id !== undefined && image.public_id !== null ? image.public_id : '';
    return {
      url: typeof rawUrl === 'string' ? rawUrl.trim() : String(rawUrl || '').trim(),
      public_id: typeof rawPid === 'string' ? rawPid.trim() : String(rawPid || '').trim(),
    };
  }
  return { url: '', public_id: '' };
};

/**
 * Extracts a safe string image URL from either a string or an object { url, public_id }
 */
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
  return placeholder;
};

export default {
  normalizeImage,
  getImageUrl,
};

