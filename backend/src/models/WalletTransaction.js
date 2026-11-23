import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      index: true,
    },
    type: {
      type: String,
      enum: [
        'credit',
        'debit',
        'adjustment',
        'refund',
        'subscription',
        'settlement',
        'commission',
        'gateway_fee',
      ],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    openingBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    closingBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    referenceId: {
      type: String,
      default: '',
      index: true,
    },
    referenceModel: {
      type: String,
      default: '',
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: String,
      default: 'system',
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

walletTransactionSchema.index({ restaurantId: 1, createdAt: -1 });

export const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
export default WalletTransaction;

