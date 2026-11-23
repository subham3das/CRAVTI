import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import {
  getCustomerMenuService,
  getActiveCustomerOrderService,
  placeOrderService,
  getOrderByIdService,
  updateOrderStatusService,
  updatePaymentStatusService,
  getLiveOrdersService,
  getHistoricalOrdersService,
  getOrderMetricsService,
  softDeleteOrderService,
  generateReceiptSnapshot,
} from '../services/orderService.js';
import { Receipt } from '../models/Receipt.js';
import { Order } from '../models/Order.js';
import { Restaurant } from '../models/Restaurant.js';
import { RestaurantSettings } from '../models/RestaurantSettings.js';
import { Table } from '../models/Table.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';

export const getCustomerMenu = asyncHandler(async (req, res) => {
  const { restaurantSlug, tableId, tableNumber, qrToken: paramToken } = req.params;
  const { guestId, deviceId, token, qrToken: queryToken, table: queryTable } = req.query;
  const resolvedTable = tableId || tableNumber || queryTable || '';
  const resolvedToken = paramToken || token || queryToken || '';
  const data = await getCustomerMenuService(restaurantSlug, resolvedTable, guestId, deviceId, resolvedToken);

  const message =
    !data.menuItems || data.menuItems.length === 0
      ? 'Menu is currently unavailable.'
      : 'Menu loaded successfully';

  return sendSuccess(res, message, data, HTTP_STATUS.OK, {
    restaurant: data.restaurant,
    table: data.table,
    categories: data.categories || [],
    items: data.menuItems || [],
    menuItems: data.menuItems || [],
  });
});

export const getActiveCustomerOrder = asyncHandler(async (req, res) => {
  const { restaurantSlug, tableId } = req.params;
  const { guestId, deviceId } = req.query;
  const order = await getActiveCustomerOrderService({
    restaurantSlug,
    tableIdentifier: tableId,
    guestId,
    deviceId,
  });
  return sendSuccess(res, 'Active order fetched', { order }, HTTP_STATUS.OK, { order });
});

export const placeOrder = asyncHandler(async (req, res) => {
  const result = await placeOrderService(req.body);
  return sendSuccess(
    res,
    result.appended ? 'Additional items added to your active order' : 'Order placed successfully',
    { order: result.order, appended: result.appended, guestId: result.guestId },
    HTTP_STATUS.CREATED,
    { order: result.order, appended: result.appended, guestId: result.guestId }
  );
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await getOrderByIdService(req.params.id);
  return sendSuccess(res, 'Order details fetched', { order }, HTTP_STATUS.OK, { order });
});

export const getOrderReceipt = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let receipt = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    receipt = await Receipt.findOne({ orderId: id, isDeleted: { $ne: true } }).lean();
    if (!receipt) {
      receipt = await Receipt.findOne({ _id: id, isDeleted: { $ne: true } }).lean();
    }
  }
  if (!receipt) {
    receipt = await Receipt.findOne({ orderNumber: id, isDeleted: { $ne: true } }).lean();
  }

  if (!receipt) {
    let order = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findOne({ _id: id, isDeleted: { $ne: true } });
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: id, isDeleted: { $ne: true } });
    }

    if (order) {
      receipt = await generateReceiptSnapshot(order._id);
      if (receipt && receipt.toObject) {
        receipt = receipt.toObject();
      }

      // Safe Fallback: If snapshot generation is pending, dynamically construct receipt payload
      if (!receipt) {
        const [restaurant, settings, table] = await Promise.all([
          Restaurant.findById(order.restaurantId).lean(),
          RestaurantSettings.findOne({ restaurantId: order.restaurantId }).lean(),
          order.tableId ? Table.findById(order.tableId).lean() : null,
        ]);

        const isWalkIn =
          order.billType === 'walk_in' ||
          !order.tableId ||
          String(order.tableNumber || '').toLowerCase().includes('walk');

        receipt = {
          receiptNumber: `CRV-${order.orderNumber}`,
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
            tableNumber: isWalkIn ? 0 : (table?.tableNumber || Number(order.tableNumber) || 1),
            tableName: table?.tableName || (isWalkIn ? 'Walk-in Customer' : (order.tableNumber ? `Table ${order.tableNumber}` : 'Table 1')),
            floor: table?.floor || (isWalkIn ? 'Counter' : 'Main Floor'),
          },
          guestSnapshot: {
            customerName: order.customerName || (isWalkIn ? 'Walk-in Customer' : 'Guest'),
            customerPhone: order.customerPhone || '',
            customerId: order.customerId || order.guestId || '',
            guestId: order.guestId || '',
            deviceId: order.deviceId || '',
          },
          itemsSnapshot: (order.items || []).map((i) => ({
            itemId: i.itemId || i.menuItemId || null,
            itemName: i.itemName || i.name || 'Item',
            originalPrice: Number(i.originalPrice || i.price || 0),
            sellingPrice: Number(i.sellingPrice || i.price || 0),
            quantity: Number(i.quantity || 1),
            foodType: i.foodType || 'veg',
            specialInstructions: i.specialInstructions || '',
          })),
          subtotal: Number(order.subtotal || 0),
          discount: Number(order.discount || 0),
          gst: Number(order.tax || 0),
          serviceCharge: Number(order.serviceCharge || 0),
          grandTotal: Number(order.grandTotal || 0),
          paymentMethod: order.paymentMethod || 'cash',
          paymentStatus: order.paymentStatus || 'paid_cash',
          paidAt: order.paidAt || order.createdAt || new Date(),
          completionTime: order.updatedAt || order.createdAt || new Date(),
          receiptFooter: settings?.receiptFooter || 'Thank you for dining with us. Please visit again!',
        };
      }
    }
  }

  if (!receipt) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Bill not found for this order',
    });
  }

  // Multi-tenant Restaurant Isolation: If accessed by an authenticated restaurant user, enforce ownership
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], env.JWT_SECRET);
      if (
        decoded.restaurantId &&
        receipt.restaurantId &&
        String(receipt.restaurantId) !== String(decoded.restaurantId) &&
        decoded.type !== 'admin'
      ) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Access denied: You do not have permission to view bills belonging to another restaurant.',
        });
      }
    } catch (_) {}
  }

  return sendSuccess(res, 'Receipt fetched successfully', { receipt }, HTTP_STATUS.OK, { receipt });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const updatedBy = req.user ? `${req.user.role || 'staff'}:${req.user._id}` : 'staff';
  const { status, note } = req.body;
  const order = await updateOrderStatusService(req.params.id, status, updatedBy, note);
  return sendSuccess(res, 'Order status updated', { order }, HTTP_STATUS.OK, { order });
});

export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const updatedBy = req.user ? `${req.user.role || 'staff'}:${req.user._id}` : 'cashier';
  const { paymentStatus, paymentMethod, note } = req.body;
  const order = await updatePaymentStatusService(req.params.id, paymentStatus, paymentMethod, updatedBy, note);
  return sendSuccess(res, 'Payment status updated', { order }, HTTP_STATUS.OK, { order });
});

export const getLiveOrders = asyncHandler(async (req, res) => {
  const orders = await getLiveOrdersService(req.restaurantId, req.query);
  return sendSuccess(res, 'Live orders fetched', { orders }, HTTP_STATUS.OK, { orders });
});

export const getHistoricalOrders = asyncHandler(async (req, res) => {
  const data = await getHistoricalOrdersService(req.restaurantId, req.query);
  return sendSuccess(res, 'Historical orders fetched', data, HTTP_STATUS.OK, { data });
});

export const getOrderMetrics = asyncHandler(async (req, res) => {
  const metrics = await getOrderMetricsService(req.restaurantId);
  return sendSuccess(res, 'Order metrics fetched', { metrics }, HTTP_STATUS.OK, { metrics });
});

export const softDeleteOrder = asyncHandler(async (req, res) => {
  const result = await softDeleteOrderService(req.params.id, req.restaurantId, req.user._id);
  return sendSuccess(res, 'Order deleted successfully', result, HTTP_STATUS.OK, result);
});
