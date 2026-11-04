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

