import mongoose from 'mongoose';
import { AUDIT_ACTIONS } from '../constants/adminConstants.js';

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: false,
      index: true,
    },
    adminEmail: {
      type: String,
      default: 'system',
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      default: '',
    },
    targetId: {
      type: String,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
      default: '',
    },
    browser: {
      type: String,
      default: '',
    },
    reason: {
      type: String,
      default: '',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

adminAuditLogSchema.index({ createdAt: -1 });

export const AdminAuditLog = mongoose.model('AdminAuditLog', adminAuditLogSchema);

