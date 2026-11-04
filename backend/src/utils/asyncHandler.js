/**
 * Wraps an async express route handler to eliminate try/catch boilerplate.
 * Any unhandled promise rejection is caught and passed directly to next(err).
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;

