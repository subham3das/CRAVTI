import { Restaurant } from '../models/Restaurant.js';
import { RestaurantUser } from '../models/RestaurantUser.js';
import { uploadImageToCloudinary } from './cloudinaryService.js';
import { calculateProfileCompletion } from '../utils/profileCalculator.js';

export const createOnboardingRestaurant = async (userId, data, logoFile) => {
  // Check if restaurant already exists for this owner
  const existing = await Restaurant.findOne({ createdBy: userId });
  if (existing) {
    const error = new Error('Restaurant already created for this account.');
    error.statusCode = 400;
    throw error;
  }

  let logoData = { url: '', public_id: '' };
  if (logoFile) {
    const uploaded = await uploadImageToCloudinary(logoFile, 'craviti/logos');
    if (uploaded) logoData = uploaded;
  }

  // Generate slug from restaurant name
  const baseSlug = data.restaurantName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = Math.random().toString(36).substring(2, 7);
  const slug = `${baseSlug}-${suffix}`;

  const restaurant = new Restaurant({
    restaurantName: data.restaurantName,
    slug,
    logo: logoData,
    ownerName: data.ownerName,
    ownerPhone: data.ownerPhone,
    address: {
      street: data.address || '',
      city: data.city || '',
      state: data.state || '',
      pincode: data.pincode || '',
    },
    profileCompleted: true,
    paymentEnabled: false,
    verificationStatus: 'pending',
    createdBy: userId,
  });

  restaurant.profileCompletionPercentage = calculateProfileCompletion(restaurant);
  await restaurant.save();

  // Attach restaurantId to user
  await RestaurantUser.findByIdAndUpdate(userId, { restaurantId: restaurant._id });

  return restaurant;
};

export const getRestaurantByUserId = async (userId) => {
  const restaurant = await Restaurant.findOne({ createdBy: userId });
  if (!restaurant) {
    const error = new Error('No restaurant profile found for this account.');
    error.statusCode = 404;
    throw error;
  }

  // Recalculate completion on fetch
  const completion = calculateProfileCompletion(restaurant);
  if (restaurant.profileCompletionPercentage !== completion) {
    restaurant.profileCompletionPercentage = completion;
    await restaurant.save();
  }

  return restaurant;
};

export const updateProfileService = async (userId, updatePayload, coverFile) => {
  const restaurant = await Restaurant.findOne({ createdBy: userId });
  if (!restaurant) {
    const error = new Error('Restaurant not found');
    error.statusCode = 404;
    throw error;
  }

  // Handle Cover Image upload if provided
  if (coverFile) {
    const uploadedCover = await uploadImageToCloudinary(coverFile, 'craviti/covers');
    if (uploadedCover) {
      restaurant.coverImage = uploadedCover;
    }
  }

  // Basic Details
  if (updatePayload.restaurantName) restaurant.restaurantName = updatePayload.restaurantName;
  if (updatePayload.description !== undefined) restaurant.description = updatePayload.description;
  if (updatePayload.ownerName) restaurant.ownerName = updatePayload.ownerName;
  if (updatePayload.ownerPhone) restaurant.ownerPhone = updatePayload.ownerPhone;

  // Address
  if (updatePayload.address) {
    restaurant.address = {
      street: updatePayload.address.street || restaurant.address.street || '',
      city: updatePayload.address.city || restaurant.address.city || '',
      state: updatePayload.address.state || restaurant.address.state || '',
      pincode: updatePayload.address.pincode || restaurant.address.pincode || '',
    };
  }

  // Timings
  if (updatePayload.timing) {
    restaurant.timing = {
      openingTime: updatePayload.timing.openingTime || restaurant.timing.openingTime,
      closingTime: updatePayload.timing.closingTime || restaurant.timing.closingTime,
    };
  }

  // Tax Info
  if (updatePayload.taxInfo) {
    restaurant.taxInfo = {
      gstNumber: updatePayload.taxInfo.gstNumber !== undefined ? updatePayload.taxInfo.gstNumber : restaurant.taxInfo.gstNumber,
      fssaiNumber: updatePayload.taxInfo.fssaiNumber !== undefined ? updatePayload.taxInfo.fssaiNumber : restaurant.taxInfo.fssaiNumber,
    };
  }

  // Bank Details
  if (updatePayload.bankDetails) {
    const b = updatePayload.bankDetails;
    const isNewSubmission = b.accountNumber && b.ifscCode;

    restaurant.bankDetails = {
      holderName: b.holderName || restaurant.bankDetails.holderName,
      bankName: b.bankName || restaurant.bankDetails.bankName,
      accountNumber: b.accountNumber || restaurant.bankDetails.accountNumber,
      ifscCode: b.ifscCode || restaurant.bankDetails.ifscCode,
      upiId: b.upiId || restaurant.bankDetails.upiId,
      status: isNewSubmission ? 'submitted' : restaurant.bankDetails.status,
    };

    if (isNewSubmission && !restaurant.paymentEnabled) {
      restaurant.verificationStatus = 'submitted';
    }
  }

  restaurant.profileCompletionPercentage = calculateProfileCompletion(restaurant);
  await restaurant.save();

  return restaurant;
};

