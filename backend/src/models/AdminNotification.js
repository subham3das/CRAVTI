import mongoose from 'mongoose';
import { NOTIFICATION_TYPES } from '../constants/adminConstants.js';

const adminNotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null,
      index: true,
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
    readBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    link: {
      type: String,
      default: '',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

adminNotificationSchema.index({ createdAt: -1 });

export const AdminNotification = mongoose.model('AdminNotification', adminNotificationSchema);

