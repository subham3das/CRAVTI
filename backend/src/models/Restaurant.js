import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema(
  {
    restaurantName: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
    },
    logo: {
      url: {
        type: String,
        default: '',
      },
      public_id: {
        type: String,
        default: '',
      },
    },
    coverImage: {
      url: {
        type: String,
        default: '',
      },
      public_id: {
        type: String,
        default: '',
      },
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
    },
    ownerPhone: {
      type: String,
      required: [true, 'Owner phone is required'],
      trim: true,
    },
    address: {
      street: { type: String, default: '', trim: true },
      city: { type: String, default: '', trim: true },
      state: { type: String, default: '', trim: true },
      pincode: { type: String, default: '', trim: true },
    },
    timing: {
      openingTime: { type: String, default: '10:00 AM' },
      closingTime: { type: String, default: '11:00 PM' },
    },
    taxInfo: {
      gstNumber: { type: String, default: '', trim: true },
      fssaiNumber: { type: String, default: '', trim: true },
    },
    bankDetails: {
      holderName: { type: String, default: '', trim: true },
      bankName: { type: String, default: '', trim: true },
      accountNumber: { type: String, default: '', trim: true },
      ifscCode: { type: String, default: '', trim: true },
      upiId: { type: String, default: '', trim: true },
      status: {
        type: String,
        enum: ['pending', 'submitted', 'verified', 'rejected', 'changes_requested'],
        default: 'pending',
      },
      approvedBy: { type: String, default: '' },
      approvedAt: { type: Date, default: null },
      rejectionReason: { type: String, default: '' },
    },
    profileCompleted: {
      type: Boolean,
      default: true,
    },
    paymentEnabled: {
      type: Boolean,
      default: false,
    },
    qrEnabled: {
      type: Boolean,
      default: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'submitted', 'under_review', 'verified', 'rejected', 'changes_requested'],
      default: 'pending',
    },
    verificationDetails: {
      verifiedBy: { type: String, default: '' },
      verifiedAt: { type: Date, default: null },
      reviewNotes: { type: String, default: '' },
      rejectionReason: { type: String, default: '' },
      requestedChanges: { type: String, default: '' },
    },
    verificationHistory: [
      {
        status: { type: String, required: true },
        actor: { type: String, default: 'Admin' },
        timestamp: { type: Date, default: Date.now },
        notes: { type: String, default: '' },
        reason: { type: String, default: '' },
      },
    ],
    profileCompletionPercentage: {
      type: Number,
      default: 40,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RestaurantUser',
      required: true,
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

restaurantSchema.index({ slug: 1, isDeleted: 1 });
restaurantSchema.index({ ownerPhone: 1, isDeleted: 1 });
restaurantSchema.index({ createdBy: 1, isDeleted: 1 });

export const Restaurant = mongoose.model('Restaurant', restaurantSchema);

