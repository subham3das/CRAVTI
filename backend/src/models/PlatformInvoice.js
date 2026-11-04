import mongoose from 'mongoose';
import { INVOICE_STATUS } from '../constants/adminConstants.js';

const platformInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    plan: {
      type: String,
      default: 'starter',
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: Object.values(INVOICE_STATUS),
      default: INVOICE_STATUS.PAID,
      index: true,
    },
    paymentMethod: {
      type: String,
      default: 'Razorpay / UPI',
    },
    transactionId: {
      type: String,
      default: '',
    },
    billingPeriod: {
      start: { type: Date, default: Date.now },
      end: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    },
    dueDate: {
      type: Date,
      default: Date.now,
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const PlatformInvoice = mongoose.model('PlatformInvoice', platformInvoiceSchema);

