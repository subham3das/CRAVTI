import mongoose from 'mongoose';

const receiptItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
    },
    itemName: {
      type: String,
      required: true,
    },
    originalPrice: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    foodType: {
      type: String,
      default: 'veg',
    },
    specialInstructions: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const receiptSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    restaurantSnapshot: {
      restaurantName: { type: String, default: '' },
      logo: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      address: { type: Object, default: {} },
      gstNumber: { type: String, default: '' },
      fssaiNumber: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    tableSnapshot: {
      tableNumber: { type: Number, required: true },
      tableName: { type: String, default: '' },
      floor: { type: String, default: '' },
    },
    guestSnapshot: {
      customerName: { type: String, default: 'Guest' },
      customerPhone: { type: String, default: '' },
      customerId: { type: String, default: '' },
      guestId: { type: String, default: '' },
      deviceId: { type: String, default: '' },
    },
    itemsSnapshot: {
      type: [receiptItemSchema],
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    gst: {
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
    paymentMethod: {
      type: String,
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      default: 'paid_cash',
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    completionTime: {
      type: Date,
      default: Date.now,
    },
    receiptFooter: {
      type: String,
      default: 'Thank you for dining with us!',
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
      type: String,
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

receiptSchema.index({ restaurantId: 1, createdAt: -1 });

export const Receipt = mongoose.model('Receipt', receiptSchema);

