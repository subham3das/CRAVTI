import mongoose from 'mongoose';
import { getSubscriptionState, calculateSubscriptionState } from '../utils/subscriptionUtils.js';

const restaurantSchema = new mongoose.Schema(
  {
    restaurantName: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
    },
    logo: {
      url: {
        type: String,
        default: '',
      },
      public_id: {
        type: String,
        default: '',
      },
    },
    coverImage: {
      url: {
        type: String,
        default: '',
      },
      public_id: {
        type: String,
        default: '',
      },
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
    },
    ownerPhone: {
      type: String,
      required: [true, 'Owner phone is required'],
      trim: true,
    },
    address: {
      street: { type: String, default: '', trim: true },
      city: { type: String, default: '', trim: true },
      state: { type: String, default: '', trim: true },
      pincode: { type: String, default: '', trim: true },
    },
    timing: {
      openingTime: { type: String, default: '10:00 AM' },
      closingTime: { type: String, default: '11:00 PM' },
    },
    taxInfo: {
      gstNumber: { type: String, default: '', trim: true },
      fssaiNumber: { type: String, default: '', trim: true },
    },
    bankDetails: {
      holderName: { type: String, default: '', trim: true },
      bankName: { type: String, default: '', trim: true },
      accountNumber: { type: String, default: '', trim: true },
      ifscCode: { type: String, default: '', trim: true },
      upiId: { type: String, default: '', trim: true },
      status: {
        type: String,
        enum: ['pending', 'submitted', 'verified', 'rejected', 'changes_requested'],
        default: 'pending',
      },
      approvedBy: { type: String, default: '' },
      approvedAt: { type: Date, default: null },
      rejectionReason: { type: String, default: '' },
    },
    profileCompleted: {
      type: Boolean,
      default: true,
    },
    paymentEnabled: {
      type: Boolean,
      default: false,
    },
    qrEnabled: {
      type: Boolean,
      default: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'submitted', 'under_review', 'verified', 'rejected', 'changes_requested'],
      default: 'pending',
    },
    verificationDetails: {
      verifiedBy: { type: String, default: '' },
      verifiedAt: { type: Date, default: null },
      reviewNotes: { type: String, default: '' },
      rejectionReason: { type: String, default: '' },
      requestedChanges: { type: String, default: '' },
    },
    verificationHistory: [
      {
        status: { type: String, required: true },
        actor: { type: String, default: 'Admin' },
        timestamp: { type: Date, default: Date.now },
        notes: { type: String, default: '' },
        reason: { type: String, default: '' },
      },
    ],
    profileCompletionPercentage: {
      type: Number,
      default: 40,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RestaurantUser',
      required: true,
    },
    // SaaS Subscription Architecture (Phase 1)
    subscription: {
      planName: {
        type: String,
        default: 'Craviti Pro',
      },
      planId: {
        type: String,
        default: '',
      },
      razorpayCustomerId: {
        type: String,
        default: '',
      },
      razorpaySubscriptionId: {
        type: String,
        default: '',
      },
      status: {
        type: String,
        enum: ['trial', 'active', 'pending', 'expired', 'cancelled', 'halted', 'suspended'],
        default: 'trial',
        index: true,
      },
      registrationDate: {
        type: Date,
      },
      trialStartDate: {
        type: Date,
      },
      trialEndDate: {
        type: Date,
      },
      trialEndsAt: {
        type: Date,
      },
      subscriptionStart: {
        type: Date,
        default: null,
      },
      subscriptionEnd: {
        type: Date,
        default: null,
      },
      nextBillingDate: {
        type: Date,
        default: null,
      },
      lastPaymentId: {
        type: String,
        default: '',
      },
    },
    // Settlement & Commission Architecture
    linkedAccountId: {
      type: String,
      default: '',
      trim: true,
    },
    commissionRate: {
      type: Number,
      default: null, // null means inherits platform default commission
    },
    status: {
      type: String,
      default: 'active',
    },
    wallet: {
      pendingBalance: {
        type: Number,
        default: 0,
      },
      paidBalance: {
        type: Number,
        default: 0,
      },
      lifetimeEarnings: {
        type: Number,
        default: 0,
      },
    },
    pendingSettlement: {
      type: Number,
      default: 0,
    },
    totalSettled: {
      type: Number,
      default: 0,
    },
    settlementCycle: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly'],
      default: 'weekly',
    },
    minimumSettlement: {
      type: Number,
      default: 500,
    },
    settlementNotes: {
      type: String,
      default: '',
    },
    registrationDate: {
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
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.subscription = getSubscriptionState(ret);
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.subscription = getSubscriptionState(ret);
        return ret;
      },
    },
  }
);

restaurantSchema.pre('save', function (next) {
  // 1. Permanently anchor registration date
  if (!this.registrationDate) {
    this.registrationDate = this.createdAt || new Date();
  }

  // 2. Ensure subscription subdocument exists
  if (!this.subscription) {
    this.subscription = {};
  }

  const sub = this.subscription;
  sub.registrationDate = sub.registrationDate || this.registrationDate;

  // 3. Permanently anchor trialStartDate to registrationDate (IMMUTABLE)
  if (!sub.trialStartDate) {
    sub.trialStartDate = this.registrationDate;
  }

  // 4. Permanently anchor trialEndDate to trialStartDate + exactly 14 full days (14 * 24 * 60 * 60 * 1000)
  if (!sub.trialEndDate) {
    if (sub.trialEndsAt) {
      sub.trialEndDate = sub.trialEndsAt;
    } else {
      sub.trialEndDate = new Date(new Date(sub.trialStartDate).getTime() + 14 * 24 * 60 * 60 * 1000);
    }
  }
  sub.trialEndsAt = sub.trialEndDate;

  next();
});

restaurantSchema.methods.getSubscriptionState = function () {
  return getSubscriptionState(this);
};

restaurantSchema.virtual('subscription.trialDaysRemaining').get(function () {
  return getSubscriptionState(this).trialDaysRemaining;
});

restaurantSchema.virtual('subscription.subscriptionStatus').get(function () {
  return getSubscriptionState(this).subscriptionStatus;
});

restaurantSchema.index({ slug: 1, isDeleted: 1 });
restaurantSchema.index({ ownerPhone: 1, isDeleted: 1 });
restaurantSchema.index({ createdBy: 1, isDeleted: 1 });
restaurantSchema.index(
  { linkedAccountId: 1 },
  { unique: true, partialFilterExpression: { linkedAccountId: { $type: 'string', $gt: '' } } }
);

export const Restaurant = mongoose.model('Restaurant', restaurantSchema);

