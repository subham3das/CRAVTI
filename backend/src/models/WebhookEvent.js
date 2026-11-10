import mongoose from 'mongoose';

/**
 * WebhookEvent Model
 * Persists immutable audit logs of all incoming Razorpay webhook events.
 * Provides deduplication (idempotency) via unique eventId.
 */
const webhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    processingStatus: {
      type: String,
      enum: ['received', 'processing', 'processed', 'ignored', 'failed', 'duplicate'],
      default: 'received',
      index: true,
    },
    paymentId: {
      type: String,
      default: '',
      index: true,
    },
    orderId: {
      type: String,
      default: '',
      index: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null,
      index: true,
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      default: null,
    },
    guestSessionId: {
      type: String,
      default: '',
    },
    verificationResult: {
      type: String,
      default: 'VALID',
    },
    processingResult: {
      type: String,
      default: '',
    },
    errorMessage: {
      type: String,
      default: '',
    },
    durationMs: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

webhookEventSchema.index({ eventType: 1, receivedAt: -1 });
webhookEventSchema.index({ processingStatus: 1, createdAt: -1 });

export const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);
export default WebhookEvent;
