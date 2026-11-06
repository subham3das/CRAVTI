import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import { sendContactEmail } from '../services/emailService.js';

export const submitContactInquiry = asyncHandler(async (req, res) => {
  const { name, email, phone, restaurant, tables, subject, message } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    const error = new Error('Your name is required');
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
    throw error;
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    const error = new Error('A valid email address is required');
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
    throw error;
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    const error = new Error('Message content is required');
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
    throw error;
  }

  const clientIp =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    '';

  const result = await sendContactEmail({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? String(phone).trim() : '',
    restaurant: restaurant ? String(restaurant).trim() : '',
    tables: tables ? String(tables).trim() : '',
    subject: subject ? String(subject).trim() : '',
    message: message.trim(),
    ip: clientIp,
  });

  return sendSuccess(
    res,
    'Thank you! Your message has been sent successfully.',
    result,
    HTTP_STATUS.OK
  );
});
