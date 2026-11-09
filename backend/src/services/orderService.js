import mongoose from 'mongoose';
import { Restaurant } from '../models/Restaurant.js';
import { Table } from '../models/Table.js';
import { QRCodeModel } from '../models/QRCode.js';
import { Category } from '../models/Category.js';
import { MenuItem } from '../models/MenuItem.js';
import { Order } from '../models/Order.js';
import { GuestSession } from '../models/GuestSession.js';
import { RestaurantSettings } from '../models/RestaurantSettings.js';
import { Receipt } from '../models/Receipt.js';
import { getNextOrderNumber, getNextReceiptNumber } from '../models/Counter.js';
import { emitToRestaurant, emitToOrder, emitToTable, emitToAdmin } from '../config/socket.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { calculateSellingPrice } from '../utils/discountCalculator.js';

/**
 * Helper to release table status to 'available' if no other active orders exist on that table
 * Automatically resets occupancy tracking fields
 */
const checkAndFreeTable = async (tableId, excludeOrderId) => {
  if (!tableId) return;
  try {
    const activeOrders = await Order.countDocuments({
      tableId,
      _id: { $ne: excludeOrderId },
      isDeleted: false,
      status: { $in: ['placed', 'accepted', 'served'] },
    });

    if (activeOrders === 0) {
      await Table.findByIdAndUpdate(tableId, {
        status: 'available',
        vacatedAt: new Date(),
        currentOrderId: null,
        currentGuestSessionId: null,
      });
      emitToTable(tableId, 'table-updated', { tableId, status: 'available' });
    }
  } catch (err) {
    console.warn('checkAndFreeTable error:', err.message);
  }
};

/**
 * Generate an immutable Receipt Snapshot document upon order completion
 * The snapshot must NEVER change even if menu, GST, or restaurant changes later.
 */
export const generateReceiptSnapshot = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) return null;

    // Idempotent check
    const existing = await Receipt.findOne({ orderId: order._id });
    if (existing) return existing;

    const [restaurant, settings, table] = await Promise.all([
      Restaurant.findById(order.restaurantId).lean(),
      RestaurantSettings.findOne({ restaurantId: order.restaurantId }).lean(),
      Table.findById(order.tableId).lean(),
    ]);

    const receiptPrefix = settings?.receiptPrefix || 'CRV';
    const receiptNumber = await getNextReceiptNumber(receiptPrefix);

    const receipt = await Receipt.create({
      receiptNumber,
      orderNumber: order.orderNumber,
      orderId: order._id,
      restaurantId: order.restaurantId,
      restaurantSnapshot: {
        restaurantName: restaurant?.restaurantName || 'Restaurant',
        logo: restaurant?.logo?.url || '',
        phone: restaurant?.phone || restaurant?.ownerPhone || '',
        email: restaurant?.email || '',
        address: restaurant?.address || {},
        gstNumber: restaurant?.taxInfo?.gstNumber || restaurant?.gstNumber || '',
        fssaiNumber: restaurant?.taxInfo?.fssaiNumber || restaurant?.fssaiNumber || '',
        website: restaurant?.website || '',
      },
      tableSnapshot: {
        tableNumber: table?.tableNumber || order.tableNumber,
        tableName: table?.tableName || '',
        floor: table?.floor || 'Main Floor',
      },
      guestSnapshot: {
        customerName: order.customerName || 'Guest',
        customerPhone: order.customerPhone || '',
        customerId: order.customerId || order.guestId || '',
        guestId: order.guestId || '',
        deviceId: order.deviceId || '',
      },
      itemsSnapshot: (order.items || []).map((i) => ({
        itemId: i.itemId || i.menuItemId,
        itemName: i.itemName || i.name,
        originalPrice: i.originalPrice || i.price,
        sellingPrice: i.sellingPrice || i.price,
        quantity: i.quantity,
        foodType: i.foodType || 'veg',
        specialInstructions: i.specialInstructions || '',
      })),
      subtotal: order.subtotal,
      discount: order.discount || 0,
      gst: order.tax || 0,
      serviceCharge: order.serviceCharge || 0,
      grandTotal: order.grandTotal,
      paymentMethod: order.paymentMethod || 'cash',
      paymentStatus: order.paymentStatus || 'paid_cash',
      paidAt: order.paidAt || new Date(),
      completionTime: order.statusHistory?.find((s) => s.status === 'completed')?.timestamp || new Date(),
      receiptFooter: settings?.receiptFooter || 'Thank you for dining with us. Please visit again!',
    });

    try {
      emitToRestaurant(order.restaurantId, 'receipt-generated', receipt);
      emitToRestaurant(order.restaurantId, SOCKET_EVENTS.RECEIPT_GENERATED, receipt);
      emitToOrder(order._id, 'receipt-generated', receipt);
      emitToAdmin(SOCKET_EVENTS.RECEIPT_GENERATED, receipt);
    } catch (e) {
      console.warn('Socket emission non-fatal:', e.message);
    }

    return receipt;
  } catch (err) {
    console.error('generateReceiptSnapshot error:', err);
    return null;
  }
};

/**
 * Public Customer Menu + Active Session & Lock Status Detection
 */
export const getCustomerMenuService = async (restaurantSlug, tableIdentifier = '', guestId = '', deviceId = '', token = '') => {
  if (!restaurantSlug) {
    const error = new Error('Restaurant slug or ID is required');
    error.statusCode = 400;
    throw error;
  }

  const isObjectId = mongoose.Types.ObjectId.isValid(restaurantSlug);
  const restaurantQuery = {
    $or: [
      { slug: restaurantSlug.toLowerCase() },
      ...(isObjectId ? [{ _id: new mongoose.Types.ObjectId(restaurantSlug) }] : []),
    ],
    isDeleted: { $ne: true },
  };

  const restaurant = await Restaurant.findOne(restaurantQuery)
    .select('restaurantName slug logo coverImage description address timing paymentEnabled verificationStatus isActive')
    .lean();

  if (!restaurant) {
    const error = new Error('Restaurant not found');
    error.statusCode = 404;
    throw error;
  }

  if (restaurant.isActive === false || restaurant.verificationStatus === 'rejected') {
    const error = new Error('Restaurant unavailable');
    error.statusCode = 403;
    throw error;
  }

  // Fetch settings dynamically (Do NOT hardcode)
  let settings = await RestaurantSettings.findOne({ restaurantId: restaurant._id }).lean();
  if (!settings) {
    settings = {
      restaurantStatus: 'open',
      acceptOrders: true,
      gstEnabled: true,
      gstPercentage: 5,
      serviceChargeEnabled: false,
      serviceChargeType: 'percentage',
      serviceChargeValue: 0,
      estimatedPreparationTime: 15,
      autoLockServedOrder: true,
      payments: { cashEnabled: true, onlineEnabled: true },
    };
  }

  let table = null;
  if (tableIdentifier) {
    let tableQuery = { restaurantId: restaurant._id, isDeleted: { $ne: true } };
    const parsedNum = parseInt(tableIdentifier, 10);
    if (!isNaN(parsedNum)) {
      tableQuery.tableNumber = parsedNum;
    } else if (mongoose.Types.ObjectId.isValid(tableIdentifier)) {
      tableQuery._id = tableIdentifier;
    }

    table = await Table.findOne(tableQuery)
      .select('tableNumber tableName floor capacity status isActive qrUrl qrToken qrId occupiedAt currentOrderId')
      .lean();

    if (!table) {
      const error = new Error('Table not found');
      error.statusCode = 404;
      throw error;
    }

    if (table.isActive === false || table.status === 'disabled') {
      const error = new Error('Table is currently inactive or disabled for ordering');
      error.statusCode = 403;
      error.code = 'TABLE_DISABLED';
      throw error;
    }
  }

  // If table not found or not provided, fallback to first active table or default structure
  if (!table) {
    table = await Table.findOne({ restaurantId: restaurant._id, isActive: true, isDeleted: { $ne: true } })
      .sort({ tableNumber: 1 })
      .select('tableNumber tableName floor capacity status isActive qrUrl qrToken qrId occupiedAt currentOrderId')
      .lean();
  }

  if (!table) {
    table = {
      _id: new mongoose.Types.ObjectId(),
      tableNumber: 1,
      tableName: 'Dine-In',
      floor: 'Main Area',
      capacity: 4,
      status: 'available',
      isActive: true,
    };
  }

  // Track QR scan telemetry non-blockingly
  const qrRecord = await QRCodeModel.findOne({
    restaurantId: restaurant._id,
    tableId: table._id,
    isDeleted: false,
  });

  if (qrRecord) {
    QRCodeModel.findByIdAndUpdate(qrRecord._id, {
      $inc: { scansCount: 1 },
      lastScannedAt: new Date(),
    }).exec().catch(() => {});
  }

  // Live Categories & MenuItems with strict soft-delete and active checks
  const [categories, rawMenuItems] = await Promise.all([
    Category.find({
      restaurantId: restaurant._id,
      isActive: true,
      isDeleted: { $ne: true },
    })
      .sort({ displayOrder: 1, createdAt: 1 })
      .select('_id categoryName displayOrder isActive')
      .lean(),
    MenuItem.find({
      restaurantId: restaurant._id,
      isDeleted: { $ne: true },
    })
      .populate('categoryId', 'categoryName isActive isDeleted displayOrder')
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean(),
  ]);

  const activeCategoryIds = new Set(categories.map((c) => c._id.toString()));

  // Filter out orphaned items whose category was deleted or deactivated
  const menuItems = rawMenuItems
    .filter((item) => {
      if (item.isDeleted === true) return false;
      if (!item.categoryId) return false;

      const catObj = item.categoryId;
      const catIdStr = catObj?._id ? catObj._id.toString() : catObj.toString();

      // Must belong to an active, non-deleted category
      if (!activeCategoryIds.has(catIdStr)) return false;
      if (typeof catObj === 'object') {
        if (catObj.isActive === false || catObj.isDeleted === true) return false;
      }
      return true;
    })
    .map((item) => {
      const price = Number(item.price) || 0;
      const discountType = item.discountType || 'none';
      const discountValue = Number(item.discountValue) || 0;
      const calculatedSellingPrice = calculateSellingPrice(price, discountType, discountValue);

      return {
        ...item,
        price,
        discountType,
        discountValue,
        sellingPrice:
          item.sellingPrice !== undefined && Number(item.sellingPrice) > 0
            ? Number(item.sellingPrice)
            : calculatedSellingPrice,
        availability: item.availability || 'available',
      };
    });

  // Architectural Rule 1: ONE ACTIVE BILL PER TABLE
  // Check any active order on this dining table (whether customer scanned before or is joining table)
  const activeTableOrder = await Order.findOne({
    restaurantId: restaurant._id,
    tableId: table._id,
    status: { $in: ['placed', 'accepted', 'served'] },
    isDeleted: false,
  })
    .select('_id orderNumber status grandTotal subtotal discount tax serviceCharge items paymentStatus paymentMethod createdAt')
    .sort({ createdAt: -1 })
    .lean();

  let isOrderLocked = false;
  let lockReason = '';
  let waitingForPayment = false;

  if (activeTableOrder) {
    // If order has reached 'served' status, it becomes AUTOMATICALLY LOCKED
    if (activeTableOrder.status === 'served') {
      isOrderLocked = true;
      lockReason = 'Your previous order has already been served.';
      if (activeTableOrder.paymentStatus === 'pending') {
        waitingForPayment = true;
      }
    }
  }

  return {
    restaurant,
    table,
    categories,
    items: menuItems,
    menuItems,
    settings: {
      restaurantStatus: settings.restaurantStatus || 'open',
      acceptOrders: settings.acceptOrders !== false,
      estimatedPreparationTime: settings.estimatedPreparationTime || 15,
      gstEnabled: settings.gstEnabled !== false,
      gstPercentage: settings.gstPercentage !== undefined ? settings.gstPercentage : 5,
      serviceChargeEnabled: Boolean(settings.serviceChargeEnabled),
      serviceChargeType: settings.serviceChargeType || 'percentage',
      serviceChargeValue: settings.serviceChargeValue || 0,
      payments: settings.payments || { cashEnabled: true, onlineEnabled: true },
    },
    activeOrder: activeTableOrder
      ? {
          _id: activeTableOrder._id,
          orderNumber: activeTableOrder.orderNumber,
          status: activeTableOrder.status,
          grandTotal: activeTableOrder.grandTotal,
          subtotal: activeTableOrder.subtotal,
          tax: activeTableOrder.tax,
          serviceCharge: activeTableOrder.serviceCharge || 0,
          paymentStatus: activeTableOrder.paymentStatus,
          paymentMethod: activeTableOrder.paymentMethod,
          itemsCount: activeTableOrder.items?.length || 0,
          createdAt: activeTableOrder.createdAt,
        }
      : null,
    isOrderLocked,
    lockReason,
    waitingForPayment,
  };
};

/**
 * Check if a customer has an active order on a table
 */
export const getActiveCustomerOrderService = async ({ restaurantSlug, tableIdentifier, guestId, deviceId }) => {
  const restaurant = await Restaurant.findOne({ slug: restaurantSlug.toLowerCase() })
    .select('_id slug restaurantName')
    .lean();
  if (!restaurant) return null;

  let tableQuery = { restaurantId: restaurant._id, isDeleted: { $ne: true } };
  const parsedNum = parseInt(tableIdentifier, 10);
  if (!isNaN(parsedNum)) {
    tableQuery.tableNumber = parsedNum;
  } else if (mongoose.Types.ObjectId.isValid(tableIdentifier)) {
    tableQuery._id = tableIdentifier;
  } else {
    return null;
  }
  const table = await Table.findOne(tableQuery).select('_id tableNumber').lean();
  if (!table) return null;

  const query = {
    restaurantId: restaurant._id,
    tableId: table._id,
    status: { $in: ['placed', 'accepted', 'served'] },
    isDeleted: false,
  };

  const order = await Order.findOne(query)
    .populate('restaurantId', 'restaurantName slug logo address')
    .populate('tableId', 'tableNumber floor')
    .sort({ createdAt: -1 })
    .lean();

  return order;
};

/**
 * Place Order or Append to Existing Active Order (One Bill Per Table Session)
 * Prices, GST, and Service Charges are completely recalculated using RestaurantSettings
 */
export const placeOrderService = async (payload) => {
  const {
    restaurantSlug,
    tableIdentifier,
    deviceId = '',
    sessionId = '',
    customerName = 'Guest',
    customerPhone = '',
    paymentMethod = 'cash',
    items = [],
  } = payload;

  let { guestId } = payload;

  if (!items || !items.length) {
    const error = new Error('Your cart is empty');
    error.statusCode = 400;
    throw error;
  }

  // 1. Resolve Restaurant
  const restaurant = await Restaurant.findOne({ slug: restaurantSlug.toLowerCase() }).select('_id restaurantName slug');
  if (!restaurant) {
    const error = new Error('Restaurant not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Fetch RestaurantSettings for dynamic calculation
  let settings = await RestaurantSettings.findOne({ restaurantId: restaurant._id }).lean();
  if (!settings) {
    settings = {
      restaurantStatus: 'open',
      acceptOrders: true,
      gstEnabled: true,
      gstPercentage: 5,
      serviceChargeEnabled: false,
      serviceChargeType: 'percentage',
      serviceChargeValue: 0,
      estimatedPreparationTime: 15,
      autoCompleteOrder: true,
      autoLockServedOrder: true,
    };
  }

  // Operational status validation
  if (settings.restaurantStatus === 'closed') {
    const error = new Error('Restaurant is currently closed and not accepting orders.');
    error.statusCode = 403;
    error.code = 'RESTAURANT_CLOSED';
    throw error;
  }

  if (settings.restaurantStatus === 'pause_orders' || settings.acceptOrders === false) {
    const error = new Error('Restaurant has temporarily paused taking new orders. Active table orders are continuing.');
    error.statusCode = 403;
    error.code = 'ORDERS_PAUSED';
    throw error;
  }

  // 3. Resolve Table
  let tableQuery = { restaurantId: restaurant._id, isDeleted: { $ne: true } };
  const parsedNum = parseInt(tableIdentifier, 10);
  if (!isNaN(parsedNum)) {
    tableQuery.tableNumber = parsedNum;
  } else if (mongoose.Types.ObjectId.isValid(tableIdentifier)) {
    tableQuery._id = tableIdentifier;
  } else {
    const error = new Error('Invalid table identifier specified');
    error.statusCode = 400;
    throw error;
  }

  const table = await Table.findOne(tableQuery);
  if (!table) {
    const error = new Error('Table not found');
    error.statusCode = 404;
    throw error;
  }

  if (!table.isActive || table.status === 'disabled') {
    const error = new Error('This table is currently disabled for ordering');
    error.statusCode = 403;
    throw error;
  }

  // Check One Active Bill Per Table
  const existingActiveTableOrder = await Order.findOne({
    restaurantId: restaurant._id,
    tableId: table._id,
    status: { $in: ['placed', 'accepted', 'served'] },
    isDeleted: false,
  });

  // If table order has been served, it is permanently LOCKED
  if (existingActiveTableOrder && existingActiveTableOrder.status === 'served') {
    const error = new Error('Your previous order has already been served and is locked. Please settle the bill at the counter before starting a new order.');
    error.statusCode = 400;
    error.code = 'ORDER_LOCKED';
    throw error;
  }

  // 4. Guest Identity
  if (!guestId) {
    guestId = 'gst_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
  }

  // 5. Server recalculates prices & captures immutable snapshot
  const itemIds = items.map(i => i.menuItemId || i.itemId);
  const dbItems = await MenuItem.find({
    _id: { $in: itemIds },
    restaurantId: restaurant._id,
    isDeleted: { $ne: true },
  }).lean();

  const dbItemMap = new Map(dbItems.map(item => [item._id.toString(), item]));
  const validatedNewItems = [];
  let maxPrepTime = settings.estimatedPreparationTime || 15;

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
      image: dbItem.image?.url || '',
      foodType: dbItem.foodType || 'veg',
    });
  }

  // =========================================================================
  // CASE A: ONE ACTIVE BILL PER TABLE — REUSE ACTIVE ORDER
  // =========================================================================
  if (existingActiveTableOrder) {
    existingActiveTableOrder.items.push(...validatedNewItems);

    let fullSubtotal = 0;
    let fullDiscount = 0;
    for (const item of existingActiveTableOrder.items) {
      const orig = Number(item.originalPrice) || Number(item.sellingPrice) || 0;
      const sell = Number(item.sellingPrice) || orig;
      const qty = item.quantity || 1;
      fullSubtotal += orig * qty;
      fullDiscount += (orig - sell) * qty;
    }

    fullSubtotal = Math.round(fullSubtotal * 100) / 100;
    fullDiscount = Math.round(fullDiscount * 100) / 100;
    const taxableAmount = Math.max(0, fullSubtotal - fullDiscount);

    // Dynamic GST calculation from RestaurantSettings
    const gstPercent = (settings.gstEnabled !== false) ? (Number(settings.gstPercentage) || 0) : 0;
    const tax = Math.round(taxableAmount * (gstPercent / 100) * 100) / 100;

    // Dynamic Service Charge calculation from RestaurantSettings
    let serviceCharge = 0;
    if (settings.serviceChargeEnabled) {
      if (settings.serviceChargeType === 'percentage') {
        serviceCharge = Math.round(taxableAmount * ((Number(settings.serviceChargeValue) || 0) / 100) * 100) / 100;
      } else {
        serviceCharge = Math.round((Number(settings.serviceChargeValue) || 0) * 100) / 100;
      }
    }

    const grandTotal = Math.round((taxableAmount + tax + serviceCharge) * 100) / 100;

    existingActiveTableOrder.subtotal = fullSubtotal;
    existingActiveTableOrder.discount = fullDiscount;
    existingActiveTableOrder.tax = tax;
    existingActiveTableOrder.serviceCharge = serviceCharge;
    existingActiveTableOrder.grandTotal = grandTotal;
    existingActiveTableOrder.updatedBy = 'customer';

    existingActiveTableOrder.statusHistory.push({
      status: existingActiveTableOrder.status,
      timestamp: new Date(),
      updatedBy: 'customer',
      note: `Added ${validatedNewItems.length} more item(s) to table bill`,
    });

    await existingActiveTableOrder.save();

    try {
      emitToRestaurant(restaurant._id, 'order-updated', existingActiveTableOrder);
      emitToRestaurant(restaurant._id, SOCKET_EVENTS.ORDER_UPDATED, existingActiveTableOrder);
      emitToRestaurant(restaurant._id, 'new-order', existingActiveTableOrder);
      emitToOrder(existingActiveTableOrder._id, 'order-updated', existingActiveTableOrder);
      emitToTable(table._id, 'order-updated', existingActiveTableOrder);
      emitToAdmin(SOCKET_EVENTS.ORDER_UPDATED, existingActiveTableOrder);
    } catch (socketErr) {
      console.warn('Socket notification error:', socketErr.message);
    }

    return { order: existingActiveTableOrder, appended: true, guestId };
  }

  // =========================================================================
  // CASE B: CREATE NEW ORDER (Table becomes occupied automatically)
  // =========================================================================
  let subtotal = 0;
  let totalDiscount = 0;
  for (const item of validatedNewItems) {
    const orig = item.originalPrice;
    const sell = item.sellingPrice;
    const qty = item.quantity;
    subtotal += orig * qty;
    totalDiscount += (orig - sell) * qty;
  }

  subtotal = Math.round(subtotal * 100) / 100;
  totalDiscount = Math.round(totalDiscount * 100) / 100;
  const taxableAmount = Math.max(0, subtotal - totalDiscount);

  // Dynamic GST from RestaurantSettings
  const gstPercent = (settings.gstEnabled !== false) ? (Number(settings.gstPercentage) || 0) : 0;
  const tax = Math.round(taxableAmount * (gstPercent / 100) * 100) / 100;

  // Dynamic Service Charge from RestaurantSettings
  let serviceCharge = 0;
  if (settings.serviceChargeEnabled) {
    if (settings.serviceChargeType === 'percentage') {
      serviceCharge = Math.round(taxableAmount * ((Number(settings.serviceChargeValue) || 0) / 100) * 100) / 100;
    } else {
      serviceCharge = Math.round((Number(settings.serviceChargeValue) || 0) * 100) / 100;
    }
  }

  const grandTotal = Math.round((taxableAmount + tax + serviceCharge) * 100) / 100;

  const orderNumber = await getNextOrderNumber(2027);

  const isOnline = paymentMethod === 'online';
  const initialPaymentStatus = isOnline ? 'paid_online' : 'pending';

  const order = await Order.create({
    restaurantId: restaurant._id,
    tableId: table._id,
    tableNumber: table.tableNumber,
    guestId,
    deviceId: deviceId || '',
    sessionId: sessionId || '',
    orderNumber,
    items: validatedNewItems,
    subtotal,
    discount: totalDiscount,
    tax,
    serviceCharge,
    grandTotal,
    status: 'placed',
    statusHistory: [
      {
        status: 'placed',
        timestamp: new Date(),
        updatedBy: 'customer',
        note: `Order placed via QR scan on Table ${table.tableNumber}`,
      },
    ],
    kitchenStatus: 'pending',
    cashierStatus: isOnline ? 'paid' : 'unpaid',
    paymentStatus: initialPaymentStatus,
    paymentMethod: isOnline ? 'online' : 'cash',
    customerName: customerName?.trim() || 'Guest',
    customerPhone: customerPhone?.trim() || '',
    estimatedPrepTime: maxPrepTime,
    createdBy: 'customer',
    updatedBy: 'customer',
    isDeleted: false,
  });

  // GuestSession update
  try {
    await GuestSession.findOneAndUpdate(
      { guestId },
      {
        $set: {
          deviceId: deviceId || 'unknown_device',
          sessionId: sessionId || 'session_default',
          customerName: customerName?.trim() || 'Guest',
          customerPhone: customerPhone?.trim() || '',
          activeOrder: order._id,
          lastActiveAt: new Date(),
        },
        $addToSet: { orders: order._id },
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.warn('GuestSession update non-fatal:', err.message);
  }

  // Automatic Table Occupancy: Available -> Occupied
  table.status = 'occupied';
  table.occupiedAt = new Date();
  table.vacatedAt = null;
  table.currentOrderId = order._id;
  table.currentGuestSessionId = guestId;
  await table.save();
  emitToTable(table._id, 'table-updated', {
    tableId: table._id,
    status: 'occupied',
    currentOrderId: order._id,
  });

  try {
    emitToRestaurant(restaurant._id, 'new-order', order);
    emitToRestaurant(restaurant._id, SOCKET_EVENTS.ORDER_CREATED, order);
    emitToRestaurant(restaurant._id, 'order-updated', order);
    emitToOrder(order._id, 'order-updated', order);
    emitToTable(table._id, 'order-updated', order);
    emitToAdmin(SOCKET_EVENTS.ORDER_CREATED, order);
  } catch (socketErr) {
    console.warn('Socket notification error:', socketErr.message);
  }

  return { order, appended: false, guestId };
};

/**
 * Fetch Order by ObjectId or sequential orderNumber
 */
export const getOrderByIdService = async (orderId) => {
  if (!orderId) {
    const error = new Error('Order ID is required');
    error.statusCode = 400;
    throw error;
  }

  const query = mongoose.Types.ObjectId.isValid(orderId)
    ? { _id: orderId, isDeleted: false }
    : { orderNumber: orderId, isDeleted: false };

  const order = await Order.findOne(query)
    .populate('restaurantId', 'restaurantName logo slug address')
    .populate('tableId', 'tableNumber floor tableName')
    .lean();

  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  return order;
};

/**
 * Simplified Order Status Update
 * ONLY: placed -> accepted -> served -> completed (plus cancelled)
 * Automatic completion logic:
 * If newStatus === 'served' AND paymentStatus === 'paid_online' -> automatically completes!
 * Automatically creates immutable Receipt Snapshot upon completion!
 */
export const updateOrderStatusService = async (orderId, newStatus, updatedBy = 'restaurant', note = '') => {
  const allowed = ['placed', 'accepted', 'served', 'completed', 'cancelled'];
  if (!allowed.includes(newStatus)) {
    const error = new Error(`Invalid order status "${newStatus}". Must be placed, accepted, served, completed, or cancelled.`);
    error.statusCode = 400;
    throw error;
  }

  const query = mongoose.Types.ObjectId.isValid(orderId)
    ? { _id: orderId, isDeleted: false }
    : { orderNumber: orderId, isDeleted: false };

  const order = await Order.findOne(query);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  order.status = newStatus;
  order.updatedBy = updatedBy;

  order.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    updatedBy,
    note: note || `Status updated to ${newStatus}`,
  });

  // Load RestaurantSettings for automatic completion rule
  const settings = await RestaurantSettings.findOne({ restaurantId: order.restaurantId }).lean();
  const shouldAutoComplete = settings ? settings.autoCompleteOrder !== false : true;

  // 1. If status is served AND payment is paid_online -> auto complete!
  if (newStatus === 'served' && order.paymentStatus === 'paid_online' && shouldAutoComplete) {
    order.status = 'completed';
    order.statusHistory.push({
      status: 'completed',
      timestamp: new Date(),
      updatedBy: 'system',
      note: 'Order automatically completed upon serving (Paid Online)',
    });
  }

  // When order completes or is cancelled:
  // - Clear activeOrder from GuestSession
  // - Release table (automatic occupancy tracking)
  // - Generate immutable Receipt Snapshot if completed
  if (order.status === 'completed' || order.status === 'cancelled') {
    await GuestSession.updateMany({ activeOrder: order._id }, { $set: { activeOrder: null } });
    await checkAndFreeTable(order.tableId, order._id);

    if (order.status === 'completed') {
      await generateReceiptSnapshot(order._id);
    }
  }

  await order.save();

  try {
    emitToOrder(order._id, 'status-updated', order);
    emitToOrder(order._id, 'order-updated', order);
    emitToRestaurant(order.restaurantId, 'status-updated', order);
    emitToRestaurant(order.restaurantId, 'order-updated', order);
    emitToRestaurant(order.restaurantId, SOCKET_EVENTS.ORDER_UPDATED, order);
    emitToTable(order.tableId, 'order-updated', order);
    emitToAdmin(SOCKET_EVENTS.ORDER_UPDATED, order);
  } catch (socketErr) {
    console.warn('Socket emission error:', socketErr.message);
  }

  return order;
};

/**
 * Payment Status Update
 * Values: pending, paid_online, paid_cash, refunded
 * Automatic completion logic:
 * If order is in 'served' status and payment becomes 'paid_cash' -> automatically completes & creates immutable Receipt!
 */
export const updatePaymentStatusService = async (orderId, paymentStatus, paymentMethod = 'cash', updatedBy = 'cashier') => {
  const allowed = ['pending', 'paid_online', 'paid_cash', 'refunded'];
  if (!allowed.includes(paymentStatus)) {
    const error = new Error(`Invalid payment status "${paymentStatus}"`);
    error.statusCode = 400;
    throw error;
  }

  const query = mongoose.Types.ObjectId.isValid(orderId)
    ? { _id: orderId, isDeleted: false }
    : { orderNumber: orderId, isDeleted: false };

  const order = await Order.findOne(query);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  order.paymentStatus = paymentStatus;
  order.paymentMethod = paymentMethod;
  order.cashierStatus = ['paid_online', 'paid_cash'].includes(paymentStatus) ? 'paid' : 'unpaid';
  order.updatedBy = updatedBy;

  order.statusHistory.push({
    status: order.status,
    timestamp: new Date(),
    updatedBy,
    note: `Payment marked ${paymentStatus} via ${paymentMethod}`,
  });

  // 2. If status is served AND payment becomes paid_cash -> auto complete & generate receipt!
  if (order.status === 'served' && ['paid_cash', 'paid_online'].includes(paymentStatus)) {
    order.status = 'completed';
    order.statusHistory.push({
      status: 'completed',
      timestamp: new Date(),
      updatedBy: 'system',
      note: 'Order automatically completed upon payment collection',
    });

    await GuestSession.updateMany({ activeOrder: order._id }, { $set: { activeOrder: null } });
    await checkAndFreeTable(order.tableId, order._id);
    await generateReceiptSnapshot(order._id);
  }

  await order.save();

  try {
    emitToOrder(order._id, 'payment-updated', order);
    emitToOrder(order._id, 'status-updated', order);
    emitToOrder(order._id, 'order-updated', order);
    emitToRestaurant(order.restaurantId, 'payment-updated', order);
    emitToRestaurant(order.restaurantId, 'status-updated', order);
    emitToRestaurant(order.restaurantId, 'order-updated', order);
    emitToRestaurant(order.restaurantId, SOCKET_EVENTS.ORDER_UPDATED, order);
    emitToTable(order.tableId, 'order-updated', order);
    emitToAdmin(SOCKET_EVENTS.ORDER_UPDATED, order);
  } catch (socketErr) {
    console.warn('Socket emission error:', socketErr.message);
  }

  return order;
};

/**
 * Fetch Live Active Orders for Restaurant
 */
export const getLiveOrdersService = async (restaurantId, query = {}) => {
  const { tableId, search = '', sort = 'newest', status } = query;

  const filter = {
    restaurantId,
    isDeleted: false,
    status: status ? status : { $in: ['placed', 'accepted', 'served'] },
  };

  if (tableId) {
    filter.tableId = tableId;
  }

  if (query.paymentStatus) {
    filter.paymentStatus = query.paymentStatus;
  }

  if (search) {
    const s = search.trim();
    filter.$or = [
      { orderNumber: { $regex: s, $options: 'i' } },
      { customerName: { $regex: s, $options: 'i' } },
    ];
    const num = parseInt(s, 10);
    if (!isNaN(num)) {
      filter.$or.push({ tableNumber: num });
    }
  }

  let sortCriteria = { createdAt: -1 };
  if (sort === 'oldest') {
    sortCriteria = { createdAt: 1 };
  } else if (sort === 'highest_value') {
    sortCriteria = { grandTotal: -1 };
  }

  const orders = await Order.find(filter)
    .populate('tableId', 'tableNumber floor tableName')
    .sort(sortCriteria)
    .lean();

  return orders;
};

/**
 * Fetch Historical Orders (Completed / Cancelled)
 */
export const getHistoricalOrdersService = async (restaurantId, query = {}) => {
  const {
    page = 1,
    limit = 20,
    status = 'completed',
    paymentStatus,
    search = '',
    sort = 'newest',
  } = query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const filter = {
    restaurantId,
    isDeleted: false,
    status: status || 'completed',
  };

  if (paymentStatus) {
    filter.paymentStatus = paymentStatus;
  }

  if (search) {
    const s = search.trim();
    filter.$or = [
      { orderNumber: { $regex: s, $options: 'i' } },
      { customerName: { $regex: s, $options: 'i' } },
    ];
    const num = parseInt(s, 10);
    if (!isNaN(num)) {
      filter.$or.push({ tableNumber: num });
    }
  }

  let sortCriteria = { createdAt: -1 };
  if (sort === 'oldest') {
    sortCriteria = { createdAt: 1 };
  } else if (sort === 'highest_value') {
    sortCriteria = { grandTotal: -1 };
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('tableId', 'tableNumber floor tableName')
      .sort(sortCriteria)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

/**
 * Live Operational Metrics for Dashboard
 */
export const getOrderMetricsService = async (restaurantId) => {
  const [liveOrders, served, pendingCash, allPrepTimes] = await Promise.all([
    Order.countDocuments({
      restaurantId,
      isDeleted: false,
      status: { $in: ['placed', 'accepted', 'served'] },
    }),
    Order.countDocuments({
      restaurantId,
      isDeleted: false,
      status: 'served',
    }),
    Order.countDocuments({
      restaurantId,
      isDeleted: false,
      status: { $in: ['placed', 'accepted', 'served'] },
      paymentStatus: 'pending',
    }),
    Order.find({ restaurantId, isDeleted: false })
      .select('estimatedPrepTime')
      .limit(50)
      .lean(),
  ]);

  const avgPrepTime = allPrepTimes.length
    ? Math.round(allPrepTimes.reduce((acc, curr) => acc + (curr.estimatedPrepTime || 15), 0) / allPrepTimes.length)
    : 15;

  return {
    liveOrders,
    served,
    pendingCash,
    avgPreparationTime: avgPrepTime,
  };
};

/**
 * Soft Delete Order
 */
export const softDeleteOrderService = async (orderId, restaurantId, userId) => {
  const query = mongoose.Types.ObjectId.isValid(orderId)
    ? { _id: orderId, restaurantId }
    : { orderNumber: orderId, restaurantId };

  const order = await Order.findOne(query);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  order.isDeleted = true;
  order.deletedAt = new Date();
  order.deletedBy = userId;
  await order.save();

  await GuestSession.updateMany({ activeOrder: order._id }, { $set: { activeOrder: null } });
  await checkAndFreeTable(order.tableId, order._id);

  emitToRestaurant(restaurantId, 'order-updated', { orderId: order._id, isDeleted: true });
  return { message: 'Order removed' };
};
