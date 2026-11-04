import RestaurantBankDetails, { maskAccountNumber } from '../models/RestaurantBankDetails.js';
import { Restaurant } from '../models/Restaurant.js';
import { AdminNotification } from '../models/AdminNotification.js';
import { NOTIFICATION_TYPES, AUDIT_ACTIONS } from '../constants/adminConstants.js';
import { sendBankVerificationEmail } from '../utils/emailService.js';
import { logger } from '../utils/logger.js';
import { createAdminNotification, createRestaurantNotification } from './notificationService.js';
import { emitSyncEvent } from '../config/socket.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/**
 * Get or initialize bank details for a restaurant
 */
export const getRestaurantBankDetailsService = async (restaurantId) => {
  let bankDoc = await RestaurantBankDetails.findOne({
    restaurantId,
    isDeleted: false,
  });

  if (!bankDoc) {
    // Check if legacy Restaurant model has any basic bank info
    const restaurant = await Restaurant.findById(restaurantId).lean();
    const legacy = restaurant?.bankDetails || {};

    bankDoc = await RestaurantBankDetails.create({
      restaurantId,
      accountHolderName: legacy.holderName || '',
      bankName: legacy.bankName || '',
      accountNumber: legacy.accountNumber || '',
      ifscCode: legacy.ifscCode ? legacy.ifscCode.toUpperCase() : '',
      upiId: legacy.upiId || '',
      status: legacy.status === 'verified' ? 'approved' : 'draft',
      version: 1,
      auditHistory: [
        {
          who: 'System',
          role: 'SYSTEM',
          action: 'INITIALIZE',
          previousStatus: null,
          newStatus: legacy.status === 'verified' ? 'approved' : 'draft',
          reason: 'Initial bank details profile created',
        },
      ],
    });
  }

  const safeData = bankDoc.toSafeObject();
  safeData.isEditable = ['draft', 'changes_requested', 'rejected'].includes(bankDoc.status);
  return safeData;
};

/**
 * Save draft bank details (does not lock the record)
 */
export const saveRestaurantBankDetailsDraftService = async (restaurantId, data, user, reqMeta = {}) => {
  let bankDoc = await RestaurantBankDetails.findOne({
    restaurantId,
    isDeleted: false,
  });

  if (!bankDoc) {
    bankDoc = new RestaurantBankDetails({ restaurantId });
  }

  if (['submitted', 'under_review'].includes(bankDoc.status)) {
    throw new Error('Bank details are currently locked under review. Editing is disabled until verification is complete.');
  }

  if (bankDoc.status === 'approved') {
    throw new Error('Bank details have already been approved and cannot be directly modified. Please contact platform support.');
  }

  // Update basic fields
  if (data.accountHolderName !== undefined) bankDoc.accountHolderName = String(data.accountHolderName).trim();
  if (data.bankName !== undefined) bankDoc.bankName = String(data.bankName).trim();
  if (data.branchName !== undefined) bankDoc.branchName = String(data.branchName).trim();
  if (data.accountNumber !== undefined && String(data.accountNumber).trim() !== '') {
    bankDoc.accountNumber = String(data.accountNumber).trim();
  }
  if (data.ifscCode !== undefined) {
    bankDoc.ifscCode = String(data.ifscCode).trim().toUpperCase();
  }
  if (data.accountType !== undefined && ['Savings', 'Current'].includes(data.accountType)) {
    bankDoc.accountType = data.accountType;
  }
  if (data.upiId !== undefined) bankDoc.upiId = String(data.upiId).trim().toLowerCase();

  // Update document objects if provided
  if (data.canceledCheque) bankDoc.canceledCheque = data.canceledCheque;
  if (data.passbook) bankDoc.passbook = data.passbook;
  if (data.panCard) bankDoc.panCard = data.panCard;
  if (data.businessProof) bankDoc.businessProof = data.businessProof;

  await bankDoc.save();

  const safeData = bankDoc.toSafeObject();
  safeData.isEditable = true;
  return safeData;
};

/**
 * Submit bank details for official verification
 */
export const submitRestaurantBankDetailsService = async (restaurantId, data, user, reqMeta = {}) => {
  let bankDoc = await RestaurantBankDetails.findOne({
    restaurantId,
    isDeleted: false,
  });

  if (!bankDoc) {
    bankDoc = new RestaurantBankDetails({ restaurantId });
  }

  if (['submitted', 'under_review'].includes(bankDoc.status)) {
    throw new Error('Your bank verification has already been submitted and is currently under review.');
  }

  if (bankDoc.status === 'approved') {
    throw new Error('Your bank details are already verified and approved.');
  }

  // Extract fields
  const accountHolderName = String(data.accountHolderName || bankDoc.accountHolderName || '').trim();
  const bankName = String(data.bankName || bankDoc.bankName || '').trim();
  const branchName = String(data.branchName || bankDoc.branchName || '').trim();
  const accountNumber = String(data.accountNumber || bankDoc.accountNumber || '').trim();
  const confirmAccountNumber = String(data.confirmAccountNumber || '').trim();
  const ifscCode = String(data.ifscCode || bankDoc.ifscCode || '').trim().toUpperCase();
  const accountType = data.accountType || bankDoc.accountType || 'Current';
  const upiId = String(data.upiId || bankDoc.upiId || '').trim().toLowerCase();

  const canceledCheque = data.canceledCheque || bankDoc.canceledCheque;
  const passbook = data.passbook || bankDoc.passbook;
  const panCard = data.panCard || bankDoc.panCard;
  const businessProof = data.businessProof || bankDoc.businessProof;

  // Strict Validation
  if (!accountHolderName || accountHolderName.length < 2) {
    throw new Error('Valid account holder name is required.');
  }
  if (!bankName || bankName.length < 2) {
    throw new Error('Valid bank name is required.');
  }
  if (!accountNumber || accountNumber.length < 6) {
    throw new Error('Valid bank account number is required (min 6 digits).');
  }

  // If user provided raw account number during this submit submission, confirm account number must match
  if (data.accountNumber && (!confirmAccountNumber || confirmAccountNumber !== data.accountNumber)) {
    throw new Error('Account number and Confirm Account number do not match.');
  }

  if (!ifscCode || !IFSC_REGEX.test(ifscCode)) {
    throw new Error('Invalid IFSC Code format. Must be 11 characters (e.g., SBIN0001248).');
  }

  if (!canceledCheque?.url && !passbook?.url) {
    throw new Error('Please upload either a Cancelled Cheque or a Bank Passbook copy for verification.');
  }

  if (!panCard?.url && !businessProof?.url) {
    throw new Error('Please upload either a PAN Card or Business Registration Proof.');
  }

  // Prepare updates
  const previousStatus = bankDoc.status;
  const nextVersion = (bankDoc.version || 1) + (previousStatus === 'changes_requested' || previousStatus === 'rejected' ? 1 : 0);

  bankDoc.accountHolderName = accountHolderName;
  bankDoc.bankName = bankName;
  bankDoc.branchName = branchName;
  bankDoc.accountNumber = accountNumber;
  bankDoc.ifscCode = ifscCode;
  bankDoc.accountType = accountType;
  bankDoc.upiId = upiId;
  bankDoc.canceledCheque = canceledCheque;
  bankDoc.passbook = passbook;
  bankDoc.panCard = panCard;
  bankDoc.businessProof = businessProof;

  bankDoc.status = 'submitted';
  bankDoc.submittedAt = new Date();
  bankDoc.version = nextVersion;

  // Append audit trail
  const whoName = user.name || user.email || 'Restaurant Manager';
  bankDoc.auditHistory.push({
    who: whoName,
    role: 'RESTAURANT',
    action: previousStatus === 'changes_requested' ? 'RESUBMIT_BANK_DETAILS' : 'SUBMIT_BANK_DETAILS',
    previousStatus,
    newStatus: 'submitted',
    reason: previousStatus === 'changes_requested' ? 'Resubmitted updated bank details after admin requested changes' : 'Submitted bank details for payout verification',
    ip: reqMeta.ip || '127.0.0.1',
    browser: reqMeta.browser || '',
    version: nextVersion,
    timestamp: new Date(),
  });

  await bankDoc.save();

  // Fetch restaurant details for notifications
  const restaurant = await Restaurant.findById(restaurantId);

  // Sync basic info to Restaurant model (defensive integrity)
  if (restaurant) {
    restaurant.bankDetails = {
      ...(restaurant.bankDetails || {}),
      holderName: accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      upiId,
      status: 'submitted',
    };
    await restaurant.save();
  }

  // Create Admin Notification & Dispatch Socket Event
  try {
    await createAdminNotification({
      type: NOTIFICATION_TYPES.BANK_SUBMITTED,
      title: 'Bank Verification Submitted',
      message: `${restaurant?.restaurantName || restaurant?.name || 'Restaurant'} submitted bank details for settlement verification (v${nextVersion}).`,
      restaurantId,
      link: `/restaurants/${restaurantId}?tab=bank`,
    });
  } catch (notifErr) {
    logger.warn(`Could not create AdminNotification: ${notifErr.message}`);
  }

  // Real-time synchronization event across both panels
  emitSyncEvent({
    event: SOCKET_EVENTS.RESTAURANT_BANK_UPDATED,
    restaurantId,
    data: {
      status: 'submitted',
      version: nextVersion,
      accountHolderName,
      bankName,
    },
  });

  // Send merchant email notification
  try {
    await sendBankVerificationEmail({
      to: restaurant?.email || user.email,
      restaurantName: restaurant?.name || 'Restaurant',
      status: 'submitted',
      version: nextVersion,
    });
  } catch (emailErr) {
    logger.warn(`Could not send verification email: ${emailErr.message}`);
  }

  const safeData = bankDoc.toSafeObject();
  safeData.isEditable = false;
  return safeData;
};

/**
 * Get status summary for Restaurant Dashboard Status Card
 */
export const getRestaurantBankStatusService = async (restaurantId) => {
  const bankDoc = await RestaurantBankDetails.findOne({
    restaurantId,
    isDeleted: false,
  }).lean();

  if (!bankDoc) {
    return {
      status: 'draft',
      submittedAt: null,
      approvedAt: null,
      approvedByName: '',
      rejectedAt: null,
      rejectedByName: '',
      rejectionReason: '',
      changeRequestReason: '',
      updatedAt: null,
      version: 1,
      isEditable: true,
      hasDetails: false,
    };
  }

  return {
    status: bankDoc.status || 'draft',
    submittedAt: bankDoc.submittedAt || null,
    approvedAt: bankDoc.approvedAt || null,
    approvedByName: bankDoc.approvedByName || '',
    rejectedAt: bankDoc.rejectedAt || null,
    rejectedByName: bankDoc.rejectedByName || '',
    rejectionReason: bankDoc.rejectionReason || '',
    changeRequestReason: bankDoc.changeRequestReason || '',
    updatedAt: bankDoc.updatedAt || null,
    version: bankDoc.version || 1,
    isEditable: ['draft', 'changes_requested', 'rejected'].includes(bankDoc.status),
    hasDetails: true,
  };
};

/**
 * Admin: Get complete bank details for a restaurant with masked account number & audit history
 */
export const adminGetRestaurantBankDetailsService = async (restaurantId) => {
  let bankDoc = await RestaurantBankDetails.findOne({
    restaurantId,
    isDeleted: false,
  });

  if (!bankDoc) {
    const restaurant = await Restaurant.findById(restaurantId).lean();
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }
    const legacy = restaurant.bankDetails || {};
    bankDoc = await RestaurantBankDetails.create({
      restaurantId,
      accountHolderName: legacy.holderName || '',
      bankName: legacy.bankName || '',
      accountNumber: legacy.accountNumber || '',
      ifscCode: legacy.ifscCode ? legacy.ifscCode.toUpperCase() : '',
      upiId: legacy.upiId || '',
      status: legacy.status === 'verified' ? 'approved' : 'draft',
      version: 1,
      auditHistory: [
        {
          who: 'System',
          role: 'SYSTEM',
          action: 'INITIALIZE',
          previousStatus: null,
          newStatus: legacy.status === 'verified' ? 'approved' : 'draft',
          reason: 'Initial bank details generated',
        },
      ],
    });
  }

  const safeData = bankDoc.toSafeObject();
  // Sort audit history descending (newest first)
  safeData.auditHistory = (safeData.auditHistory || []).slice().reverse();
  return safeData;
};

/**
 * Admin: Approve Bank Details
 */
export const adminApproveBankDetailsService = async (restaurantId, adminUser, reqMeta = {}) => {
  const bankDoc = await RestaurantBankDetails.findOne({
    restaurantId,
    isDeleted: false,
  });

  if (!bankDoc) {
    throw new Error('Restaurant bank details record not found.');
  }

  const previousStatus = bankDoc.status;
  const adminName = adminUser.name || adminUser.email || 'Admin Compliance Officer';

  bankDoc.status = 'approved';
  bankDoc.approvedAt = new Date();
  bankDoc.approvedBy = adminUser._id;
  bankDoc.approvedByName = adminName;
  bankDoc.rejectionReason = '';
  bankDoc.changeRequestReason = '';

  bankDoc.auditHistory.push({
    who: adminName,
    role: adminUser.role || 'SUPER_ADMIN',
    action: AUDIT_ACTIONS.APPROVE_BANK,
    previousStatus,
    newStatus: 'approved',
    reason: 'Bank verification verified and approved for automated settlements',
    ip: reqMeta.ip || '127.0.0.1',
    browser: reqMeta.browser || '',
    version: bankDoc.version || 1,
    timestamp: new Date(),
  });

  await bankDoc.save();

  // Sync to Restaurant model & unlock payouts
  const restaurant = await Restaurant.findById(restaurantId);
  if (restaurant) {
    restaurant.bankDetails = {
      ...(restaurant.bankDetails || {}),
      holderName: bankDoc.accountHolderName,
      bankName: bankDoc.bankName,
      accountNumber: bankDoc.accountNumber,
      ifscCode: bankDoc.ifscCode,
      upiId: bankDoc.upiId,
      status: 'verified',
      approvedBy: adminUser._id,
      approvedAt: new Date(),
      rejectionReason: '',
    };
    restaurant.paymentEnabled = true;
    await restaurant.save();
  }

  // Send email to restaurant
  try {
    await sendBankVerificationEmail({
      to: restaurant?.email,
      restaurantName: restaurant?.name || 'Restaurant',
      status: 'approved',
      version: bankDoc.version,
    });
  } catch (emailErr) {
    logger.warn(`Could not send approval email: ${emailErr.message}`);
  }

  // Phase 4.2: Dispatch Restaurant In-App Notification & Socket.IO Event
  await createRestaurantNotification({
    restaurantId,
    type: 'APPROVAL',
    title: 'Settlement Account Verified',
    message: 'Your bank account has been approved and activated for automated daily revenue payouts.',
    link: '/settings?tab=settlement',
  });

  emitSyncEvent({
    event: SOCKET_EVENTS.RESTAURANT_BANK_UPDATED,
    restaurantId,
    data: {
      status: 'approved',
      approvedByName: adminName,
      approvedAt: bankDoc.approvedAt,
    },
  });

  const safeData = bankDoc.toSafeObject();
  safeData.auditHistory = (safeData.auditHistory || []).slice().reverse();
  return safeData;
};

/**
 * Admin: Reject Bank Details Application
 */
export const adminRejectBankDetailsService = async (restaurantId, { reason }, adminUser, reqMeta = {}) => {
  if (!reason || !String(reason).trim()) {
    throw new Error('A mandatory rejection reason is required.');
  }

  const bankDoc = await RestaurantBankDetails.findOne({
    restaurantId,
    isDeleted: false,
  });

  if (!bankDoc) {
    throw new Error('Restaurant bank details record not found.');
  }

  const previousStatus = bankDoc.status;
  const adminName = adminUser.name || adminUser.email || 'Admin Compliance Officer';
  const cleanReason = String(reason).trim();

  bankDoc.status = 'rejected';
  bankDoc.rejectedAt = new Date();
  bankDoc.rejectedBy = adminUser._id;
  bankDoc.rejectedByName = adminName;
  bankDoc.rejectionReason = cleanReason;

  bankDoc.auditHistory.push({
    who: adminName,
    role: adminUser.role || 'SUPER_ADMIN',
    action: AUDIT_ACTIONS.REJECT_BANK,
    previousStatus,
    newStatus: 'rejected',
    reason: cleanReason,
    ip: reqMeta.ip || '127.0.0.1',
    browser: reqMeta.browser || '',
    version: bankDoc.version || 1,
    timestamp: new Date(),
  });

  await bankDoc.save();

  // Sync to Restaurant model
  const restaurant = await Restaurant.findById(restaurantId);
  if (restaurant) {
    restaurant.bankDetails = {
      ...(restaurant.bankDetails || {}),
      status: 'rejected',
      rejectionReason: cleanReason,
    };
    await restaurant.save();
  }

  // Send rejection email
  try {
    await sendBankVerificationEmail({
      to: restaurant?.email,
      restaurantName: restaurant?.name || 'Restaurant',
      status: 'rejected',
      reason: cleanReason,
      version: bankDoc.version,
    });
  } catch (emailErr) {
    logger.warn(`Could not send rejection email: ${emailErr.message}`);
  }

  // Phase 4.2: Dispatch In-App Notification & Socket Event
  await createRestaurantNotification({
    restaurantId,
    type: 'REJECTION',
    title: 'Bank Verification Rejected',
    message: cleanReason,
    link: '/settings?tab=settlement',
  });

  emitSyncEvent({
    event: SOCKET_EVENTS.RESTAURANT_BANK_UPDATED,
    restaurantId,
    data: {
      status: 'rejected',
      rejectionReason: cleanReason,
    },
  });

  const safeData = bankDoc.toSafeObject();
  safeData.auditHistory = (safeData.auditHistory || []).slice().reverse();
  return safeData;
};

/**
 * Admin: Request Changes to Bank Details
 */
export const adminRequestChangesBankDetailsService = async (restaurantId, { reason }, adminUser, reqMeta = {}) => {
  if (!reason || !String(reason).trim()) {
    throw new Error('A mandatory reason explaining the required changes is required.');
  }

  const bankDoc = await RestaurantBankDetails.findOne({
    restaurantId,
    isDeleted: false,
  });

  if (!bankDoc) {
    throw new Error('Restaurant bank details record not found.');
  }

  const previousStatus = bankDoc.status;
  const adminName = adminUser.name || adminUser.email || 'Admin Compliance Officer';
  const cleanReason = String(reason).trim();

  bankDoc.status = 'changes_requested';
  bankDoc.changeRequestReason = cleanReason;

  bankDoc.auditHistory.push({
    who: adminName,
    role: adminUser.role || 'SUPER_ADMIN',
    action: AUDIT_ACTIONS.REQUEST_BANK_CHANGES,
    previousStatus,
    newStatus: 'changes_requested',
    reason: cleanReason,
    ip: reqMeta.ip || '127.0.0.1',
    browser: reqMeta.browser || '',
    version: bankDoc.version || 1,
    timestamp: new Date(),
  });

  await bankDoc.save();

  // Sync to Restaurant model
  const restaurant = await Restaurant.findById(restaurantId);
  if (restaurant) {
    restaurant.bankDetails = {
      ...(restaurant.bankDetails || {}),
      status: 'changes_requested',
    };
    await restaurant.save();
  }

  // Send email to restaurant
  try {
    await sendBankVerificationEmail({
      to: restaurant?.email,
      restaurantName: restaurant?.name || 'Restaurant',
      status: 'changes_requested',
      reason: cleanReason,
      version: bankDoc.version,
    });
  } catch (emailErr) {
    logger.warn(`Could not send changes requested email: ${emailErr.message}`);
  }

  // Phase 4.2: Dispatch In-App Notification & Socket Event
  await createRestaurantNotification({
    restaurantId,
    type: 'VERIFICATION',
    title: 'Bank Details Revision Required',
    message: cleanReason,
    link: '/settings?tab=settlement',
  });

  emitSyncEvent({
    event: SOCKET_EVENTS.RESTAURANT_BANK_UPDATED,
    restaurantId,
    data: {
      status: 'changes_requested',
      changeRequestReason: cleanReason,
    },
  });

  const safeData = bankDoc.toSafeObject();
  safeData.auditHistory = (safeData.auditHistory || []).slice().reverse();
  return safeData;
};
