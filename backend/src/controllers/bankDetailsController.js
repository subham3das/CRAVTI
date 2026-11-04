import asyncHandler from '../utils/asyncHandler.js';
import {
  getRestaurantBankDetailsService,
  saveRestaurantBankDetailsDraftService,
  submitRestaurantBankDetailsService,
  getRestaurantBankStatusService,
} from '../services/bankDetailsService.js';

export const getBankDetails = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurantId || req.restaurant?._id;
  const data = await getRestaurantBankDetailsService(restaurantId);

  res.status(200).json({
    success: true,
    data,
  });
});

export const saveBankDetailsDraft = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurantId || req.restaurant?._id;
  const reqMeta = {
    ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    browser: req.headers['user-agent'] || '',
  };

  const data = await saveRestaurantBankDetailsDraftService(
    restaurantId,
    req.body,
    req.user,
    reqMeta
  );

  res.status(200).json({
    success: true,
    message: 'Bank details draft saved successfully',
    data,
  });
});

export const submitBankDetails = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurantId || req.restaurant?._id;
  const reqMeta = {
    ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    browser: req.headers['user-agent'] || '',
  };

  const data = await submitRestaurantBankDetailsService(
    restaurantId,
    req.body,
    req.user,
    reqMeta
  );

  res.status(200).json({
    success: true,
    message: 'Bank details submitted for verification successfully',
    data,
  });
});

export const getBankStatus = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurantId || req.restaurant?._id;
  const data = await getRestaurantBankStatusService(restaurantId);

  res.status(200).json({
    success: true,
    data,
  });
});

export const uploadBankDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No document file uploaded. Supported formats: JPEG, PNG, WEBP, PDF up to 10MB.',
    });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({
    success: true,
    message: 'Document uploaded successfully',
    data: {
      url: fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedAt: new Date(),
    },
  });
});

