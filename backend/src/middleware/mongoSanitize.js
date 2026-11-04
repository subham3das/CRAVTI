/**
 * Sanitizes request input to prevent NoSQL Operator Injection ($gt, $where, etc.)
 */
const sanitize = (val) => {
  if (Array.isArray(val)) {
    return val.map(sanitize);
  }
  if (val !== null && typeof val === 'object') {
    const cleanObj = {};
    for (const [key, value] of Object.entries(val)) {
      if (!key.startsWith('$') && !key.includes('.')) {
        cleanObj[key] = sanitize(value);
      }
    }
    return cleanObj;
  }
  return val;
};

export const mongoSanitize = (req, res, next) => {
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  next();
};

export default mongoSanitize;

