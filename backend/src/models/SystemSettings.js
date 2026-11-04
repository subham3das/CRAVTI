import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema(
  {
    platformName: {
      type: String,
      default: 'Craviti',
      trim: true,
    },
    platformLogo: {
      type: String,
      default: '',
    },
    defaultGst: {
      type: Number,
      default: 5,
      min: 0,
      max: 100,
    },
    defaultCurrency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    supportEmail: {
      type: String,
      default: 'support@craviti.com',
      trim: true,
    },
    supportPhone: {
      type: String,
      default: '+91 98765 43210',
      trim: true,
    },
    receiptFooter: {
      type: String,
      default: 'Powered by Craviti - Smart QR Dining',
      trim: true,
    },
    privacyPolicy: {
      type: String,
      default: 'Standard Craviti Privacy Policy for Multi-tenant Dining.',
    },
    terms: {
      type: String,
      default: 'Standard Craviti Merchant and Customer Terms & Conditions.',
    },
    smtpHost: { type: String, default: 'smtp.sendgrid.net' },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: 'apikey' },
    smsProvider: { type: String, default: 'Twilio / Msg91' },
    pushNotificationKey: { type: String, default: '' },
    cloudinaryCloudName: { type: String, default: 'craviti-cloud' },
    razorpayKeyId: { type: String, default: 'rzp_live_craviti' },
    updatedBy: {
      type: String,
      default: 'system',
    },
  },
  { timestamps: true }
);

export const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
