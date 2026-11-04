import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant ID is required'],
      index: true,
    },
    categoryName: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [60, 'Category name cannot exceed 60 characters'],
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
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
    timestamps: { createdAt: true, updatedAt: true },
  }
);

// Prevent duplicate active category names for the same restaurant
categorySchema.index({ restaurantId: 1, categoryName: 1, isDeleted: 1 });
categorySchema.index({ restaurantId: 1, isDeleted: 1, displayOrder: 1 });

export const Category = mongoose.model('Category', categorySchema);

