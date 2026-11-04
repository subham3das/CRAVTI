import mongoose from 'mongoose';
import { ANNOUNCEMENT_TYPES, ANNOUNCEMENT_AUDIENCE } from '../constants/adminConstants.js';

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(ANNOUNCEMENT_TYPES),
      default: ANNOUNCEMENT_TYPES.PLATFORM_UPDATE,
      index: true,
    },
    targetAudience: {
      type: String,
      enum: Object.values(ANNOUNCEMENT_AUDIENCE),
      default: ANNOUNCEMENT_AUDIENCE.EVERYONE,
    },
    targetRestaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null,
    },
    targetPlan: {
      type: String,
      default: 'all',
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    scheduledFor: {
      type: Date,
      default: Date.now,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: String,
      default: 'Admin',
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

export const Announcement = mongoose.model('Announcement', announcementSchema);

