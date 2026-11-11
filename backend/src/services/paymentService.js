import crypto from 'crypto';
import { getRazorpayInstance, isRazorpayConfigured } from '../config/razorpay.js';
import env from '../config/env.js';
import { Payment } from '../models/Payment.js';
import { Order } from '../models/Order.js';
import { Restaurant } from '../models/Restaurant.js';
import { Table } from '../models/Table.js';
import { MenuItem } from '../models/MenuItem.js';
import { RestaurantSettings } from '../models/RestaurantSettings.js';
import { GuestSession } from '../models/GuestSession.js';
import { FeatureFlags } from '../models/FeatureFlags.js';
import { getNextOrderNumber } from '../models/Counter.js';
import { generateReceiptSnapshot } from './orderService.js';
import { emitSyncEvent, emitToOrder, emitToRestaurant, emitToTable, emitToAdmin } from '../config/socket.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { createRestaurantNotification, createAdminNotification } from './notificationService.js';
import { getImageUrl } from '../utils/imageUtils.js';
import { resolveRestaurantTable } from '../utils/tableUtils.js';

/**
 * Constant helper for timing-safe string comparison
 */
const safeCompare = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * 1. Create Razorpay Payment Order
 * Supports both:
 *  - Existing active order (paying bill online via orderId)
 *  - PREPAY FLOW (diner paying upfront before order creation via items & restaurantSlug)
 */
export const createPaymentOrderService = async ({
  orderId,
  customerEmail = '',
  customerPhone = '',
  guestSessionId = '',
  // Prepay payload fields:
  restaurantId,
  restaurantSlug,
  tableId,
  tableNumber,
  tableIdentifier,
  guestId,
  deviceId,
  sessionId,
  customerName,
  items,
}) => {
  let order = null;
  let restaurant = null;
  let table = null;
  let grandTotal = 0;
  let amountInPaise = 0;
  let receiptIdentifier = '';
  let prepayPayload = null;

  if (orderId) {
    order = await Order.findById(orderId);
    if (!order || order.isDeleted) {
      const error = new Error('Order not found or has been cancelled.');
      error.statusCode = 404;
      throw error;
    }
    restaurant = await Restaurant.findById(order.restaurantId);
    if (!restaurant || restaurant.isDeleted) {
      const error = new Error('Restaurant not found or is currently suspended.');
      error.statusCode = 404;
      throw error;
    }
    grandTotal = order.grandTotal;
    amountInPaise = Math.max(100, Math.round(order.grandTotal * 100));
    receiptIdentifier = order.orderNumber;
  } else {
    // PREPAY FLOW (Order NOT created yet)
    if (!restaurantSlug) {
      const error = new Error('Restaurant slug is required for payment initialization');
      error.statusCode = 400;
      throw error;
    }
    if (!items || !items.length) {
      const error = new Error('Cart items are required for payment initialization');
      error.statusCode = 400;
      throw error;
    }

    restaurant = await Restaurant.findOne({ slug: restaurantSlug.toLowerCase() });
    if (!restaurant || restaurant.isDeleted) {
      const error = new Error('Restaurant not found or is currently suspended.');
      error.statusCode = 404;
      throw error;
    }

    // Operational status validation
    let settings = await RestaurantSettings.findOne({ restaurantId: restaurant._id }).lean();
    if (settings?.restaurantStatus === 'closed') {
      const error = new Error('Restaurant is currently closed and not accepting orders.');
      error.statusCode = 403;
      throw error;
    }
    if (settings?.restaurantStatus === 'pause_orders' || settings?.acceptOrders === false) {
      const error = new Error('Restaurant has temporarily paused taking orders.');
      error.statusCode = 403;
      throw error;
    }

    // Resolve Table with temporary diagnostic logging
    const rawTable = tableId || tableNumber || tableIdentifier;

    console.log('[Table Resolution Debug: Prepay Request]', {
      restaurantId: restaurant._id,
      tableId,
      tableNumber,
      tableIdentifier,
      incomingPayload: { restaurantSlug, guestId, itemsCount: items?.length },
    });

    if (!rawTable || String(rawTable).trim() === '' || String(rawTable).trim() === 'undefined' || String(rawTable).trim() === 'null') {
      const error = new Error('Invalid table information. Please scan QR code again.');
      error.statusCode = 400;
      throw error;
    }

    table = (await resolveRestaurantTable(restaurant._id, rawTable)) ||
      (tableNumber ? await resolveRestaurantTable(restaurant._id, tableNumber) : null) ||
      (tableIdentifier ? await resolveRestaurantTable(restaurant._id, tableIdentifier) : null);

    console.log('[Table Resolution Debug: Prepay Result]', {
      restaurantId: restaurant._id,
      rawTable,
      databaseLookupResult: table
        ? {
            _id: table._id,
            tableNumber: table.tableNumber,
            tableName: table.tableName,
            status: table.status,
            isActive: table.isActive,
          }
        : null,
    });

    if (!table) {
      const error = new Error('Invalid table information. Please scan QR code again.');
      error.statusCode = 404;
      throw error;
    }

    if (!table.isActive || table.status === 'disabled') {
      const error = new Error('This table is currently disabled for ordering.');
      error.statusCode = 403;
      throw error;
    }

    // Validate items against DB
    const itemIds = items.map((i) => i.menuItemId || i.itemId || i._id).filter(Boolean);
    const dbItems = await MenuItem.find({
      _id: { $in: itemIds },
      restaurantId: restaurant._id,
      isDeleted: { $ne: true },
    }).lean();

    const dbItemMap = new Map(dbItems.map((item) => [item._id.toString(), item]));
    const validatedNewItems = [];
    let maxPrepTime = settings?.estimatedPreparationTime || 15;
    let subtotal = 0;
    let totalDiscount = 0;

    for (const requestedItem of items) {
      const idKey = (requestedItem.menuItemId || requestedItem.itemId || '').toString();
      const dbItem = dbItemMap.get(idKey);
      if (!dbItem) {
        const error = new Error(`Item "${requestedItem.name || 'Dish'}" is no longer on the menu`);
        error.statusCode = 400;
        throw error;
      }
      if (dbItem.availability === 'out_of_stock') {
        const error = new Error(`"${dbItem.itemName}" is currently out of stock`);
        error.statusCode = 400;
        throw error;
      }

      const qty = Math.max(1, parseInt(requestedItem.quantity, 10) || 1);
      const originalPrice = Number(dbItem.price) || 0;
      const sellingPrice = Number(dbItem.sellingPrice) || originalPrice;

      if (dbItem.preparationTime && dbItem.preparationTime > maxPrepTime) {
        maxPrepTime = dbItem.preparationTime;
      }

      validatedNewItems.push({
        itemId: dbItem._id,
        menuItemId: dbItem._id,
        itemName: dbItem.itemName,
        name: dbItem.itemName,
        originalPrice,
        price: originalPrice,
        sellingPrice,
        quantity: qty,
        specialInstructions: requestedItem.specialInstructions?.trim() || '',
        image: getImageUrl(dbItem.image),
        foodType: dbItem.foodType || 'veg',
      });

      subtotal += originalPrice * qty;
      totalDiscount += (originalPrice - sellingPrice) * qty;
    }

    subtotal = Math.round(subtotal * 100) / 100;
    totalDiscount = Math.round(totalDiscount * 100) / 100;
    const taxableAmount = Math.max(0, subtotal - totalDiscount);

    const gstPercent = (settings?.gstEnabled !== false) ? (Number(settings?.gstPercentage) || 0) : 0;
    const tax = Math.round(taxableAmount * (gstPercent / 100) * 100) / 100;

    let serviceCharge = 0;
    if (settings?.serviceChargeEnabled) {
      if (settings.serviceChargeType === 'percentage') {
        serviceCharge = Math.round(taxableAmount * ((Number(settings.serviceChargeValue) || 0) / 100) * 100) / 100;
      } else {
        serviceCharge = Math.round((Number(settings.serviceChargeValue) || 0) * 100) / 100;
      }
    }

    grandTotal = Math.round((taxableAmount + tax + serviceCharge) * 100) / 100;
    amountInPaise = Math.max(100, Math.round(grandTotal * 100));
    receiptIdentifier = `prepay_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    prepayPayload = {
      restaurantId: restaurant._id,
      restaurantSlug,
      tableId: table._id,
      tableNumber: table.tableNumber,
      guestId: guestId || guestSessionId || '',
      deviceId: deviceId || '',
      sessionId: sessionId || '',
      customerName: customerName?.trim() || 'Guest',
      customerPhone: customerPhone?.trim() || '',
      items: validatedNewItems,
      subtotal,
      discount: totalDiscount,
      tax,
      serviceCharge,
      grandTotal,
      estimatedPrepTime: maxPrepTime,
    };
  }

  // Feature Flag Validation: Online payments are active unless explicitly disabled
  const flags = await FeatureFlags.findOne({ restaurantId: restaurant._id }).lean();
  const isOnlinePaymentDisabled =
    flags?.onlinePaymentsEnabled === false ||
    flags?.onlinePaymentEnabled === false ||
    restaurant.isDeleted === true;

  if (isOnlinePaymentDisabled) {
    const error = new Error('Online payments are currently disabled for this restaurant. Please pay via Cash/Counter.');
    error.statusCode = 403;
    throw error;
  }

  if (!isRazorpayConfigured()) {
    const error = new Error('Payment gateway is currently offline (credentials not configured in .env).');
    error.statusCode = 503;
    throw error;
  }

  console.log('[Razorpay Flow] Creating Razorpay Order with amount:', amountInPaise, 'currency: INR');
  const razorpay = getRazorpayInstance();

  // Call Razorpay API to create order
  let rzpOrder;
  try {
    rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptIdentifier,
      notes: {
        isPrepay: prepayPayload ? 'true' : 'false',
        orderId: order ? order._id.toString() : '',
        restaurantId: restaurant._id.toString(),
        orderNumber: order?.orderNumber || '',
        tableNumber: String(order ? order.tableNumber : table?.tableNumber || ''),
      },
    });
    console.log('[Razorpay Flow] Order Created Successfully:', rzpOrder.id);
  } catch (rzpErr) {
    console.error('[Razorpay Flow] Exception in razorpay.orders.create:', rzpErr);
    const error = new Error(rzpErr.error?.description || rzpErr.message || 'Razorpay order creation failed.');
    error.statusCode = rzpErr.statusCode || 500;
    throw error;
  }

  // Record or update Payment model in MongoDB
  const payment = new Payment({
    restaurantId: restaurant._id,
    orderId: order ? order._id : null,
    tableId: table ? table._id : (order ? order.tableId : null),
    guestSessionId: guestSessionId || guestId || (order ? order.guestId : '') || '',
    razorpayOrderId: rzpOrder.id,
    amount: grandTotal,
    currency: 'INR',
    status: 'created',
    email: customerEmail || (order ? order.customerEmail : '') || '',
    phone: customerPhone || (order ? order.customerPhone : '') || '',
    notes: rzpOrder.notes,
    metadata: {
      prepay: Boolean(prepayPayload),
      prepayOrderPayload: prepayPayload || undefined,
      razorpayOrder: rzpOrder,
      mode: env.RAZORPAY_MODE || 'test',
    },
    auditHistory: [
      {
        action: prepayPayload ? 'PREPAY_PAYMENT_ORDER_CREATED' : 'CREATE_ORDER',
        status: 'created',
        actor: 'customer',
        timestamp: new Date(),
        details: { razorpayOrderId: rzpOrder.id, amountInPaise },
      },
    ],
  });

  await payment.save();

  if (order) {
    emitSyncEvent({
      event: SOCKET_EVENTS.PAYMENT_CREATED,
      restaurantId: restaurant._id,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: order.grandTotal,
        razorpayOrderId: rzpOrder.id,
      },
    });
  }

  return {
    razorpayOrderId: rzpOrder.id,
    amount: grandTotal,
    amountInPaise,
    currency: 'INR',
    key: env.RAZORPAY_KEY_ID?.trim() || '',
    keyId: env.RAZORPAY_KEY_ID?.trim() || '',
    orderId: order?._id || null,
    orderNumber: order?.orderNumber || null,
    restaurantName: restaurant.restaurantName,
    description: order
      ? `Order #${order.orderNumber} - Table ${order.tableNumber}`
      : `Table ${table?.tableNumber || 1} Order — ${restaurant.restaurantName}`,
    prefill: {
      name: (order ? order.customerName : customerName) || 'Guest',
      email: customerEmail || '',
      contact: customerPhone || (order ? order.customerPhone : '') || '',
    },
  };
};

/**
 * Atomically creates a restaurant order from verified prepay payload.
 * Ensures strict idempotency: if an order is already created for this payment or razorpayOrderId,
 * returns the existing order immediately.
 */
export const createPrepaidOrderFromPayload = async (payment, razorpayPaymentId, razorpaySignature) => {
  if (!payment) return null;

  // 1. Idempotency Check: If already linked to an order, return existing order
  if (payment.orderId) {
    const existingOrder = await Order.findById(payment.orderId);
    if (existingOrder) {
      return existingOrder;
    }
  }

  // Double check if an order already exists with metadata.razorpayOrderId
  const existingOrderByRzp = await Order.findOne({
    $or: [
      { 'metadata.razorpayOrderId': payment.razorpayOrderId },
      { 'notes.razorpayOrderId': payment.razorpayOrderId },
    ],
  });
  if (existingOrderByRzp) {
    payment.orderId = existingOrderByRzp._id;
    payment.status = 'captured';
    if (razorpayPaymentId) payment.razorpayPaymentId = razorpayPaymentId;
    await payment.save();
    return existingOrderByRzp;
  }

  const prepayPayload = payment.metadata?.prepayOrderPayload;
  if (!prepayPayload) {
    const error = new Error('Prepay order specification payload is missing.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Generate unique sequential Order Number
  const orderNumber = await getNextOrderNumber(2027);

  // 3. Create the Order with status: 'placed', kitchenStatus: 'pending', cashierStatus: 'paid', paymentStatus: 'paid_online'
  const order = await Order.create({
    restaurantId: prepayPayload.restaurantId,
    tableId: prepayPayload.tableId,
    tableNumber: prepayPayload.tableNumber,
    guestId: prepayPayload.guestId,
    deviceId: prepayPayload.deviceId || '',
    sessionId: prepayPayload.sessionId || '',
    orderNumber,
    items: prepayPayload.items,
    subtotal: prepayPayload.subtotal,
    discount: prepayPayload.discount,
    tax: prepayPayload.tax,
    serviceCharge: prepayPayload.serviceCharge,
    grandTotal: prepayPayload.grandTotal,
    status: 'placed',
    statusHistory: [
      {
        status: 'placed',
        timestamp: new Date(),
        updatedBy: 'razorpay',
        note: `Prepaid online order confirmed via Razorpay (${razorpayPaymentId || payment.razorpayPaymentId || 'verified'})`,
      },
    ],
    kitchenStatus: 'pending',
    cashierStatus: 'paid',
    paymentStatus: 'paid_online',
    paymentMethod: 'online',
    customerName: prepayPayload.customerName?.trim() || 'Guest',
    customerPhone: prepayPayload.customerPhone?.trim() || '',
    estimatedPrepTime: prepayPayload.estimatedPrepTime || 15,
    createdBy: 'customer',
    updatedBy: 'customer',
    metadata: {
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId || payment.razorpayPaymentId,
      isPrepaid: true,
    },
    notes: {
      razorpayOrderId: payment.razorpayOrderId,
      prepaid: 'true',
    },
    isDeleted: false,
  });

  // 4. Update and link Payment record
  payment.orderId = order._id;
  payment.status = 'captured';
  if (razorpayPaymentId) {
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.paymentId = razorpayPaymentId;
  }
  if (razorpaySignature) {
    payment.razorpaySignature = razorpaySignature;
  }
  payment.capturedAt = new Date();
  payment.auditHistory.push({
    action: 'PREPAY_ORDER_CREATED',
    status: 'captured',
    actor: 'system',
    timestamp: new Date(),
    details: { orderId: order._id, orderNumber: order.orderNumber, razorpayOrderId: payment.razorpayOrderId },
  });
  await payment.save();

  // 5. Update Table to Occupied
  try {
    const table = await Table.findById(prepayPayload.tableId);
    if (table) {
      table.status = 'occupied';
      table.occupiedAt = new Date();
      table.currentOrderId = order._id;
      table.currentGuestSessionId = prepayPayload.guestId;
      await table.save();
      emitToTable(table._id, 'table-updated', {
        tableId: table._id,
        status: 'occupied',
        currentOrderId: order._id,
      });
    }
  } catch (tErr) {
    console.warn('[Prepay] Table occupancy update note:', tErr.message);
  }

  // 6. Update GuestSession
  try {
    await GuestSession.findOneAndUpdate(
      { guestId: prepayPayload.guestId },
      {
        $set: {
          deviceId: prepayPayload.deviceId || 'unknown_device',
          sessionId: prepayPayload.sessionId || 'session_default',
          customerName: prepayPayload.customerName?.trim() || 'Guest',
          customerPhone: prepayPayload.customerPhone?.trim() || '',
          activeOrder: order._id,
          lastActiveAt: new Date(),
        },
        $addToSet: { orders: order._id },
      },
      { upsert: true }
    );
  } catch (gErr) {
    console.warn('[Prepay] GuestSession update note:', gErr.message);
  }

  // 7. Generate Immutable Receipt Snapshot
  try {
    const receipt = await generateReceiptSnapshot(order._id);
    if (receipt) {
      payment.receiptId = receipt._id;
      await payment.save();
    }
  } catch (rErr) {
    console.warn('[Prepay] Receipt generation note:', rErr.message);
  }

  // 8. Instant Real-Time Socket Notifications to Kitchen & Restaurant Panel
  try {
    emitToRestaurant(order.restaurantId, 'new-order', order);
    emitToRestaurant(order.restaurantId, SOCKET_EVENTS.ORDER_CREATED, order);
    emitToRestaurant(order.restaurantId, 'order-updated', order);
    emitToOrder(order._id, 'order-updated', order);
    emitToTable(order.tableId, 'order-updated', order);
    emitToAdmin(SOCKET_EVENTS.ORDER_CREATED, order);
    emitSyncEvent({
      event: SOCKET_EVENTS.PAYMENT_SUCCESS,
      restaurantId: order.restaurantId,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: order.grandTotal,
        paymentId: razorpayPaymentId,
      },
    });
  } catch (sErr) {
    console.warn('[Prepay] Socket emission note:', sErr.message);
  }

  return order;
};

/**
 * 2. Verify Razorpay Payment Signature
 * Cryptographically verifies HMAC SHA-256 signature.
 * On success, completes order, marks cashier status paid, and generates receipt snapshot.
 */
export const verifyPaymentService = async ({
  orderId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    const error = new Error('Incomplete payment verification payload.');
    error.statusCode = 400;
    throw error;
  }

  const keySecret = env.RAZORPAY_KEY_SECRET?.trim();
  if (!keySecret) {
    const error = new Error('Razorpay secret key is not configured on the server.');
    error.statusCode = 500;
    throw error;
  }

  // Verify HMAC-SHA256 signature
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');

  const isValid = safeCompare(expectedSignature, razorpaySignature);
  if (!isValid) {
    // Record failed payment attempt
    await Payment.findOneAndUpdate(
      { razorpayOrderId },
      {
        $set: { status: 'failed', razorpayPaymentId, razorpaySignature },
        $push: {
          auditHistory: {
            action: 'VERIFY_FAILED',
            status: 'failed',
            actor: 'system',
            timestamp: new Date(),
            details: { reason: 'Invalid cryptographic signature' },
          },
        },
      }
    );

    const error = new Error('Invalid payment signature. Payment could not be verified.');
    error.statusCode = 400;
    throw error;
  }

  // Find payment and order
  const payment = await Payment.findOne({ razorpayOrderId });
  if (!payment) {
    const error = new Error('Payment record for this transaction was not found.');
    error.statusCode = 404;
    throw error;
  }

  let order = null;
  if (orderId) {
    order = await Order.findById(orderId);
  } else if (payment.orderId) {
    order = await Order.findById(payment.orderId);
  }

  // PREPAY FLOW: Order is created ONLY after payment signature is verified!
  if (!order && payment.metadata?.prepayOrderPayload) {
    order = await createPrepaidOrderFromPayload(payment, razorpayPaymentId, razorpaySignature);
    const receipt = payment.receiptId ? await generateReceiptSnapshot(order._id) : null;
    return {
      verified: true,
      message: 'Payment verified and order created successfully.',
      order,
      payment,
      receipt,
    };
  }

  if (!order) {
    const error = new Error('Order associated with this payment was not found.');
    error.statusCode = 404;
    throw error;
  }

  // Idempotency: If already paid, return existing state
  if (payment && payment.status === 'captured' && order.paymentStatus === 'paid_online') {
    const receipt = await generateReceiptSnapshot(order._id);
    return {
      verified: true,
      message: 'Payment was already verified and processed.',
      order,
      payment,
      receipt,
    };
  }

  // Fetch payment details from Razorpay to capture method/bank
  let method = 'online';
  let email = '';
  let phone = '';
  let bank = '';
  try {
    const razorpay = getRazorpayInstance();
    const rzpPayment = await razorpay.payments.fetch(razorpayPaymentId);
    if (rzpPayment) {
      method = rzpPayment.method || 'online';
      email = rzpPayment.email || '';
      phone = rzpPayment.contact || '';
      bank = rzpPayment.bank || rzpPayment.wallet || rzpPayment.vpa || '';
    }
  } catch (err) {
    console.warn('[Razorpay] Could not fetch payment metadata from gateway:', err.message);
  }

  // Update Payment Record
  if (payment) {
    payment.status = 'captured';
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.method = method;
    payment.email = email || payment.email;
    payment.phone = phone || payment.phone;
    payment.bank = bank || payment.bank;
    payment.auditHistory.push({
      action: 'PAYMENT_SUCCESS',
      status: 'captured',
      actor: 'razorpay_verification',
      timestamp: new Date(),
      details: { razorpayPaymentId, method, bank },
    });
    await payment.save();
  }

  // Update Order State
  order.paymentStatus = 'paid_online';
  order.paymentMethod = method || 'online';
  order.cashierStatus = 'paid';
  order.status = 'completed'; // Completes order and triggers receipt download eligibility
  order.statusHistory.push({
    status: 'completed',
    timestamp: new Date(),
    updatedBy: 'razorpay',
    note: `Online payment of INR ${order.grandTotal} captured (${razorpayPaymentId})`,
  });
  await order.save();

  // Generate Immutable Receipt Snapshot
  const receipt = await generateReceiptSnapshot(order._id);
  if (receipt && payment) {
    payment.receiptId = receipt._id;
    await payment.save();
  }

  // Socket Dispatches (Real-time sync to Restaurant, Admin, and Customer)
  emitSyncEvent({
    event: SOCKET_EVENTS.PAYMENT_SUCCESS,
    restaurantId: order.restaurantId,
    data: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: order.grandTotal,
      paymentMethod: method,
      razorpayPaymentId,
    },
  });

  emitSyncEvent({
    event: SOCKET_EVENTS.ORDER_PAID,
    restaurantId: order.restaurantId,
    data: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: order.grandTotal,
      tableNumber: order.tableNumber,
    },
  });

  emitSyncEvent({
    event: SOCKET_EVENTS.ORDER_UPDATED,
    restaurantId: order.restaurantId,
    data: {
      orderId: order._id,
      status: 'completed',
      paymentStatus: 'paid_online',
    },
  });

  if (receipt) {
    emitSyncEvent({
      event: SOCKET_EVENTS.RECEIPT_GENERATED,
      restaurantId: order.restaurantId,
      data: {
        orderId: order._id,
        receiptId: receipt._id,
        receiptNumber: receipt.receiptNumber,
      },
    });
  }

  emitToOrder(order._id.toString(), 'order-paid', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    paymentStatus: 'paid_online',
    receiptId: receipt?._id,
  });

  // Create In-App Notification
  await createRestaurantNotification({
    restaurantId: order.restaurantId,
    type: 'PAYMENT',
    title: `Payment Received: Order #${order.orderNumber}`,
    message: `Customer paid INR ${order.grandTotal} via ${method.toUpperCase()} (${razorpayPaymentId}).`,
    link: '/orders',
  });

  return {
    verified: true,
    message: 'Payment verified and captured successfully.',
    order,
    payment,
    receipt,
  };
};

/**
 * 3. Process Refund for a Payment
 */
export const refundPaymentService = async ({
  paymentId,
  amount,
  reason = 'Customer requested refund',
  actor = 'admin',
}) => {
  const payment = await Payment.findById(paymentId);
  if (!payment || payment.isDeleted) {
    const error = new Error('Payment record not found.');
    error.statusCode = 404;
    throw error;
  }

  if (payment.status !== 'captured') {
    const error = new Error(`Cannot refund payment in status "${payment.status}".`);
    error.statusCode = 400;
    throw error;
  }

  const refundAmount = amount ? Number(amount) : payment.amount;
  if (isNaN(refundAmount) || refundAmount <= 0 || refundAmount > payment.amount) {
    const error = new Error('Invalid refund amount.');
    error.statusCode = 400;
    throw error;
  }

  const razorpay = getRazorpayInstance();
  const rzpRefund = await razorpay.payments.refund(payment.razorpayPaymentId, {
    amount: Math.round(refundAmount * 100),
    notes: { reason, actor },
  });

  payment.status = 'refunded';
  payment.refundHistory.push({
    refundId: rzpRefund.id,
    amount: refundAmount,
    status: rzpRefund.status || 'processed',
    reason,
    createdAt: new Date(),
  });
  payment.auditHistory.push({
    action: 'REFUND_PROCESSED',
    status: 'refunded',
    actor,
    timestamp: new Date(),
    details: { refundId: rzpRefund.id, refundAmount, reason },
  });
  await payment.save();

  // Update associated Order
  const order = await Order.findById(payment.orderId);
  if (order) {
    order.paymentStatus = 'refunded';
    order.statusHistory.push({
      status: 'refunded',
      timestamp: new Date(),
      updatedBy: actor,
      note: `Refund of INR ${refundAmount} processed (${rzpRefund.id})`,
    });
    await order.save();
  }

  emitSyncEvent({
    event: SOCKET_EVENTS.PAYMENT_REFUNDED,
    restaurantId: payment.restaurantId,
    data: {
      paymentId: payment._id,
      orderId: payment.orderId,
      refundId: rzpRefund.id,
      amount: refundAmount,
    },
  });

  return {
    success: true,
    message: 'Refund processed successfully.',
    payment,
    refund: rzpRefund,
  };
};

import { processRazorpayWebhook } from './webhookService.js';

/**
 * 4. Verify and Handle Razorpay Webhooks
 */
export const handleRazorpayWebhookService = async ({ rawBody, signature, headers, startTime }) => {
  return processRazorpayWebhook({ rawBody, signature, headers, startTime });
};

/**
 * 5. Fetch Single Payment Record
 */
export const fetchPaymentService = async (paymentId) => {
  const payment = await Payment.findById(paymentId)
    .populate('restaurantId', 'restaurantName logo address phone')
    .populate('orderId')
    .populate('receiptId');

  if (!payment) {
    const error = new Error('Payment not found.');
    error.statusCode = 404;
    throw error;
  }

  return payment;
};

/**
 * 6. Fetch Admin Payments List with Analytics
 */
export const fetchAdminPaymentsService = async (query = {}) => {
  const { page = 1, limit = 20, status, search, restaurantId } = query;
  const filter = { isDeleted: false };

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (restaurantId) {
    filter.restaurantId = restaurantId;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [payments, total, statsAgg] = await Promise.all([
    Payment.find(filter)
      .populate('restaurantId', 'restaurantName slug')
      .populate('orderId', 'orderNumber tableNumber items grandTotal')
      .populate('receiptId', 'receiptNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),

    Payment.countDocuments(filter),

    Payment.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          capturedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'captured'] }, 1, 0] },
          },
          failedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
          },
          refundedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] },
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'captured'] }, '$amount', 0] },
          },
        },
      },
    ]),
  ]);

  const stats = statsAgg[0] || {
    totalPayments: 0,
    capturedPayments: 0,
    failedPayments: 0,
    refundedPayments: 0,
    totalRevenue: 0,
  };

  const successRate = stats.totalPayments > 0
    ? Math.round((stats.capturedPayments / stats.totalPayments) * 100)
    : 100;

  return {
    payments,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)) || 1,
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
    metrics: {
      totalPayments: stats.totalPayments,
      capturedPayments: stats.capturedPayments,
      failedPayments: stats.failedPayments,
      refundedPayments: stats.refundedPayments,
      totalRevenue: stats.totalRevenue,
      successRate,
    },
  };
};

