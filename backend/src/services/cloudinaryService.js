import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';

export const uploadImageToCloudinary = async (file, folder = 'craviti/restaurants') => {
  if (!file) return null;

  if (isCloudinaryConfigured()) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder,
        resource_type: 'image',
      });

      // Cleanup local temp file if exists
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return {
        url: result.secure_url,
        public_id: result.public_id,
      };
    } catch (error) {
      console.error(`Cloudinary upload failed: ${error.message}`);
      // Fallback to local path
    }
  }

  // Fallback: local static asset or public URL
  const filename = path.basename(file.path);
  return {
    url: `/uploads/${filename}`,
    public_id: `local_${Date.now()}_${filename}`,
  };
};

/**
 * Cloudinary Cleanup Standard (Standard 21)
 * Deletes old asset when replaced to prevent orphan uploads.
 */
export const deleteImageFromCloudinary = async (publicId) => {
  if (!publicId) return;

  if (publicId.startsWith('local_')) {
    try {
      const parts = publicId.split('_');
      const filename = parts.slice(2).join('_');
      if (filename) {
        const localPath = path.join(process.cwd(), 'src/uploads', filename);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
          console.log(`🗑️ Cleaned up orphan local upload: ${filename}`);
        }
      }
    } catch (e) {
      // ignore local delete error
    }
    return;
  }

  if (isCloudinaryConfigured()) {
    try {
      await cloudinary.uploader.destroy(publicId);
      console.log(`🗑️ Cleaned up Cloudinary asset: ${publicId}`);
    } catch (error) {
      console.warn(`⚠️ Cloudinary asset deletion warning (${publicId}): ${error.message}`);
    }
  }
};
