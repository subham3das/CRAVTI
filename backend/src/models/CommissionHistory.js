import mongoose from 'mongoose';

const commissionHistorySchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null, // null indicates global platform default change
      index: true,
    },
    oldRate: {
      type: Number,
      required: true,
    },
    newRate: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    adminEmail: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

commissionHistorySchema.index({ restaurantId: 1, createdAt: -1 });

export const CommissionHistory = mongoose.model('CommissionHistory', commissionHistorySchema);
export default CommissionHistory;

