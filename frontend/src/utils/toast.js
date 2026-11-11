import rawToast from 'react-hot-toast';

/**
 * Standardized Toast Notification Utility (Issue 1 Compliance)
 * - SUCCESS: Green Check Circle (#16A34A)
 * - ERROR: Red Error Cross (#EF4444)
 * - WARNING: Amber Triangle (#F59E0B)
 * - INFO: Blue Circle (#3B82F6)
 */

export const toast = Object.assign(
  (message, opts) => rawToast(message, opts),
  rawToast,
  {
    success: (message, opts = {}) =>
      rawToast.success(message, {
        iconTheme: {
          primary: '#16A34A',
          secondary: '#FFFFFF',
        },
        ...opts,
      }),

    error: (message, opts = {}) =>
      rawToast.error(message, {
        iconTheme: {
          primary: '#EF4444',
          secondary: '#FFFFFF',
        },
        ...opts,
      }),

    warning: (message, opts = {}) =>
      rawToast(message, {
        icon: '⚠️',
        style: {
          border: '1px solid #FDE68A',
          background: '#FFFBEB',
          color: '#92400E',
          fontWeight: 500,
        },
        ...opts,
      }),

    warn: (message, opts = {}) => toast.warning(message, opts),

    info: (message, opts = {}) =>
      rawToast(message, {
        icon: 'ℹ️',
        style: {
          border: '1px solid #BFDBFE',
          background: '#EFF6FF',
          color: '#1E40AF',
          fontWeight: 500,
        },
        ...opts,
      }),
  }
);

export const showToast = toast;

export default toast;
