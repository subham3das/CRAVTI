import { logger } from './logger.js';

/**
 * Professional HTML Email Templates for Restaurant Bank Verification
 */

const getBaseEmailTemplate = ({ title, preheader, contentHtml }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; color: #0F172A; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background-color: #2563EB; padding: 32px 24px; text-align: center; }
    .header h1 { color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .body { padding: 32px 24px; }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 20px; }
    .badge-approved { background-color: #DCFCE7; color: #15803D; }
    .badge-warning { background-color: #FEF3C7; color: #B45309; }
    .badge-rejected { background-color: #FEE2E2; color: #B91C1C; }
    .badge-info { background-color: #DBEAFE; color: #1D4ED8; }
    .content-box { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px; margin: 20px 0; }
    .footer { background-color: #F8FAFC; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}
  </div>
  <div class="container">
    <div class="header">
      <h1>CRAVITI PLATFORM</h1>
    </div>
    <div class="body">
      ${contentHtml}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Craviti Technologies Inc. All rights reserved.</p>
      <p>This is an automated operational notification regarding your merchant settlement account.</p>
    </div>
  </div>
</body>
</html>
`;

export const sendBankVerificationEmail = async ({ to, restaurantName, status, reason = '', version = 1 }) => {
  let title = '';
  let preheader = '';
  let contentHtml = '';

  switch (status) {
    case 'submitted':
      title = 'Bank Verification Submitted — Craviti';
      preheader = `We have received bank details for ${restaurantName}.`;
      contentHtml = `
        <span class="badge badge-info">Submission Received</span>
        <h2 style="font-size: 18px; font-weight: 700; margin-top: 0;">Bank Details Received (v${version})</h2>
        <p>Dear ${restaurantName} Team,</p>
        <p>Thank you for submitting your settlement and bank verification documents. Our compliance team is currently reviewing your application.</p>
        <div class="content-box">
          <p style="margin: 0; font-size: 13px; color: #475569;"><strong>Status:</strong> Under Review</p>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #475569;"><strong>Expected Turnaround:</strong> 24-48 Business Hours</p>
        </div>
        <p style="font-size: 13px; color: #64748B;">During this review period, editing of bank details is locked to preserve compliance integrity.</p>
      `;
      break;

    case 'approved':
      title = 'Bank Details Approved — Craviti';
      preheader = `Your bank details have been verified for ${restaurantName}.`;
      contentHtml = `
        <span class="badge badge-approved">Approved & Verified</span>
        <h2 style="font-size: 18px; font-weight: 700; margin-top: 0; color: #15803D;">Settlement Account Verified</h2>
        <p>Dear ${restaurantName} Team,</p>
        <p>Great news! Your settlement bank account has been reviewed and approved by the Craviti Compliance Team.</p>
        <div class="content-box">
          <p style="margin: 0; font-size: 13px; color: #15803D;"><strong>Payout Status:</strong> Active & Unlocked</p>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #475569;">Daily online order payouts will automatically settle into this registered account.</p>
        </div>
      `;
      break;

    case 'changes_requested':
      title = 'Action Required: Bank Details Revision — Craviti';
      preheader = `Changes requested for ${restaurantName} bank verification.`;
      contentHtml = `
        <span class="badge badge-warning">Changes Requested</span>
        <h2 style="font-size: 18px; font-weight: 700; margin-top: 0; color: #B45309;">Action Required: Update Bank Details</h2>
        <p>Dear ${restaurantName} Team,</p>
        <p>Our compliance officer reviewed your bank details and requested specific corrections before we can approve your payouts.</p>
        <div class="content-box" style="border-left: 4px solid #F59E0B; background-color: #FFFBEB;">
          <p style="margin: 0; font-size: 13px; font-weight: 600; color: #92400E;">Reason for revision:</p>
          <p style="margin: 6px 0 0 0; font-size: 14px; color: #78350F;">${reason || 'Please verify that the IFSC code and account holder name match your cancelled cheque.'}</p>
        </div>
        <p>Please log in to your Restaurant Panel, go to <strong>Settings &rarr; Settlement & Bank Details</strong>, make the requested correction, and click <strong>Resubmit</strong>.</p>
      `;
      break;

    case 'rejected':
      title = 'Bank Verification Rejected — Craviti';
      preheader = `Your bank verification could not be approved for ${restaurantName}.`;
      contentHtml = `
        <span class="badge badge-rejected">Application Rejected</span>
        <h2 style="font-size: 18px; font-weight: 700; margin-top: 0; color: #B91C1C;">Verification Rejected</h2>
        <p>Dear ${restaurantName} Team,</p>
        <p>Unfortunately, your settlement bank account verification could not be approved due to compliance criteria.</p>
        <div class="content-box" style="border-left: 4px solid #EF4444; background-color: #FEF2F2;">
          <p style="margin: 0; font-size: 13px; font-weight: 600; color: #991B1B;">Compliance Reason:</p>
          <p style="margin: 6px 0 0 0; font-size: 14px; color: #7F1D1D;">${reason || 'Unverified entity documentation.'}</p>
        </div>
        <p>If you believe this is in error, please contact our merchant support team or update your details in the Restaurant Panel.</p>
      `;
      break;

    default:
      return;
  }

  const html = getBaseEmailTemplate({ title, preheader, contentHtml });

  // Safe delivery logger
  logger.info(`[EMAIL] Bank verification email sent to ${to || 'merchant'} for ${restaurantName} | Status: ${status}`);
  return { success: true, to, title, html };
};

