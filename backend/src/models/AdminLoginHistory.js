import mongoose from 'mongoose';

const adminLoginHistorySchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
      index: true,
    },
    adminEmail: {
      type: String,
      required: true,
      index: true,
    },
    ip: {
      type: String,
      default: '',
    },
    browser: {
      type: String,
      default: '',
    },
    os: {
      type: String,
      default: '',
    },
    device: {
      type: String,
      default: 'Desktop',
    },
    country: {
      type: String,
      default: 'India',
    },
    loginTime: {
      type: Date,
      default: Date.now,
    },
    logoutTime: {
      type: Date,
      default: null,
    },
    success: {
      type: Boolean,
      default: true,
      index: true,
    },
    failureReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

adminLoginHistorySchema.index({ createdAt: -1 });

export const AdminLoginHistory = mongoose.model('AdminLoginHistory', adminLoginHistorySchema);

