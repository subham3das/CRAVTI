export const ORDER_STATUS = Object.freeze({
  PLACED: 'placed',
  ACCEPTED: 'accepted',
  SERVED: 'served',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID_ONLINE: 'paid_online',
  PAID_CASH: 'paid_cash',
  REFUNDED: 'refunded',
});

export const TABLE_STATUS = Object.freeze({
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  DISABLED: 'disabled',
});

export const RESTAURANT_STATUS = Object.freeze({
  OPEN: 'open',
  BUSY: 'busy',
  PAUSE_ORDERS: 'pause_orders',
  CLOSED: 'closed',
});

export const USER_ROLES = Object.freeze({
  OWNER: 'owner',
  MANAGER: 'manager',
  STAFF: 'staff',
  CASHIER: 'cashier',
  KITCHEN: 'kitchen',
});

export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
});

export const ERROR_MESSAGES = Object.freeze({
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  RESTAURANT_NOT_FOUND: 'Restaurant not found.',
  RESTAURANT_CLOSED: 'Restaurant is currently closed and not accepting orders.',
  ORDERS_PAUSED: 'New orders are temporarily paused. Please check back shortly.',
  TABLE_NOT_FOUND: 'Table not found.',
  ORDER_NOT_FOUND: 'Order not found.',
  ORDER_LOCKED: 'Your previous order has already been served and is locked.',
  INVALID_INPUT: 'Invalid input data provided.',
  SERVER_ERROR: 'An unexpected internal server error occurred.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please slow down.',
});

