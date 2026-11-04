import { HTTP_STATUS } from '../constants/index.js';

export const notFound = (req, res, next) => {
  const error = new Error(`Resource not found: ${req.originalUrl}`);
  res.status(HTTP_STATUS.NOT_FOUND);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? HTTP_STATUS.INTERNAL_SERVER_ERROR : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose Bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = HTTP_STATUS.NOT_FOUND;
    message = 'Resource not found';
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate field value entered: ${field}. Please use another value.`;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = Object.values(err.errors || {})
      .map((val) => val.message)
      .join(', ');
  }

  // Comprehensive Production Error Logging (Standard 8)
  const errorLog = {
    timestamp: new Date().toISOString(),
    route: req.originalUrl || req.url,
    method: req.method,
    restaurant: req.restaurantId || req.body?.restaurantId || null,
    user: req.user?._id || req.user?.id || null,
    guest: req.query?.guestId || req.body?.guestId || null,
    order: req.params?.orderId || req.params?.id || req.body?.orderId || null,
    statusCode,
    message,
    params: req.params,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
    stack: err.stack,
  };

  console.error('🔥 [Production Error Log]:', JSON.stringify(errorLog, null, 2));

  res.status(statusCode).json({
    success: false,
    message,
    error: err.name || 'Error',
    details: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
