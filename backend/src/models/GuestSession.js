import mongoose from 'mongoose';

const guestSessionSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      default: '',
    },
    guestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
    activeOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
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
  { timestamps: true }
);

guestSessionSchema.index({ deviceId: 1, lastActiveAt: -1 });

export const GuestSession = mongoose.model('GuestSession', guestSessionSchema);

