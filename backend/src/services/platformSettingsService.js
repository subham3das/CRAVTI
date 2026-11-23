import { PlatformFinanceSettings } from '../models/PlatformFinanceSettings.js';
import env from '../config/env.js';

const DEFAULT_SETTINGS = {
  key: 'default',
  defaultCommission: 5.0,
  defaultGst: 5.0,
  gatewayFeePercent: 2.0,
  platformFee: 0,
  convenienceFee: 0,
  settlementCycle: 'weekly',
  minimumSettlementAmount: 500,
  trialDays: 14,
  holdDays: 2,
  autoSettlement: true,
  autoPayout: false,
  subscriptionPlans: [
    {
      id: 'starter',
      name: 'Starter Plan',
      priceMonthly: 0,
      priceYearly: 0,
      razorpayPlanId: '',
      features: ['Up to 5 Tables', 'Basic QR Ordering', 'Email Support'],
      isActive: true,
    },
    {
      id: 'professional',
      name: 'Professional Plan',
      priceMonthly: 699,
      priceYearly: 6999,
      razorpayPlanId: env.RAZORPAY_BASIC_PLAN_ID || '',
      features: ['Unlimited Tables', 'Manual POS Billing', 'Priority Settlement', 'Analytics'],
      isActive: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      priceMonthly: 3999,
      priceYearly: 39999,
      razorpayPlanId: '',
      features: ['Multi-branch POS', 'Dedicated Account Manager', 'Custom Commission', 'API Access'],
      isActive: true,
    },
  ],
};

/**
 * Get or initialize platform finance settings
 */
export const getPlatformFinanceSettings = async () => {
  let settings = await PlatformFinanceSettings.findOne({ key: 'default' });
  if (!settings) {
    settings = await PlatformFinanceSettings.create(DEFAULT_SETTINGS);
  }
  return settings;
};

/**
 * Update platform finance settings
 */
export const updatePlatformFinanceSettings = async (updateData, adminUser = null) => {
  let settings = await PlatformFinanceSettings.findOne({ key: 'default' });
  if (!settings) {
    settings = new PlatformFinanceSettings(DEFAULT_SETTINGS);
  }

  const allowedFields = [
    'defaultCommission',
    'defaultGst',
    'gatewayFeePercent',
    'platformFee',
    'convenienceFee',
    'settlementCycle',
    'minimumSettlementAmount',
    'trialDays',
    'holdDays',
    'autoSettlement',
    'autoPayout',
    'subscriptionPlans',
  ];

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      settings[field] = updateData[field];
    }
  });

  if (adminUser) {
    settings.updatedBy = adminUser.email || adminUser.name || 'admin';
  }

  await settings.save();
  return settings;
};

