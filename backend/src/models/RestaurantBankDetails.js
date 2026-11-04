import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true, default: '' },
    publicId: { type: String, trim: true, default: '' },
    fileName: { type: String, trim: true, default: '' },
    fileType: { type: String, trim: true, default: '' },
    fileSize: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const auditEntrySchema = new mongoose.Schema(
  {
    who: { type: String, required: true, trim: true },
    role: { type: String, default: 'RESTAURANT', trim: true },
    action: { type: String, required: true, trim: true },
    previousStatus: { type: String, trim: true },
    newStatus: { type: String, trim: true },
    reason: { type: String, trim: true, default: '' },
    ip: { type: String, trim: true, default: '127.0.0.1' },
    browser: { type: String, trim: true, default: '' },
    version: { type: Number, default: 1 },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const restaurantBankDetailsSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      unique: true,
      index: true,
    },
    accountHolderName: {
      type: String,
      trim: true,
      default: '',
    },
    bankName: {
      type: String,
      trim: true,
      default: '',
    },
    branchName: {
      type: String,
      trim: true,
      default: '',
    },
    accountNumber: {
      type: String,
      trim: true,
      default: '',
    },
    ifscCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    accountType: {
      type: String,
      enum: ['Savings', 'Current'],
      default: 'Current',
    },
    upiId: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    // Verification Documents
    canceledCheque: {
      type: documentSchema,
      default: () => ({}),
    },
    passbook: {
      type: documentSchema,
      default: () => ({}),
    },
    panCard: {
      type: documentSchema,
      default: () => ({}),
    },
    businessProof: {
      type: documentSchema,
      default: () => ({}),
    },
    // Verification State Machine
    status: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'approved', 'changes_requested', 'rejected'],
      default: 'draft',
      index: true,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    approvedByName: {
      type: String,
      default: '',
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    rejectedByName: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    changeRequestReason: {
      type: String,
      default: '',
    },
    version: {
      type: Number,
      default: 1,
    },
    auditHistory: [auditEntrySchema],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Helper to mask account numbers safely (Never expose full account numbers to clients)
restaurantBankDetailsSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  const rawAcc = obj.accountNumber ? String(obj.accountNumber).trim() : '';
  const last4 = rawAcc.length >= 4 ? rawAcc.slice(-4) : '••••';
  obj.maskedAccountNumber = rawAcc ? `•••• •••• •••• ${last4}` : 'Not provided';
  // Strip raw account number completely from the response
  delete obj.accountNumber;
  return obj;
};

export const maskAccountNumber = (accountNumber) => {
  if (!accountNumber) return 'Not provided';
  const raw = String(accountNumber).trim();
  const last4 = raw.length >= 4 ? raw.slice(-4) : '••••';
  return `•••• •••• •••• ${last4}`;
};

export const RestaurantBankDetails = mongoose.model('RestaurantBankDetails', restaurantBankDetailsSchema);
export default RestaurantBankDetails;

