import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    module: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export const Permission = mongoose.model('Permission', permissionSchema);

