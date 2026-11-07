import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import { getRestaurantAnalyticsService } from '../services/analyticsService.js';

/**
 * Controller to fetch comprehensive production restaurant analytics.
 * GET /api/analytics
 */
export const getRestaurantAnalytics = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurantId;
  const analyticsData = await getRestaurantAnalyticsService(restaurantId, req.query);

  return sendSuccess(
    res,
    'Restaurant analytics loaded successfully',
    analyticsData,
    HTTP_STATUS.OK
  );
});

/**
 * Export analytics report data (CSV stream or JSON)
 * GET /api/analytics/export
 */
export const exportRestaurantAnalytics = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurantId;
  const format = req.query.format || 'csv';
  const analyticsData = await getRestaurantAnalyticsService(restaurantId, req.query);

  if (format === 'json') {
    return res.json({ success: true, data: analyticsData });
  }

  // Generate clean production CSV
  let csv = 'Metric,Value\n';
  csv += `Restaurant,${analyticsData.restaurantName}\n`;
  csv += `Date Range,${analyticsData.dateRange?.label || 'Custom'}\n`;
  csv += `Total Revenue,₹${analyticsData.totalRevenue}\n`;
  csv += `Total Orders,${analyticsData.totalOrders}\n`;
  csv += `Average Order Value,₹${analyticsData.averageOrderValue}\n`;
  csv += `Customers Served,${analyticsData.customersServed}\n`;
  csv += `Active Tables,${analyticsData.activeTables} / ${analyticsData.totalTables}\n`;
  csv += `Today Revenue,₹${analyticsData.todayRevenue}\n`;
  csv += `Pending Orders,${analyticsData.pendingOrders}\n`;
  csv += `Completed Orders,${analyticsData.completedOrders}\n\n`;

  csv += 'Top Selling Dishes\nRank,Item Name,Orders Sold,Revenue (INR)\n';
  (analyticsData.topItems || []).forEach((item) => {
    csv += `${item.rank},"${item.name}",${item.orders},${item.revenue}\n`;
  });

  csv += '\nSales Trend\nTime / Date,Orders,Revenue (INR)\n';
  (analyticsData.salesTrend || []).forEach((trend) => {
    csv += `"${trend.label}",${trend.orders},${trend.revenue}\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="craviti_analytics_${restaurantId}_${Date.now()}.csv"`
  );
  return res.status(200).send(csv);
});
