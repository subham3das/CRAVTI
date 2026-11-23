import mongoose from 'mongoose';

const platformFinanceSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'default',
      unique: true,
      index: true,
    },
    defaultCommission: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 100,
    },
    defaultGst: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 100,
    },
    gatewayFeePercent: {
      type: Number,
      default: 2.0,
      min: 0,
      max: 100,
    },
    platformFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    convenienceFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    settlementCycle: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'manual'],
      default: 'weekly',
    },
    minimumSettlementAmount: {
      type: Number,
      default: 500,
      min: 0,
    },
    trialDays: {
      type: Number,
      default: 14,
      min: 1,
    },
    holdDays: {
      type: Number,
      default: 2,
      min: 0,
    },
    autoSettlement: {
      type: Boolean,
      default: true,
    },
    autoPayout: {
      type: Boolean,
      default: false,
    },
    subscriptionPlans: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        priceMonthly: { type: Number, required: true },
        priceYearly: { type: Number, default: 0 },
        razorpayPlanId: { type: String, default: '' },
        features: [{ type: String }],
        isActive: { type: Boolean, default: true },
      },
    ],
    updatedBy: {
      type: String,
      default: 'system',
    },
  },
  {
    timestamps: true,
  }
);

export const PlatformFinanceSettings = mongoose.model(
  'PlatformFinanceSettings',
  platformFinanceSettingsSchema
);
export default PlatformFinanceSettings;

