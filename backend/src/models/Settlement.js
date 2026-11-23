import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    settlementId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Net amount payable to the restaurant (kept synchronized with netAmount)
    amount: {
      type: Number,
      required: true,
      min: [0, 'Settlement amount cannot be negative'],
    },
    netAmount: {
      type: Number,
      default: 0,
      min: [0, 'Net amount cannot be negative'],
    },
    grossAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    commissionRate: {
      type: Number,
      default: 5.0,
    },
    commissionAmount: {
      type: Number,
      default: 0,
    },
    platformCommission: {
      type: Number,
      default: 0,
    },
    gatewayFee: {
      type: Number,
      default: 0,
    },
    gst: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'ready',
        'approved',
        'processing',
        'paid',
        'completed',
        'rejected',
        'failed',
        'on_hold',
        'retry',
        'waiting_for_route_account',
      ],
      default: 'pending',
      index: true,
    },
    cycle: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'manual'],
      default: 'weekly',
    },
    paymentMode: {
      type: String,
      default: 'online',
    },
    periodStart: {
      type: Date,
      default: null,
    },
    periodEnd: {
      type: Date,
      default: null,
    },
    orderIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
    paymentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
      },
    ],
    linkedAccountId: {
      type: String,
      default: '',
    },
    utr: {
      type: String,
      default: '',
      trim: true,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    processedBy: {
      type: String,
      default: 'system',
    },
    failureReason: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    remarks: {
      type: String,
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Backward-compatible synchronization hook
settlementSchema.pre('save', function (next) {
  if (this.netAmount !== undefined && (this.amount === undefined || this.amount === 0)) {
    this.amount = this.netAmount;
  } else if (this.amount !== undefined && (this.netAmount === undefined || this.netAmount === 0)) {
    this.netAmount = this.amount;
  }
  if (this.platformCommission !== undefined && (this.commissionAmount === undefined || this.commissionAmount === 0)) {
    this.commissionAmount = this.platformCommission;
  } else if (this.commissionAmount !== undefined && (this.platformCommission === undefined || this.platformCommission === 0)) {
    this.platformCommission = this.commissionAmount;
  }
  if (!this.remarks && this.notes) {
    this.remarks = this.notes;
  } else if (!this.notes && this.remarks) {
    this.notes = this.remarks;
  }
  next();
});

settlementSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });
settlementSchema.index({ status: 1, createdAt: -1 });
settlementSchema.index({ createdAt: -1 });

export const Settlement = mongoose.model('Settlement', settlementSchema);
export default Settlement;
