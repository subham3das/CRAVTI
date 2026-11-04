import mongoose from 'mongoose';

const businessDaySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    openTime: {
      type: String,
      default: '09:00',
    },
    closeTime: {
      type: String,
      default: '22:00',
    },
  },
  { _id: false }
);

const defaultSchedule = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
].map((day) => ({
  day,
  isOpen: true,
  openTime: '09:00',
  closeTime: '22:00',
}));

const restaurantSettingsSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      unique: true,
      index: true,
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
      trim: true,
    },
    language: {
      type: String,
      default: 'en',
      trim: true,
    },
    estimatedPreparationTime: {
      type: Number,
      default: 15,
      min: 1,
      max: 180,
    },
    // Tax Settings (Do NOT hardcode GST)
    gstEnabled: {
      type: Boolean,
      default: true,
    },
    gstPercentage: {
      type: Number,
      default: 5,
      min: 0,
      max: 100,
    },
    // Service Charge
    serviceChargeEnabled: {
      type: Boolean,
      default: false,
    },
    serviceChargeType: {
      type: String,
      enum: ['percentage', 'flat'],
      default: 'percentage',
    },
    serviceChargeValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Operations & Order Locking
    autoCompleteOrder: {
      type: Boolean,
      default: true,
    },
    autoLockServedOrder: {
      type: Boolean,
      default: true,
    },
    restaurantStatus: {
      type: String,
      enum: ['open', 'busy', 'pause_orders', 'closed'],
      default: 'open',
      index: true,
    },
    acceptOrders: {
      type: Boolean,
      default: true,
    },
    // Receipt Config
    receiptPrefix: {
      type: String,
      default: 'CRV',
      trim: true,
      maxlength: 5,
    },
    receiptFooter: {
      type: String,
      default: 'Thank you for dining with us. Please visit again!',
      trim: true,
    },
    // Notifications
    notificationSound: {
      type: Boolean,
      default: true,
    },
    desktopNotification: {
      type: Boolean,
      default: true,
    },
    notificationVolume: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
    },
    // Business Hours
    businessHours: {
      type: [businessDaySchema],
      default: defaultSchedule,
    },
    // Payments
    payments: {
      cashEnabled: {
        type: Boolean,
        default: true,
      },
      onlineEnabled: {
        type: Boolean,
        default: true,
      },
      razorpay: {
        provider: {
          type: String,
          default: 'razorpay',
        },
        apiStatus: {
          type: String,
          enum: ['disabled', 'configured', 'active'],
          default: 'disabled',
        },
        webhookStatus: {
          type: String,
          enum: ['disabled', 'verified'],
          default: 'disabled',
        },
        keyId: {
          type: String,
          default: '',
        },
      },
    },
    settingsVersion: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

export const RestaurantSettings = mongoose.model('RestaurantSettings', restaurantSettingsSchema);

