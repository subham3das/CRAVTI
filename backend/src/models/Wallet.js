import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      unique: true,
      index: true,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    pendingBalance: {
      type: Number,
      default: 0,
    },
    settledBalance: {
      type: Number,
      default: 0,
    },
    lifetimeEarnings: {
      type: Number,
      default: 0,
    },
    lifetimeCommission: {
      type: Number,
      default: 0,
    },
    lifetimeGatewayFees: {
      type: Number,
      default: 0,
    },
    lastSettlementAt: {
      type: Date,
      default: null,
    },
    currency: {
      type: String,
      default: 'INR',
    },
  },
  {
    timestamps: true,
  }
);

export const Wallet = mongoose.model('Wallet', walletSchema);
export default Wallet;

