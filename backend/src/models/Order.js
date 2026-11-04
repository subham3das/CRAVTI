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
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: true,
      index: true,
    },
    tableNumber: {
      type: Number,
      required: true,
    },
    guestId: {
      type: String,
      required: true,
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
      validate: [val => val.length > 0, 'Order must contain at least one item'],
    },
    subtotal: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    serviceCharge: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['placed', 'accepted', 'served', 'completed', 'cancelled'],
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
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid_online', 'paid_cash', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['none', 'online', 'cash', 'upi', 'card'],
      default: 'none',
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
orderSchema.index({ restaurantId: 1, tableId: 1, status: 1 });
orderSchema.index({ restaurantId: 1, guestId: 1 });
orderSchema.index({ restaurantId: 1, paymentStatus: 1 });

export const Order = mongoose.model('Order', orderSchema);
