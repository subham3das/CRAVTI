import mongoose from 'mongoose';

const platformBackupSchema = new mongoose.Schema(
  {
    backupId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
    },
    sizeBytes: {
      type: Number,
      default: 0,
    },
    collections: [{ type: String }],
    recordCounts: {
      type: Map,
      of: Number,
      default: {},
    },
    status: {
      type: String,
      enum: ['completed', 'in_progress', 'failed'],
      default: 'completed',
    },
    createdBy: {
      type: String,
      default: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

export const PlatformBackup = mongoose.model('PlatformBackup', platformBackupSchema);

