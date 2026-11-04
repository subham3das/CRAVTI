import {
  registerUserService,
  loginUserService,
  getCurrentUserService,
} from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';

export const signup = asyncHandler(async (req, res) => {
  const { email, phone, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Passwords do not match.',
      error: 'VALIDATION_ERROR',
    });
  }

  const result = await registerUserService({ email, phone, password });
  return sendSuccess(
    res,
    'Account created successfully. Please complete restaurant onboarding.',
    result,
    HTTP_STATUS.CREATED,
    { data: result }
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await loginUserService({ email, password });
  return sendSuccess(res, 'Login successful.', result, HTTP_STATUS.OK, { data: result });
});

export const getMe = asyncHandler(async (req, res) => {
  const result = await getCurrentUserService(req.user._id);
  return sendSuccess(res, 'Current user profile fetched', result, HTTP_STATUS.OK, { data: result });
});
