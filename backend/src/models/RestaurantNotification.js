import mongoose from 'mongoose';

const restaurantNotificationSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'APPROVAL',
        'REJECTION',
        'PAYMENT',
        'SUBSCRIPTION',
        'ANNOUNCEMENT',
        'SUPPORT_REPLY',
        'VERIFICATION',
        'FEATURE_UPDATE',
        'MAINTENANCE',
        'GENERAL',
      ],
      default: 'GENERAL',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    link: {
      type: String,
      default: '',
      trim: true,
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

restaurantNotificationSchema.index({ restaurantId: 1, createdAt: -1 });

export const RestaurantNotification = mongoose.model(
  'RestaurantNotification',
  restaurantNotificationSchema
);

export default RestaurantNotification;

