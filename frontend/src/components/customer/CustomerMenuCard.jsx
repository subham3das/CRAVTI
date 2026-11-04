import React from 'react';
import { FiPlus, FiMinus, FiClock, FiStar, FiThumbsUp } from 'react-icons/fi';
import { CustomerVegBadge } from './CustomerVegBadge';
import { formatCurrency, safeNumber } from '../../utils/formatters';
import { ImageWithFallback } from '../ImageWithFallback';

export const CustomerMenuCard = React.memo(({
  item = {},
  quantity = 0,
  onAdd,
  onUpdateQuantity,
  onSelect,
}) => {
  const isOutOfStock = item?.availability === 'out_of_stock';
  const hasDiscount = item?.discountType && item.discountType !== 'none' && safeNumber(item.discountValue) > 0;
  const isPopular = item?.popular;
  const isRecommended = item?.recommended;

  const handleCardClick = () => {
    if (onSelect) onSelect(item);
  };

  const handleAddClick = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    onAdd && onAdd(item);
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    onUpdateQuantity && onUpdateQuantity(item?._id, quantity + 1);
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    onUpdateQuantity && onUpdateQuantity(item?._id, quantity - 1);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm active:scale-[0.99] transition-all cursor-pointer flex gap-3 relative overflow-hidden ${
        isOutOfStock ? 'opacity-60 grayscale-[40%]' : 'hover:border-slate-200'
      }`}
    >
      {/* Left: Info */}
      <div className="flex-1 flex flex-col justify-between min-w-0 pr-1">
        <div>
          {/* Top Row: Type & Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <CustomerVegBadge type={item?.foodType} />

            {isPopular && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200/80">
                <FiStar className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Popular
              </span>
            )}

            {isRecommended && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/80">
                <FiThumbsUp className="w-2.5 h-2.5 text-emerald-600" /> Must Try
              </span>
            )}
          </div>

          {/* Item Name */}
          <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-1">
            {item?.itemName ?? 'Dish'}
          </h3>

          {/* Description */}
          {item?.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed font-normal">
              {item.description}
            </p>
          )}
        </div>

        {/* Bottom Row: Price & Prep Time */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="font-extrabold text-sm text-slate-900">
              {formatCurrency(item?.sellingPrice || item?.price || 0)}
            </span>

            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through">
                {formatCurrency(item?.price || 0)}
              </span>
            )}
          </div>

          {item?.preparationTime && (
            <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-0.5 shrink-0">
              <FiClock className="w-2.5 h-2.5" /> {item.preparationTime}m
            </span>
          )}
        </div>
      </div>

      {/* Right: Image & Add Stepper */}
      <div className="w-24 shrink-0 flex flex-col justify-between items-center">
        <div className="w-24 h-24 rounded-2xl overflow-hidden relative bg-slate-50 border border-slate-100 shadow-2xs">
          <ImageWithFallback
            src={item?.image?.url}
            alt={item?.itemName}
            type="menu"
            className="w-full h-full object-cover"
          />

          {isOutOfStock && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center text-center p-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-rose-600 px-2 py-0.5 rounded shadow">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Add Button / Stepper */}
        <div className="mt-2 w-full">
          {isOutOfStock ? (
            <button
              disabled
              className="w-full py-1 text-xs font-semibold text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed text-center"
            >
              Unavailable
            </button>
          ) : quantity === 0 ? (
            <button
              type="button"
              onClick={handleAddClick}
              className="w-full py-1.5 bg-emerald-50 hover:bg-[#16A34A] text-[#16A34A] hover:text-white border border-[#16A34A]/40 hover:border-[#16A34A] rounded-xl text-xs font-bold tracking-wider transition-all shadow-sm flex items-center justify-center gap-1 active:scale-95"
            >
              <FiPlus className="w-3.5 h-3.5" /> ADD
            </button>
          ) : (
            <div className="w-full flex items-center justify-between bg-[#16A34A] text-white rounded-xl px-2 py-1 shadow-sm">
              <button
                type="button"
                onClick={handleDecrement}
                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-emerald-700 active:scale-90 transition-transform"
              >
                <FiMinus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-bold px-1">{quantity}</span>
              <button
                type="button"
                onClick={handleIncrement}
                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-emerald-700 active:scale-90 transition-transform"
              >
                <FiPlus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default CustomerMenuCard;
