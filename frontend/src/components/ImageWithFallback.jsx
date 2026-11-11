import { useState } from 'react';
import { FiImage, FiUser } from 'react-icons/fi';
import { MdOutlineRestaurant, MdQrCode2 } from 'react-icons/md';
import { getImageUrl } from '../utils/image';

/**
 * ImageWithFallback (Standard 5)
 * Gracefully renders branded placeholders when images fail or are missing.
 */
export const ImageWithFallback = ({
  src,
  alt = '',
  type = 'menu', // 'menu' | 'logo' | 'cover' | 'avatar' | 'qr' | 'generic'
  className = '',
  containerClassName = '',
  fallbackContent,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  const resolvedSrc = getImageUrl(src);
  const isInvalidSrc = !resolvedSrc || resolvedSrc === '' || resolvedSrc.includes('undefined') || resolvedSrc.includes('null');

  if (hasError || isInvalidSrc) {
    if (fallbackContent) {
      return fallbackContent;
    }

    if (type === 'logo') {
      return (
        <div
          className={`flex items-center justify-center bg-emerald-50 text-[#16A34A] border border-emerald-200 font-bold ${containerClassName || className}`}
          title={alt || 'Restaurant Logo'}
        >
          <MdOutlineRestaurant className="w-1/2 h-1/2" />
        </div>
      );
    }

    if (type === 'cover') {
      return (
        <div
          className={`flex flex-col items-center justify-center bg-gradient-to-r from-emerald-600 to-teal-700 text-white/80 ${containerClassName || className}`}
          title={alt || 'Cover Image'}
        >
          <MdOutlineRestaurant className="w-8 h-8 opacity-60" />
          <span className="text-xs font-semibold mt-1 opacity-75">CRAVITI DINING</span>
        </div>
      );
    }

    if (type === 'avatar') {
      return (
        <div
          className={`flex items-center justify-center bg-slate-100 text-slate-400 rounded-full border border-slate-200 ${containerClassName || className}`}
          title={alt || 'User'}
        >
          <FiUser className="w-1/2 h-1/2" />
        </div>
      );
    }

    if (type === 'qr') {
      return (
        <div
          className={`flex items-center justify-center bg-slate-50 text-slate-400 border border-slate-200 rounded-lg ${containerClassName || className}`}
          title={alt || 'QR'}
        >
          <MdQrCode2 className="w-1/2 h-1/2" />
        </div>
      );
    }

    // Default / Menu item placeholder
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-100 text-slate-400 border border-slate-200 ${containerClassName || className}`}
        title={alt || 'Food Dish'}
      >
        <FiImage className="w-6 h-6 opacity-60" />
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
      {...props}
    />
  );
};

export default ImageWithFallback;

