import mongoose from 'mongoose';
import { TICKET_PRIORITY, TICKET_CATEGORY, TICKET_STATUS } from '../constants/adminConstants.js';

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
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
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: Object.values(TICKET_CATEGORY),
      default: TICKET_CATEGORY.BUG,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(TICKET_PRIORITY),
      default: TICKET_PRIORITY.MEDIUM,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(TICKET_STATUS),
      default: TICKET_STATUS.OPEN,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    assignedAdminName: {
      type: String,
      default: 'Unassigned',
    },
    messages: [
      {
        sender: {
          type: String,
          enum: ['restaurant', 'admin'],
          required: true,
        },
        senderName: { type: String, default: '' },
        senderEmail: { type: String, default: '' },
        message: { type: String, required: true },
        attachments: [{ type: String }],
        createdAt: { type: Date, default: Date.now },
      },
    ],
    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: String, default: 'Admin' },
        timestamp: { type: Date, default: Date.now },
        notes: { type: String, default: '' },
      },
    ],
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

