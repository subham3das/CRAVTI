import { v2 as cloudinary } from 'cloudinary';
import env from './env.js';

const isCloudinaryConfigured = () => {
  const name = env.CLOUDINARY_CLOUD_NAME;
  const key = env.CLOUDINARY_API_KEY;
  const secret = env.CLOUDINARY_API_SECRET;

  return (
    name &&
    key &&
    secret &&
    name !== 'YOUR_CLOUDINARY_CLOUD_NAME' &&
    key !== 'YOUR_CLOUDINARY_API_KEY' &&
    secret !== 'YOUR_CLOUDINARY_API_SECRET'
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  console.log('✅ Cloudinary initialized with production credentials.');
} else {
  console.warn('⚠️ Cloudinary credentials placeholder detected. Fallback storage enabled.');
}

export { cloudinary, isCloudinaryConfigured };
