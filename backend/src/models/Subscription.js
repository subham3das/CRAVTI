import mongoose from 'mongoose';
import { SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUS } from '../constants/adminConstants.js';

const subscriptionSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      unique: true,
      index: true,
    },
    plan: {
      type: String,
      enum: Object.values(SUBSCRIPTION_PLANS),
      default: SUBSCRIPTION_PLANS.STARTER,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUS),
      default: SUBSCRIPTION_STATUS.ACTIVE,
      index: true,
    },
    maxTables: {
      type: Number,
      default: 5,
    },
    maxMenuItems: {
      type: Number,
      default: 30,
    },
    priceMonthly: {
      type: Number,
      default: 0,
    },
    commissionPercent: {
      type: Number,
      default: 5.0,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now,
    },
    currentPeriodEnd: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    features: {
      analyticsAccess: { type: Boolean, default: false },
      onlinePayments: { type: Boolean, default: true },
      customBranding: { type: Boolean, default: false },
      qrOrdering: { type: Boolean, default: true },
      prioritySupport: { type: Boolean, default: false },
      receiptBranding: { type: Boolean, default: false },
      multipleStaffAccounts: { type: Boolean, default: false },
    },
    history: [
      {
        action: { type: String, required: true },
        fromPlan: { type: String },
        toPlan: { type: String },
        changedBy: { type: String, default: 'Admin' },
        timestamp: { type: Date, default: Date.now },
        reason: { type: String, default: '' },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Subscription = mongoose.model('Subscription', subscriptionSchema);

