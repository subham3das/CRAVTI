import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    tableNumber: {
      type: Number,
      required: true,
    },
    tableName: {
      type: String,
      default: '',
      trim: true,
    },
    floor: {
      type: String,
      default: 'Ground Floor',
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      default: 4,
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'disabled'],
      default: 'available',
    },
    qrCode: {
      type: String,
      default: '',
    },
    qrUrl: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    occupiedAt: {
      type: Date,
      default: null,
    },
    vacatedAt: {
      type: Date,
      default: null,
    },
    currentOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    currentGuestSessionId: {
      type: String,
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
    deletedBy: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

tableSchema.index({ restaurantId: 1, tableNumber: 1 });
tableSchema.index({ restaurantId: 1, status: 1, isDeleted: 1 });
tableSchema.index({ restaurantId: 1, currentOrderId: 1 });
tableSchema.index({ restaurantId: 1, isDeleted: 1 });

export const Table = mongoose.model('Table', tableSchema);

