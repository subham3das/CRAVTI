import {
  createOnboardingRestaurant,
  getRestaurantByUserId,
} from '../services/restaurantService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';

export const onboardRestaurant = asyncHandler(async (req, res) => {
  const { restaurantName, ownerName, ownerPhone, address, city, state, pincode } = req.body;
  const logoFile = req.file;

  const restaurant = await createOnboardingRestaurant(
    req.user._id,
    {
      restaurantName,
      ownerName,
      ownerPhone,
      address,
      city,
      state,
      pincode,
    },
    logoFile
  );

  return sendSuccess(
    res,
    'Restaurant onboarded successfully! Welcome to your dashboard.',
    restaurant,
    HTTP_STATUS.CREATED,
    { data: restaurant }
  );
});

export const getMyRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await getRestaurantByUserId(req.user._id);
  return sendSuccess(res, 'Restaurant fetched successfully', restaurant, HTTP_STATUS.OK, { data: restaurant });
});
