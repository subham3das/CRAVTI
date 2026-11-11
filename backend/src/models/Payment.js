import mongoose from 'mongoose';

const refundEntrySchema = new mongoose.Schema(
  {
    refundId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: 'processed' },
    reason: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const auditEntrySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    status: { type: String, required: true },
    actor: { type: String, default: 'system' },
    timestamp: { type: Date, default: Date.now },
    details: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { _id: true }
);

const paymentSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
    receiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Receipt',
      default: null,
      index: true,
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      default: null,
      index: true,
    },
    guestSessionId: {
      type: String,
      default: '',
      index: true,
    },
    paymentSource: {
      type: String,
      enum: ['QR', 'MANUAL', 'qr', 'manual'],
      default: 'QR',
      index: true,
    },
    cashierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RestaurantUser',
      default: null,
    },
    splitPayments: [
      {
        method: {
          type: String,
          enum: ['cash', 'upi', 'card'],
        },
        amount: Number,
        reference: String,
      },
    ],
    razorpayOrderId: {
      type: String,
      required: false,
      sparse: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: '',
      index: true,
    },
    paymentId: {
      type: String,
      default: '',
      index: true,
    },
    razorpaySignature: {
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Payment amount must be greater than or equal to 0'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    fee: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    capturedAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: '',
    },
    refundId: {
      type: String,
      default: '',
      index: true,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: [
        'created',
        'authorized',
        'captured',
        'failed',
        'refunded',
        'success',
        'SUCCESS',
        'FAILED',
        'REFUNDED',
        'PAID',
        'paid',
      ],
      default: 'created',
      index: true,
    },
    method: {
      type: String,
      default: 'none',
    },
    bank: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    refundHistory: [refundEntrySchema],
    auditHistory: [auditEntrySchema],
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
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });
paymentSchema.index({ restaurantId: 1, isDeleted: 1 });

export const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;

