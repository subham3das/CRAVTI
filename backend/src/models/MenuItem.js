import mongoose from 'mongoose';
import { normalizeImage } from '../utils/imageUtils.js';

const menuItemSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant ID is required'],
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [100, 'Item name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    image: {
      type: {
        url: {
          type: String,
          default: '',
        },
        public_id: {
          type: String,
          default: '',
        },
      },
      default: () => ({ url: '', public_id: '' }),
      set: (val) => normalizeImage(val),
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be greater than or equal to 0'],
    },
    discountType: {
      type: String,
      enum: ['none', 'percentage', 'flat'],
      default: 'none',
    },
    discountValue: {
      type: Number,
      default: 0,
      min: [0, 'Discount value cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price must be greater than or equal to 0'],
    },
    foodType: {
      type: String,
      enum: ['veg', 'non-veg', 'egg'],
      default: 'veg',
    },
    availability: {
      type: String,
      enum: ['available', 'out_of_stock'],
      default: 'available',
    },
    preparationTime: {
      type: Number,
      default: 15,
      min: [1, 'Preparation time must be at least 1 minute'],
    },
    popular: {
      type: Boolean,
      default: false,
    },
    recommended: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
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

menuItemSchema.index({ restaurantId: 1, itemName: 1 });
menuItemSchema.index({ restaurantId: 1, categoryId: 1, isDeleted: 1 });
menuItemSchema.index({ restaurantId: 1, availability: 1, isDeleted: 1 });
menuItemSchema.index({ restaurantId: 1, isDeleted: 1, createdAt: -1 });

// Migration layer: ensure legacy docs with string image convert to { url, public_id } seamlessly
menuItemSchema.post('init', function (doc) {
  if (doc && typeof doc.image === 'string') {
    doc.image = { url: doc.image, public_id: '' };
  } else if (doc && (!doc.image || typeof doc.image !== 'object')) {
    doc.image = { url: '', public_id: '' };
  }
});

menuItemSchema.pre('save', function (next) {
  if (this.image) {
    this.image = normalizeImage(this.image);
  }
  next();
});

export const MenuItem = mongoose.model('MenuItem', menuItemSchema);

