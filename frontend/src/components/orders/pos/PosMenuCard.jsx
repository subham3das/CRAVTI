import React from 'react';
import { FiPlus, FiMinus } from 'react-icons/fi';
import { CustomerVegBadge } from '../../customer/CustomerVegBadge';
import { ImageWithFallback } from '../../ImageWithFallback';
import { formatCurrency, safeNumber } from '../../../utils/formatters';
import { safeString } from '../../../utils/string';
import { getImageUrl } from '../../../utils/image';

export const PosMenuCard = React.memo(
  ({
    item,
    quantity = 0,
    onAdd,
    onUpdateQuantity,
  }) => {
    const isOutOfStock = item.availability === 'out_of_stock';
    const originalPrice = safeNumber(item.price || item.sellingPrice || 0);
    const sellingPrice = safeNumber(item.sellingPrice || item.price || 0);
    const hasDiscount =
      item.discountType &&
      item.discountType !== 'none' &&
      safeNumber(item.discountValue) > 0 &&
      originalPrice > sellingPrice;

    const discountLabel =
      item.discountType === 'percentage'
        ? `${Math.round(item.discountValue)}% OFF`
        : item.discountType === 'flat'
        ? `₹${Math.round(item.discountValue)} OFF`
        : '';

    return (
      <div
        className={`group relative bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between select-none ${
          isOutOfStock ? 'opacity-55 grayscale cursor-not-allowed' : ''
        }`}
      >
        <div className="flex gap-2.5">
          {/* Thumbnail */}
          <div className="w-16 h-16 rounded-lg overflow-hidden relative bg-slate-100 shrink-0 border border-slate-100">
            <ImageWithFallback
              src={getImageUrl(item.image)}
              alt={safeString(item.itemName)}
              type="menu"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {isOutOfStock && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[0.5px] flex items-center justify-center p-0.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-white bg-rose-600 px-1.5 py-0.5 rounded shadow">
                  Sold Out
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <CustomerVegBadge type={item.foodType} />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                {item.categoryId?.categoryName || 'Item'}
              </span>
              {hasDiscount && discountLabel && (
                <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200/70 px-1 py-0.2 rounded">
                  {discountLabel}
                </span>
              )}
            </div>

            <h4
              className="font-bold text-xs text-slate-900 leading-snug line-clamp-2 mt-1"
              title={item.itemName}
            >
              {item.itemName}
            </h4>

            {/* Pricing */}
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-extrabold text-xs text-slate-900">
                {formatCurrency(sellingPrice)}
              </span>
              {hasDiscount && (
                <span className="text-[10px] text-slate-400 line-through">
                  {formatCurrency(originalPrice)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Area: Compact Modern Buttons */}
        <div className="mt-2.5 pt-2 border-t border-slate-100/90 flex items-center justify-end">
          {isOutOfStock ? (
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider py-1">
              Unavailable
            </span>
          ) : quantity === 0 ? (
            <button
              type="button"
              onClick={() => onAdd(item)}
              className="w-full sm:w-auto px-3 py-1.5 bg-slate-100 hover:bg-slate-900 text-slate-800 hover:text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all duration-150 active:scale-95 cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <FiPlus className="w-3.5 h-3.5" />
              <span>ADD</span>
            </button>
          ) : (
            <div className="w-full sm:w-auto flex items-center justify-between gap-1.5 bg-slate-900 text-white rounded-lg px-2 py-1 shadow-xs">
              <button
                type="button"
                onClick={() => onUpdateQuantity(quantity - 1)}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-800 text-slate-200 hover:text-white transition-colors active:scale-90"
                title="Decrease"
              >
                <FiMinus className="w-3 h-3" />
              </button>
              <span className="text-xs font-black min-w-5 text-center px-1 font-mono">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQuantity(quantity + 1)}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-800 text-slate-200 hover:text-white transition-colors active:scale-90"
                title="Increase"
              >
                <FiPlus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

PosMenuCard.displayName = 'PosMenuCard';
export default PosMenuCard;

