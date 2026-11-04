import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import { getRestaurantDashboardService } from '../services/dashboardService.js';

/**
 * Controller to fetch live production metrics for the Restaurant Dashboard.
 * GET /api/dashboard
 */
export const getRestaurantDashboard = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurantId;
  const dashboardData = await getRestaurantDashboardService(restaurantId, req.user);
  return sendSuccess(
    res,
    'Dashboard data loaded successfully',
    dashboardData,
    HTTP_STATUS.OK
  );
});

