import { HTTP_STATUS } from '../constants/index.js';

/**
 * Standardized success response envelope (Phase 4.2 Standard)
 */
export const sendSuccess = (
  res,
  message = 'Operation successful',
  data = {},
  statusCode = HTTP_STATUS.OK,
  extra = {}
) => {
  const meta = extra.meta || (extra.pagination ? { pagination: extra.pagination } : undefined);
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
    timestamp: new Date().toISOString(),
    ...extra,
  });
};

/**
 * Standardized error response envelope
 */
export const sendError = (
  res,
  message = 'An error occurred',
  error = '',
  statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  details = null
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error || message,
    details,
    timestamp: new Date().toISOString(),
  });
};

