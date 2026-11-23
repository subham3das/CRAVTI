import mongoose from 'mongoose';

const subscriptionHistorySchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    planId: {
      type: String,
      default: '',
    },
    planName: {
      type: String,
      default: 'Standard',
    },
    eventType: {
      type: String,
      enum: [
        'trial_started',
        'activated',
        'renewed',
        'expired',
        'cancelled',
        'paused',
        'resumed',
        'failed',
      ],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      default: 0,
    },
    razorpaySubscriptionId: {
      type: String,
      default: '',
    },
    razorpayPaymentId: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    performedBy: {
      type: String,
      default: 'system',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

subscriptionHistorySchema.index({ restaurantId: 1, createdAt: -1 });

export const SubscriptionHistory = mongoose.model('SubscriptionHistory', subscriptionHistorySchema);
export default SubscriptionHistory;

