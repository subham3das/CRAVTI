import mongoose from 'mongoose';

const qrCodeSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: true,
      index: true,
    },
    tableNumber: {
      type: Number,
      required: true,
    },
    qrToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    qrUrl: {
      type: String,
      required: true,
      trim: true,
    },
    qrCode: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    scansCount: {
      type: Number,
      default: 0,
    },
    lastScannedAt: {
      type: Date,
      default: null,
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
  },
  { timestamps: true }
);

// CRITICAL: Compound unique index on (restaurantId, tableId)
// A restaurant can have many tables and QR codes. Each table has at most one active QR code.
qrCodeSchema.index(
  { restaurantId: 1, tableId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

// Unique tableNumber per restaurant for active QR codes
qrCodeSchema.index(
  { restaurantId: 1, tableNumber: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

qrCodeSchema.index({ restaurantId: 1, isActive: 1, isDeleted: 1 });

export const QRCodeModel = mongoose.model('QRCode', qrCodeSchema);
export default QRCodeModel;

