import mongoose from 'mongoose';

const financeAuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null,
      index: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    adminName: {
      type: String,
      default: '',
    },
    adminEmail: {
      type: String,
      default: '',
    },
    ip: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
      default: '',
    },
    reason: {
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

financeAuditLogSchema.index({ createdAt: -1 });
financeAuditLogSchema.index({ action: 1, createdAt: -1 });
financeAuditLogSchema.index({ restaurantId: 1, createdAt: -1 });

export const FinanceAuditLog = mongoose.model('FinanceAuditLog', financeAuditLogSchema);
export default FinanceAuditLog;

