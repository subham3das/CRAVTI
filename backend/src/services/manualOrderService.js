import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { MenuItem } from '../models/MenuItem.js';
import { Table } from '../models/Table.js';
import { Restaurant } from '../models/Restaurant.js';
import { RestaurantSettings } from '../models/RestaurantSettings.js';
import { Payment } from '../models/Payment.js';
import { Receipt } from '../models/Receipt.js';
import { getNextOrderNumber } from '../models/Counter.js';
import { generateReceiptSnapshot } from './orderService.js';
import { emitToRestaurant, emitToOrder, emitToTable, emitToAdmin } from '../config/socket.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { getImageUrl } from '../utils/imageUtils.js';

export const sanitizeManualOrder = (order) => {
  if (!order) return order;
  const o = typeof order.toObject === 'function' ? order.toObject() : { ...order };
  return {
    ...o,
    customerName: o.customerName ?? '',
    customerPhone: o.customerPhone ?? '',
    tableName: o.tableName ?? (o.billType === 'walk_in' ? 'Walk-in' : (o.tableNumber ? `Table ${o.tableNumber}` : '')),
    tableNumber: o.tableNumber ?? (o.billType === 'walk_in' ? 'Walk-in' : ''),
    status: (o.status ?? 'draft').toString(),
    paymentStatus: (o.paymentStatus ?? 'pending').toString(),
    paymentMethod: (o.paymentMethod ?? 'none').toString(),
    orderSource: (o.orderSource ?? 'MANUAL').toString(),
    orderNumber: (o.orderNumber ?? '').toString(),
    billNumber: (o.billNumber ?? o.orderNumber ?? '').toString(),
  };
};

/**
 * Helper to compute tax and charges reusing restaurant settings
 */
const calculateManualBillTotals = (items, billDiscount = {}, settings = {}) => {
  let subtotal = 0;
  let itemDiscountsTotal = 0;

  const validatedItems = items.map((item) => {
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    const originalPrice = Number(item.originalPrice || item.price || item.sellingPrice || 0);
    const sellingPrice = Number(item.sellingPrice || item.price || originalPrice);
    const itemDiscount = Math.max(0, (originalPrice - sellingPrice) * qty);

    subtotal += originalPrice * qty;
    itemDiscountsTotal += itemDiscount;

    return {
      itemId: item.itemId || item.menuItemId,
      menuItemId: item.menuItemId || item.itemId,
      itemName: item.itemName || item.name || 'Dish',
      name: item.itemName || item.name || 'Dish',
      originalPrice,
      price: originalPrice,
      sellingPrice,
      quantity: qty,
      specialInstructions: item.notes || item.specialInstructions || '',
      foodType: item.foodType || 'veg',
      image: getImageUrl(item.image),
    };
  });

  subtotal = Math.round(subtotal * 100) / 100;
  itemDiscountsTotal = Math.round(itemDiscountsTotal * 100) / 100;

  // Calculate Bill-Level Discount (Flat or Percentage)
  let billDiscountAmount = 0;
  if (billDiscount && billDiscount.type !== 'none') {
    const val = Number(billDiscount.value) || 0;
    if (billDiscount.type === 'percentage') {
      billDiscountAmount = Math.round((subtotal * (Math.min(100, Math.max(0, val)) / 100)) * 100) / 100;
    } else if (billDiscount.type === 'flat') {
      billDiscountAmount = Math.min(subtotal, Math.max(0, val));
    }
  }

  const totalDiscount = Math.round((itemDiscountsTotal + billDiscountAmount) * 100) / 100;
  const taxableAmount = Math.max(0, subtotal - totalDiscount);

  // Reusable GST from Restaurant Settings
  const gstPercent = settings?.gstEnabled !== false ? (Number(settings?.gstPercentage) || 0) : 0;
  const tax = Math.round(taxableAmount * (gstPercent / 100) * 100) / 100;

  // Service Charge from Settings
  let serviceCharge = 0;
  if (settings?.serviceChargeEnabled) {
    if (settings.serviceChargeType === 'percentage') {
      serviceCharge = Math.round(taxableAmount * ((Number(settings.serviceChargeValue) || 0) / 100) * 100) / 100;
    } else {
      serviceCharge = Math.round((Number(settings.serviceChargeValue) || 0) * 100) / 100;
    }
  }

  // Packaging and Delivery Charges
  const packagingCharge = Math.max(0, Number(settings?.packagingCharge) || 0);

  const grandTotal = Math.round((taxableAmount + tax + serviceCharge + packagingCharge) * 100) / 100;

  return {
    validatedItems,
    subtotal,
    itemDiscountsTotal,
    billDiscountAmount,
    totalDiscount,
    taxableAmount,
    gstPercent,
    tax,
    serviceCharge,
    packagingCharge,
    grandTotal,
  };
};

/**
 * 1. Create a New Manual POS-style Bill
 * Supports 'save_draft', 'generate', and 'mark_paid'
 */
export const createManualOrderService = async ({ restaurantId, user, payload = {} }) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);

  const [restaurant, settings] = await Promise.all([
    Restaurant.findById(restId),
    RestaurantSettings.findOne({ restaurantId: restId }).lean(),
  ]);

  if (!restaurant || restaurant.isDeleted) {
    const error = new Error('Restaurant not found or inactive.');
    error.statusCode = 404;
    throw error;
  }

  const {
    billType = 'walk_in', // 'walk_in' | 'table'
    tableId = null,
    tableNumber = '',
    customerName = 'Walk-in Customer',
    customerPhone = '',
    items = [],
    billDiscount = { type: 'none', value: 0, amount: 0 },
    paymentMethod = 'none', // 'cash' | 'upi' | 'card' | 'split' | 'none'
    splitPayments = [],
    action = 'generate', // 'save_draft' | 'generate' | 'mark_paid'
    sendToKitchen = false,
    notes = '',
  } = payload;

  if (action !== 'save_draft' && (!Array.isArray(items) || items.length === 0)) {
    const error = new Error('Cannot generate or pay a bill with zero items.');
    error.statusCode = 400;
    throw error;
  }

  // Resolve and validate Table if billType is 'table'
  let resolvedTable = null;
  if (billType === 'table' && tableId) {
    resolvedTable = await Table.findOne({ _id: tableId, restaurantId: restId, isDeleted: { $ne: true } });
    if (!resolvedTable) {
      const error = new Error('Assigned table was not found.');
      error.statusCode = 404;
      throw error;
    }
  }

  // Validate items against DB MenuItems
  const itemIds = (items || []).map((i) => i.itemId || i.menuItemId).filter(Boolean);
  const dbItems = await MenuItem.find({
    _id: { $in: itemIds },
    restaurantId: restId,
    isDeleted: { $ne: true },
  }).lean();

  const dbItemMap = new Map(dbItems.map((i) => [i._id.toString(), i]));
  const hydratedItems = (items || []).map((reqItem) => {
    const idKey = (reqItem.itemId || reqItem.menuItemId || '').toString();
    const dbItem = dbItemMap.get(idKey);
    const originalPrice = Number(dbItem?.price || reqItem.originalPrice || reqItem.price || 0);
    const sellingPrice = Number(reqItem.sellingPrice || dbItem?.sellingPrice || originalPrice);

    return {
      itemId: dbItem?._id || reqItem.itemId || reqItem.menuItemId,
      menuItemId: dbItem?._id || reqItem.menuItemId || reqItem.itemId,
      itemName: dbItem?.itemName || reqItem.itemName || reqItem.name || 'Dish',
      name: dbItem?.itemName || reqItem.itemName || reqItem.name || 'Dish',
      originalPrice,
      price: originalPrice,
      sellingPrice,
      quantity: Math.max(1, parseInt(reqItem.quantity, 10) || 1),
      notes: reqItem.notes || reqItem.specialInstructions || '',
      specialInstructions: reqItem.notes || reqItem.specialInstructions || '',
      foodType: dbItem?.foodType || reqItem.foodType || 'veg',
      image: dbItem?.image?.url || reqItem.image || '',
    };
  });

  const totals = calculateManualBillTotals(hydratedItems, billDiscount, settings);

  // Generate unique sequential Order Number
  const orderNumber = await getNextOrderNumber(2027);

  // Determine initial status based on action
  let status = 'generated';
  let paymentStatus = 'pending';
  let cashierStatus = 'unpaid';

  if (action === 'save_draft') {
    status = 'draft';
  } else if (action === 'mark_paid') {
    status = 'completed';
    paymentStatus = paymentMethod === 'cash' ? 'paid_cash' : 'paid_online';
    cashierStatus = 'paid';
  }

  // Create Order record (strictly isolated with orderSource: 'MANUAL')
  const order = await Order.create({
    restaurantId: restId,
    orderSource: 'MANUAL',
    billType,
    tableId: resolvedTable ? resolvedTable._id : null,
    tableNumber: resolvedTable ? resolvedTable.tableNumber : (tableNumber || (billType === 'walk_in' ? 'Walk-in' : 1)),
    guestId: 'manual_' + Date.now().toString(36),
    orderNumber,
    items: totals.validatedItems,
    subtotal: totals.subtotal,
    discount: totals.totalDiscount,
    billDiscount: {
      type: billDiscount.type || 'none',
      value: Number(billDiscount.value) || 0,
      amount: totals.billDiscountAmount,
    },
    tax: totals.tax,
    serviceCharge: totals.serviceCharge,
    packagingCharge: totals.packagingCharge,
    grandTotal: totals.grandTotal,
    status,
    statusHistory: [
      {
        status,
        timestamp: new Date(),
        updatedBy: user?.name || user?.email || 'cashier',
        note: action === 'save_draft' ? 'Manual draft bill saved' : action === 'mark_paid' ? 'Manual bill generated and paid' : 'Manual bill generated',
      },
    ],
    kitchenStatus: sendToKitchen ? 'pending' : 'completed',
    cashierStatus,
    paymentStatus,
    paymentMethod: paymentMethod || 'none',
    splitPayments: Array.isArray(splitPayments) ? splitPayments : [],
    customerName: customerName?.trim() || (billType === 'walk_in' ? 'Walk-in Customer' : 'Table Guest'),
    customerPhone: customerPhone?.trim() || '',
    staffId: user?._id || null,
    staffName: user?.name || user?.email || 'Cashier',
    sendToKitchen: Boolean(sendToKitchen),
    notes: notes || '',
    createdBy: user?.name || 'cashier',
    updatedBy: user?.name || 'cashier',
  });

  // If table assigned, mark occupied
  if (resolvedTable) {
    resolvedTable.status = action === 'mark_paid' ? 'occupied' : 'occupied';
    resolvedTable.currentOrderId = order._id;
    resolvedTable.occupiedAt = new Date();
    await resolvedTable.save();
    emitToTable(resolvedTable._id, 'table-updated', { tableId: resolvedTable._id, status: 'occupied', currentOrderId: order._id });
  }

  // If action is mark_paid, record Payment & generate Receipt snapshot
  let receipt = null;
  if (action === 'mark_paid') {
    const payment = new Payment({
      restaurantId: restId,
      orderId: order._id,
      tableId: order.tableId,
      amount: order.grandTotal,
      currency: 'INR',
      status: 'captured',
      method: paymentMethod,
      paymentSource: 'MANUAL',
      cashierId: user?._id || null,
      splitPayments: order.splitPayments,
      notes: { orderNumber: order.orderNumber, cashier: user?.name || 'Cashier' },
      capturedAt: new Date(),
      auditHistory: [
        {
          action: 'MANUAL_PAYMENT_COLLECTED',
          status: 'captured',
          actor: user?.name || 'cashier',
          timestamp: new Date(),
          details: { method: paymentMethod, amount: order.grandTotal },
        },
      ],
    });
    await payment.save();

    receipt = await generateReceiptSnapshot(order._id);
  }

  // Real-time socket emission
  try {
    emitToRestaurant(restId, 'manual-order-created', { order, receipt });
    if (sendToKitchen) {
      emitToRestaurant(restId, SOCKET_EVENTS.ORDER_CREATED, order);
    }
  } catch (sErr) {
    console.warn('[Manual Billing] Socket emission note:', sErr.message);
  }

  return { order: sanitizeManualOrder(order), receipt };
};

/**
 * 2. Get Paginated Manual Bills List (Tenant-Isolated)
 */
export const getManualOrdersService = async (restaurantId, query = {}) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);

  const {
    filter = 'today', // 'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'all'
    startDate,
    endDate,
    status = 'all', // 'all' | 'draft' | 'generated' | 'completed' | 'cancelled'
    paymentStatus = 'all', // 'all' | 'paid' | 'pending'
    paymentMethod = 'all', // 'all' | 'cash' | 'upi' | 'card' | 'split'
    search = '',
    page = 1,
    limit = 25,
  } = query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
  const skip = (pageNum - 1) * limitNum;

  const now = new Date();
  const matchFilter = {
    restaurantId: restId,
    orderSource: { $in: ['MANUAL', 'manual'] },
    isDeleted: false,
  };

  // Status Filter
  if (status && status !== 'all') {
    if (status === 'paid') {
      matchFilter.status = 'completed';
      matchFilter.cashierStatus = 'paid';
    } else {
      matchFilter.status = status;
    }
  }

  // Payment Status Filter
  if (paymentStatus && paymentStatus !== 'all') {
    if (paymentStatus === 'paid') {
      matchFilter.paymentStatus = { $in: ['paid_cash', 'paid_online', 'paid', 'PAID'] };
    } else if (paymentStatus === 'pending') {
      matchFilter.paymentStatus = 'pending';
    }
  }

  // Payment Method Filter
  if (paymentMethod && paymentMethod !== 'all') {
    matchFilter.paymentMethod = paymentMethod.toLowerCase();
  }

  // Date Range Filters
  if (filter === 'today') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    matchFilter.createdAt = { $gte: startOfToday, $lte: endOfToday };
  } else if (filter === 'yesterday') {
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    matchFilter.createdAt = { $gte: startOfYesterday, $lte: endOfYesterday };
  } else if (filter === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    matchFilter.createdAt = { $gte: weekAgo };
  } else if (filter === 'month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    matchFilter.createdAt = { $gte: monthAgo };
  } else if (filter === 'custom' && startDate) {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    matchFilter.createdAt = { $gte: start, $lte: end };
  }

  // Search Filter
  if (search && search.trim()) {
    const term = search.trim();
    matchFilter.$or = [
      { orderNumber: { $regex: term, $options: 'i' } },
      { customerName: { $regex: term, $options: 'i' } },
      { customerPhone: { $regex: term, $options: 'i' } },
      { staffName: { $regex: term, $options: 'i' } },
    ];
  }

  // Parallel Query Execution for list + summary KPIs
  const [orders, totalCount, summaryAgg] = await Promise.all([
    Order.find(matchFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Order.countDocuments(matchFilter),
    Order.aggregate([
      { $match: { restaurantId: restId, orderSource: { $in: ['MANUAL', 'manual'] }, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [{ $in: ['$status', ['completed', 'paid', 'PAID']] }, '$grandTotal', 0],
            },
          },
          totalBills: { $sum: 1 },
          draftCount: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
          generatedCount: { $sum: { $cond: [{ $eq: ['$status', 'generated'] }, 1, 0] } },
          paidCount: { $sum: { $cond: [{ $in: ['$status', ['completed', 'paid', 'PAID']] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const summary = summaryAgg[0] || {
    totalRevenue: 0,
    totalBills: 0,
    draftCount: 0,
    generatedCount: 0,
    paidCount: 0,
  };

  return {
    orders: (orders || []).map(sanitizeManualOrder),
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalOrders: totalCount,
      totalPages: Math.ceil(totalCount / limitNum) || 1,
    },
    summary,
  };
};

/**
 * 3. Get Single Manual Bill By ID
 */
export const getManualOrderByIdService = async (restaurantId, orderId) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);
  const order = await Order.findOne({
    _id: orderId,
    restaurantId: restId,
    isDeleted: false,
  }).lean();

  if (!order) {
    const error = new Error('Manual bill not found.');
    error.statusCode = 404;
    throw error;
  }

  const receipt = await Receipt.findOne({ orderId: order._id }).lean();

  return { order: sanitizeManualOrder(order), receipt };
};

/**
 * 4. Update an Existing Manual Bill (Draft or Generated)
 */
export const updateManualOrderService = async ({ restaurantId, user, orderId, payload = {} }) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);

  const order = await Order.findOne({
    _id: orderId,
    restaurantId: restId,
    isDeleted: false,
  });

  if (!order) {
    const error = new Error('Manual bill not found.');
    error.statusCode = 404;
    throw error;
  }

  if (order.status === 'completed' || order.cashierStatus === 'paid') {
    const error = new Error('Paid bills cannot be edited. Please generate a refund or create a new bill.');
    error.statusCode = 400;
    throw error;
  }

  const settings = await RestaurantSettings.findOne({ restaurantId: restId }).lean();

  const {
    items,
    billDiscount,
    billType,
    tableId,
    tableNumber,
    customerName,
    customerPhone,
    paymentMethod,
    splitPayments,
    action,
    sendToKitchen,
    notes,
  } = payload;

  if (items && Array.isArray(items) && items.length > 0) {
    const itemIds = items.map((i) => i.itemId || i.menuItemId).filter(Boolean);
    const dbItems = await MenuItem.find({
      _id: { $in: itemIds },
      restaurantId: restId,
      isDeleted: { $ne: true },
    }).lean();

    const dbItemMap = new Map(dbItems.map((i) => [i._id.toString(), i]));
    const hydratedItems = items.map((reqItem) => {
      const idKey = (reqItem.itemId || reqItem.menuItemId || '').toString();
      const dbItem = dbItemMap.get(idKey);
      const originalPrice = Number(dbItem?.price || reqItem.originalPrice || reqItem.price || 0);
      const sellingPrice = Number(reqItem.sellingPrice || dbItem?.sellingPrice || originalPrice);

      return {
        itemId: dbItem?._id || reqItem.itemId || reqItem.menuItemId,
        menuItemId: dbItem?._id || reqItem.menuItemId || reqItem.itemId,
        itemName: dbItem?.itemName || reqItem.itemName || reqItem.name || 'Dish',
        name: dbItem?.itemName || reqItem.itemName || reqItem.name || 'Dish',
        originalPrice,
        price: originalPrice,
        sellingPrice,
        quantity: Math.max(1, parseInt(reqItem.quantity, 10) || 1),
        notes: reqItem.notes || reqItem.specialInstructions || '',
        specialInstructions: reqItem.notes || reqItem.specialInstructions || '',
        foodType: dbItem?.foodType || reqItem.foodType || 'veg',
        image: getImageUrl(dbItem?.image || reqItem.image),
      };
    });

    const activeDiscount = billDiscount || order.billDiscount;
    const totals = calculateManualBillTotals(hydratedItems, activeDiscount, settings);

    order.items = totals.validatedItems;
    order.subtotal = totals.subtotal;
    order.discount = totals.totalDiscount;
    order.billDiscount = {
      type: activeDiscount.type || 'none',
      value: Number(activeDiscount.value) || 0,
      amount: totals.billDiscountAmount,
    };
    order.tax = totals.tax;
    order.serviceCharge = totals.serviceCharge;
    order.packagingCharge = totals.packagingCharge;
    order.grandTotal = totals.grandTotal;
  }

  if (billType) order.billType = billType;
  if (tableId !== undefined) order.tableId = tableId;
  if (tableNumber !== undefined) order.tableNumber = tableNumber;
  if (customerName) order.customerName = customerName.trim();
  if (customerPhone !== undefined) order.customerPhone = customerPhone.trim();
  if (paymentMethod) order.paymentMethod = paymentMethod;
  if (splitPayments) order.splitPayments = splitPayments;
  if (sendToKitchen !== undefined) order.sendToKitchen = Boolean(sendToKitchen);
  if (notes !== undefined) order.notes = notes;

  if (action === 'generate') {
    order.status = 'generated';
    order.statusHistory.push({
      status: 'generated',
      timestamp: new Date(),
      updatedBy: user?.name || 'cashier',
      note: 'Bill generated from draft',
    });
  } else if (action === 'save_draft') {
    order.status = 'draft';
  }

  order.updatedBy = user?.name || 'cashier';
  await order.save();

  try {
    emitToRestaurant(restId, 'manual-order-updated', { order });
  } catch (e) {
    console.warn('Socket note:', e.message);
  }

  return sanitizeManualOrder(order);
};

/**
 * 5. Mark Manual Bill as Paid (Cash, UPI, Card, Split)
 */
export const markManualOrderPaidService = async ({
  restaurantId,
  user,
  orderId,
  paymentMethod = 'cash',
  splitPayments = [],
  notes = '',
}) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);

  const order = await Order.findOne({
    _id: orderId,
    restaurantId: restId,
    isDeleted: false,
  });

  if (!order) {
    const error = new Error('Manual bill not found.');
    error.statusCode = 404;
    throw error;
  }

  if (order.status === 'completed' && order.cashierStatus === 'paid') {
    const existingReceipt = await Receipt.findOne({ orderId: order._id }).lean();
    return { order, receipt: existingReceipt, alreadyPaid: true };
  }

  // Validate Split Payments if method is split
  if (paymentMethod === 'split') {
    const splitSum = (splitPayments || []).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    if (Math.abs(splitSum - order.grandTotal) > 1) {
      const error = new Error(`Split payment sum (₹${splitSum}) does not match bill grand total (₹${order.grandTotal}).`);
      error.statusCode = 400;
      throw error;
    }
  }

  const updateFields = {
    status: 'completed',
    cashierStatus: 'paid',
    paymentStatus: paymentMethod === 'cash' ? 'paid_cash' : 'paid_online',
    paymentMethod,
    paidAt: new Date(),
    updatedBy: user?.name || 'cashier',
  };
  if (paymentMethod === 'split') {
    updateFields.splitPayments = splitPayments;
  }

  const updatedOrder = await Order.findByIdAndUpdate(
    order._id,
    {
      $set: updateFields,
      $push: {
        statusHistory: {
          status: 'completed',
          timestamp: new Date(),
          updatedBy: user?.name || 'cashier',
          note: `Marked paid via ${paymentMethod.toUpperCase()}${notes ? ` - ${notes}` : ''}`,
        },
      },
    },
    { new: true }
  );

  const activeOrder = updatedOrder || order;

  // Create Payment Record
  const payment = new Payment({
    restaurantId: restId,
    orderId: activeOrder._id,
    tableId: activeOrder.tableId,
    amount: activeOrder.grandTotal,
    currency: 'INR',
    status: 'captured',
    method: paymentMethod,
    paymentSource: 'MANUAL',
    cashierId: user?._id || null,
    splitPayments: activeOrder.splitPayments,
    notes: {
      orderNumber: activeOrder.orderNumber,
      cashier: user?.name || 'Cashier',
      method: paymentMethod,
      notes,
    },
    capturedAt: new Date(),
    auditHistory: [
      {
        action: 'MARK_PAID_MANUAL_BILL',
        status: 'captured',
        actor: user?.name || 'cashier',
        timestamp: new Date(),
        details: { paymentMethod, amount: activeOrder.grandTotal },
      },
    ],
  });
  await payment.save();

  // Generate Receipt Snapshot
  const receipt = await generateReceiptSnapshot(activeOrder._id);

  try {
    emitToRestaurant(restId, 'manual-order-updated', { order: activeOrder, receipt });
    emitToRestaurant(restId, 'order-updated', activeOrder);
  } catch (e) {
    console.warn('Socket note:', e.message);
  }

  return { order: sanitizeManualOrder(activeOrder), receipt };
};

/**
 * 6. Cancel a Manual Bill
 */
export const cancelManualOrderService = async ({ restaurantId, user, orderId, reason = '' }) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);

  const order = await Order.findOne({
    _id: orderId,
    restaurantId: restId,
    isDeleted: false,
  });

  if (!order) {
    const error = new Error('Manual bill not found.');
    error.statusCode = 404;
    throw error;
  }

  order.status = 'cancelled';
  order.statusHistory.push({
    status: 'cancelled',
    timestamp: new Date(),
    updatedBy: user?.name || 'cashier',
    note: `Manual bill cancelled: ${reason || 'Cancelled by staff'}`,
  });

  await order.save();

  // If table was linked, check if table should be freed
  if (order.tableId) {
    const table = await Table.findById(order.tableId);
    if (table && String(table.currentOrderId) === String(order._id)) {
      table.status = 'available';
      table.currentOrderId = null;
      await table.save();
      emitToTable(table._id, 'table-updated', { tableId: table._id, status: 'available' });
    }
  }

  try {
    emitToRestaurant(restId, 'manual-order-updated', { order });
  } catch (e) {
    console.warn('Socket note:', e.message);
  }

  return order;
};

/**
 * 7. Get or Generate Receipt for Printing
 */
export const printManualOrderReceiptService = async ({ restaurantId, orderId }) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);

  let receipt = await Receipt.findOne({ orderId, restaurantId: restId }).lean();
  if (!receipt) {
    receipt = await generateReceiptSnapshot(orderId);
  }

  if (!receipt) {
    const order = await Order.findOne({ _id: orderId, restaurantId: restId }).lean();
    if (!order) {
      const error = new Error('Order not found for printing.');
      error.statusCode = 404;
      throw error;
    }
    const [restaurant, settings] = await Promise.all([
      Restaurant.findById(restId).lean(),
      RestaurantSettings.findOne({ restaurantId: restId }).lean(),
    ]);

    receipt = {
      receiptNumber: `MAN-${order.orderNumber}`,
      orderNumber: order.orderNumber,
      orderId: order._id,
      restaurantSnapshot: {
        restaurantName: restaurant?.restaurantName || 'Restaurant',
        phone: restaurant?.phone || restaurant?.ownerPhone || '',
        address: restaurant?.address || {},
        gstNumber: restaurant?.taxInfo?.gstNumber || restaurant?.gstNumber || '',
        fssaiNumber: restaurant?.taxInfo?.fssaiNumber || restaurant?.fssaiNumber || '',
      },
      tableSnapshot: {
        tableNumber: order.tableNumber || 'Walk-in',
        tableName: order.billType === 'walk_in' ? 'Walk-in' : `Table ${order.tableNumber}`,
      },
      guestSnapshot: {
        customerName: order.customerName || 'Walk-in Customer',
        customerPhone: order.customerPhone || '',
      },
      itemsSnapshot: order.items,
      subtotal: order.subtotal,
      discount: order.discount,
      gst: order.tax,
      serviceCharge: order.serviceCharge,
      grandTotal: order.grandTotal,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      paidAt: order.paidAt || order.createdAt,
      receiptFooter: settings?.receiptFooter || 'Thank you for your visit!',
    };
  }

  return receipt;
};

