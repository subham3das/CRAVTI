import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

const isCloudinaryConfigured = () => {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;

  return (
    name &&
    key &&
    secret &&
    name !== 'your_cloud_name' &&
    key !== 'your_api_key' &&
    secret !== 'your_api_secret'
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('✅ Cloudinary initialized with production credentials.');
} else {
  console.warn('⚠️ Cloudinary credentials placeholder detected. Fallback storage enabled.');
}

export { cloudinary, isCloudinaryConfigured };

