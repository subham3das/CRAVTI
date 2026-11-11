import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
    },
    itemName: {
      type: String,
      required: true,
    },
    name: {
      type: String,
    },
    originalPrice: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    specialInstructions: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    foodType: {
      type: String,
      enum: ['veg', 'non-veg', 'egg'],
      default: 'veg',
    },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: String,
      default: 'system',
    },
    note: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    orderSource: {
      type: String,
      enum: ['QR', 'MANUAL', 'qr', 'manual'],
      default: 'QR',
      index: true,
    },
    billType: {
      type: String,
      enum: ['table', 'walk_in', 'dine_in', 'takeaway'],
      default: 'table',
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: false,
      default: null,
      index: true,
    },
    tableNumber: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
      default: '',
    },
    guestId: {
      type: String,
      required: false,
      default: () => 'guest_' + Date.now().toString(36),
      index: true,
    },
    deviceId: {
      type: String,
      default: '',
      index: true,
    },
    sessionId: {
      type: String,
      default: '',
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [val => Array.isArray(val), 'Order items must be an array'],
    },
    subtotal: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    billDiscount: {
      type: {
        type: String,
        enum: ['none', 'flat', 'percentage'],
        default: 'none',
      },
      value: {
        type: Number,
        default: 0,
      },
      amount: {
        type: Number,
        default: 0,
      },
    },
    tax: {
      type: Number,
      default: 0,
    },
    serviceCharge: {
      type: Number,
      default: 0,
    },
    packagingCharge: {
      type: Number,
      default: 0,
    },
    deliveryCharge: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'generated', 'placed', 'accepted', 'served', 'completed', 'cancelled', 'PAID', 'paid'],
      default: 'placed',
      index: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: () => [{ status: 'placed', timestamp: new Date(), updatedBy: 'customer', note: 'Order created' }],
    },
    kitchenStatus: {
      type: String,
      enum: ['pending', 'in_kitchen', 'completed'],
      default: 'pending',
    },
    cashierStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'PAID', 'paid_online'],
      default: 'unpaid',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid_online', 'paid_cash', 'refunded', 'SUCCESS', 'success', 'PAID', 'paid', 'FAILED', 'failed'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['none', 'online', 'cash', 'upi', 'card', 'split', 'SPLIT'],
      default: 'none',
    },
    splitPayments: [
      {
        method: {
          type: String,
          enum: ['cash', 'upi', 'card'],
        },
        amount: {
          type: Number,
          default: 0,
        },
        reference: {
          type: String,
          default: '',
        },
      },
    ],
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RestaurantUser',
      default: null,
    },
    staffName: {
      type: String,
      default: '',
      trim: true,
    },
    sendToKitchen: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: mongoose.Schema.Types.Mixed,
      default: '',
    },
    customerName: {
      type: String,
      default: 'Guest',
      trim: true,
    },
    customerPhone: {
      type: String,
      default: '',
      trim: true,
    },
    estimatedPrepTime: {
      type: Number,
      default: 20, // in minutes
    },
    createdBy: {
      type: String,
      default: 'customer',
    },
    updatedBy: {
      type: String,
      default: 'customer',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RestaurantUser',
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for high-performance live dashboard querying
orderSchema.index({ restaurantId: 1, isDeleted: 1, status: 1 });
orderSchema.index({ restaurantId: 1, isDeleted: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, orderSource: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, tableId: 1, status: 1 });
orderSchema.index({ restaurantId: 1, guestId: 1 });
orderSchema.index({ restaurantId: 1, paymentStatus: 1 });

export const Order = mongoose.model('Order', orderSchema);
