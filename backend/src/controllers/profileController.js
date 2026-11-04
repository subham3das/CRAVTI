import { updateProfileService, getRestaurantByUserId } from '../services/restaurantService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import { emitSyncEvent } from '../config/socket.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';

export const getProfile = asyncHandler(async (req, res) => {
  const restaurant = await getRestaurantByUserId(req.user._id);
  return sendSuccess(res, 'Profile fetched successfully', restaurant, HTTP_STATUS.OK, { data: restaurant });
});

export const updateProfile = asyncHandler(async (req, res) => {
  let payload = req.body;

  // Support JSON stringified nested objects when sent with multipart form data
  if (typeof payload.address === 'string') {
    try { payload.address = JSON.parse(payload.address); } catch {}
  }
  if (typeof payload.timing === 'string') {
    try { payload.timing = JSON.parse(payload.timing); } catch {}
  }
  if (typeof payload.taxInfo === 'string') {
    try { payload.taxInfo = JSON.parse(payload.taxInfo); } catch {}
  }
  if (typeof payload.bankDetails === 'string') {
    try { payload.bankDetails = JSON.parse(payload.bankDetails); } catch {}
  }

  const coverFile = req.file;
  const updated = await updateProfileService(req.user._id, payload, coverFile);

  // Phase 4.2: Real-time synchronization to Admin Panel
  emitSyncEvent({
    event: SOCKET_EVENTS.RESTAURANT_UPDATED,
    restaurantId: updated._id,
    data: { restaurant: updated },
    target: 'both',
  });

  return sendSuccess(
    res,
    'Restaurant profile updated successfully.',
    updated,
    HTTP_STATUS.OK,
    { data: updated }
  );
});
