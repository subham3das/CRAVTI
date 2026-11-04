import jwt from 'jsonwebtoken';

export const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'craviti_jwt_secret_dev_key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign({ id: userId }, secret, { expiresIn });
};

