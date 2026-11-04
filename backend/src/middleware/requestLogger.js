/**
 * Centralized Production Request Logger Middleware
 * Captures request life-cycle metrics including latency, tenant, and guest identity.
 */
export const requestLogger = (req, res, next) => {
  const startTime = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(startTime);
    const executionTimeMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      route: req.originalUrl || req.url,
      restaurantId: req.restaurantId || req.params?.restaurantId || req.body?.restaurantId || null,
      userId: req.user?._id || req.user?.id || null,
      guestId: req.query?.guestId || req.body?.guestId || req.headers['x-guest-id'] || null,
      orderId: req.params?.orderId || req.params?.id || req.body?.orderId || null,
      statusCode: res.statusCode,
      executionTimeMs: `${executionTimeMs}ms`,
      ip: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'] || 'Unknown',
    };

    // Compact single-line log in dev, structured JSON in prod
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry));
    } else {
      const color =
        res.statusCode >= 500
          ? '\x1b[31m' // Red
          : res.statusCode >= 400
          ? '\x1b[33m' // Yellow
          : '\x1b[32m'; // Green
      const reset = '\x1b[0m';

      console.log(
        `[${logEntry.timestamp}] ${logEntry.method} ${logEntry.route} ${color}${logEntry.statusCode}${reset} - ${logEntry.executionTimeMs} | Restaurant: ${logEntry.restaurantId || 'None'} | User: ${logEntry.userId || 'Guest'}`
      );
    }
  });

  next();
};

export default requestLogger;

