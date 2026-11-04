import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ADMIN_ROLES, ADMIN_STATUS, MAX_LOGIN_ATTEMPTS, LOCK_TIME_MS } from '../constants/adminConstants.js';

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(ADMIN_ROLES),
      default: ADMIN_ROLES.ADMIN,
      index: true,
    },
    permissions: [{ type: String }],
    avatar: {
      type: String,
      default: '',
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    lastPasswordChangedAt: {
      type: Date,
      default: Date.now,
    },
    lastLoginIp: {
      type: String,
      default: '',
    },
    lastLoginUserAgent: {
      type: String,
      default: '',
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(ADMIN_STATUS),
      default: ADMIN_STATUS.ACTIVE,
      index: true,
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

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if locked
adminSchema.methods.isLocked = function () {
  return Boolean(this.lockUntil && this.lockUntil > Date.now());
};

// Increment failed attempts & lock if exceeded
adminSchema.methods.incLoginAttempts = async function () {
  // If previous lock expired, reset attempts to 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { failedLoginAttempts: 1 } };
  if (this.failedLoginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + LOCK_TIME_MS) };
  }
  return this.updateOne(updates);
};

// Reset login attempts on successful login
adminSchema.methods.resetLoginAttempts = async function (ip = '', userAgent = '') {
  return this.updateOne({
    $set: {
      failedLoginAttempts: 0,
      lastLogin: new Date(),
      lastLoginIp: ip,
      lastLoginUserAgent: userAgent,
    },
    $unset: { lockUntil: 1 },
  });
};

export const Admin = mongoose.model('Admin', adminSchema);

