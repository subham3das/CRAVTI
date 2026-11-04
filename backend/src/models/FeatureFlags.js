import mongoose from 'mongoose';

const featureFlagsSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      unique: true,
      index: true,
    },
    qrEnabled: {
      type: Boolean,
      default: true,
    },
    onlinePaymentEnabled: {
      type: Boolean,
      default: true,
    },
    onlinePaymentsEnabled: {
      type: Boolean,
      default: true,
    },
    analyticsEnabled: {
      type: Boolean,
      default: true,
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
    receiptEnabled: {
      type: Boolean,
      default: true,
    },
    settingsEnabled: {
      type: Boolean,
      default: true,
    },
    futureModules: {
      type: Map,
      of: Boolean,
      default: {},
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
  }
);

// Helper to get or create defaults
featureFlagsSchema.statics.getFlagsForRestaurant = async function (restaurantId) {
  let flags = await this.findOne({ restaurantId, isDeleted: false });
  if (!flags) {
    flags = await this.create({ restaurantId });
  }
  return flags;
};

export const FeatureFlags = mongoose.model('FeatureFlags', featureFlagsSchema);
export default FeatureFlags;

